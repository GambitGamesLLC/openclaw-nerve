import { useState, useCallback, useEffect, useRef } from 'react';
import type { TreeEntry } from '../types';

function findEntry(entries: TreeEntry[], target: string): TreeEntry | null {
  for (const entry of entries) {
    if (entry.path === target) return entry;
    if (entry.children) {
      const found = findEntry(entry.children, target);
      if (found) return found;
    }
  }
  return null;
}

const STORAGE_KEY = 'nerve-file-tree-expanded';

/** Load expanded paths from localStorage for persistence. */
function loadExpandedPaths(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set<string>();
}

/** Save expanded paths to localStorage for persistence. */
function saveExpandedPaths(paths: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...paths]));
  } catch { /* ignore */ }
}

/** Merge freshly loaded children into the tree (immutable update). */
function mergeChildren(
  entries: TreeEntry[],
  parentPath: string,
  children: TreeEntry[],
): TreeEntry[] {
  return entries.map((entry) => {
    if (entry.path === parentPath && entry.type === 'directory') {
      return { ...entry, children };
    }
    if (entry.children && entry.type === 'directory') {
      return { ...entry, children: mergeChildren(entry.children, parentPath, children) };
    }
    return entry;
  });
}

/** Clear cached children for a directory entry and reset to unloaded state */
function clearEntryFromTree(entries: TreeEntry[], targetPath: string): TreeEntry[] {
  return entries.map((entry) => {
    if (entry.path === targetPath && entry.type === 'directory') {
      // Reset to unloaded state
      return { ...entry, children: null };
    }
    if (entry.children && entry.type === 'directory') {
      // Recursively process children
      return { ...entry, children: clearEntryFromTree(entry.children, targetPath) };
    }
    return entry;
  });
}

/** Hook for managing file tree state with workspace info and persistence. */
export function useFileTree() {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const entriesRef = useRef<TreeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(loadExpandedPaths);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [workspaceInfo, setWorkspaceInfo] = useState<{ isCustomWorkspace: boolean; rootPath: string } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  // Persist expanded paths
  useEffect(() => {
    saveExpandedPaths(expandedPaths);
  }, [expandedPaths]);

  // Fetch a directory's children
  const fetchChildren = useCallback(async (dirPath: string): Promise<TreeEntry[] | null> => {
    try {
      const params = dirPath ? `?path=${encodeURIComponent(dirPath)}&depth=1` : '?depth=1';
      const res = await fetch(`/api/files/tree${params}`);
      if (!res.ok) {
        if (dirPath && (res.status === 400 || res.status === 404)) {
          // Evict this path from expandedPaths and clear cached children
          setExpandedPaths(prev => {
            const next = new Set(prev);
            // Remove the path and all descendants
            for (const path of next) {
              if (path === dirPath || path.startsWith(`${dirPath}/`)) {
                next.delete(path);
              }
            }
            return next;
          });

          // Clear cached children for this entry
          setEntries(prev => {
            return clearEntryFromTree(prev, dirPath);
          });
        }
        return null;
      }
      const data = await res.json();
      if (data.ok && data.workspaceInfo) {
        setWorkspaceInfo(data.workspaceInfo);
      }
      return data.ok ? data.entries : null;
    } catch {
      return null;
    }
  }, [setExpandedPaths, setEntries]);

  // Initial load
  const loadRoot = useCallback(async () => {
    setLoading(true);
    setError(null);
    const children = await fetchChildren('');
    if (!mountedRef.current) return;

    if (children) {
      setEntries(children);

      // Re-expand previously expanded directories
      const expanded = loadExpandedPaths();
      if (expanded.size > 0) {
        // Fetch children for each expanded path (in parallel)
        const promises = [...expanded].map(async (p) => {
          const ch = await fetchChildren(p);
          return ch ? { path: p, children: ch } : null;
        });
        const results = await Promise.all(promises);
        if (!mountedRef.current) return;

        let tree = children;
        for (const r of results) {
          if (r) tree = mergeChildren(tree, r.path, r.children);
        }
        setEntries(tree);
      }
    } else {
      setError('Failed to load file tree');
    }
    setLoading(false);
  }, [fetchChildren]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
  useEffect(() => { void loadRoot(); }, [loadRoot]);

  const toggleDirectory = useCallback(async (dirPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
        return next;
      }
      next.add(dirPath);
      return next;
    });

    // If collapsing or children already loaded, just toggle
    if (expandedPaths.has(dirPath)) return;

    // Check if children are already loaded in the tree
    const entry = findEntry(entries, dirPath);
    if (entry?.children !== null && entry?.children !== undefined) return;

    // Fetch children
    setLoadingPaths((prev) => new Set([...prev, dirPath]));
    const children = await fetchChildren(dirPath);
    if (!mountedRef.current) return;
    setLoadingPaths((prev) => {
      const next = new Set(prev);
      next.delete(dirPath);
      return next;
    });

    if (children) {
      setEntries((prev) => mergeChildren(prev, dirPath, children));
    }
  }, [expandedPaths, entries, fetchChildren]);

  const selectFile = useCallback((filePath: string) => {
    setSelectedPath(filePath);
  }, []);

  const refresh = useCallback(() => {
    // Clear cached children so everything re-fetches
    setEntries([]);
    loadRoot();
  }, [loadRoot]);

  /** Refresh a specific directory (or root) when a file changes externally. */
  const refreshDirectory = useCallback(async (dirPath: string) => {
    const children = await fetchChildren(dirPath);
    if (!mountedRef.current || !children) return;

    if (!dirPath) {
      // Root — just replace top-level entries (preserve expanded subdirs)
      setEntries((prev) => {
        // Keep expanded children from prev, merge with fresh top-level
        return children.map(fresh => {
          const existing = prev.find(e => e.path === fresh.path);
          if (existing?.children && fresh.type === 'directory') {
            return { ...fresh, children: existing.children };
          }
          return fresh;
        });
      });
    } else {
      setEntries((prev) => mergeChildren(prev, dirPath, children));
    }
  }, [fetchChildren]);

  /**
   * Handle an external file change event.
   * Refreshes the parent directory of the changed file so the tree
   * picks up new/deleted files.
   */
  const handleFileChange = useCallback((changedPath: string) => {
    const parentDir = changedPath.includes('/')
      ? changedPath.substring(0, changedPath.lastIndexOf('/'))
      : '';
    // Only refresh if the parent is expanded (or is root)
    if (!parentDir || expandedPaths.has(parentDir)) {
      refreshDirectory(parentDir);
    }
  }, [expandedPaths, refreshDirectory]);

  const ensureDirectoryLoaded = useCallback(async (dirPath: string) => {
    const entry = findEntry(entriesRef.current, dirPath);
    if (entry?.type !== 'directory') return;
    if (entry.children !== null && entry.children !== undefined) return;

    setLoadingPaths((prev) => new Set([...prev, dirPath]));
    const children = await fetchChildren(dirPath);
    if (!mountedRef.current) return;

    setLoadingPaths((prev) => {
      const next = new Set(prev);
      next.delete(dirPath);
      return next;
    });

    if (children) {
      setEntries((prev) => {
        const next = mergeChildren(prev, dirPath, children);
        entriesRef.current = next;
        return next;
      });
    }
  }, [fetchChildren]);

  const revealPath = useCallback(async (targetPath: string, kind: 'file' | 'directory') => {
    const normalized = targetPath.replace(/^\.\//, '').replace(/\/+$|^\/+/, '');
    if (!normalized) return;

    const segments = normalized.split('/').filter(Boolean);
    const ancestors = kind === 'directory'
      ? segments.map((_, index) => segments.slice(0, index + 1).join('/'))
      : segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'));

    for (const dirPath of ancestors) {
      setExpandedPaths((prev) => {
        if (prev.has(dirPath)) return prev;
        const next = new Set(prev);
        next.add(dirPath);
        return next;
      });
      await ensureDirectoryLoaded(dirPath);
    }

    setSelectedPath(normalized);
  }, [ensureDirectoryLoaded]);

  return {
    entries,
    loading,
    error,
    expandedPaths,
    selectedPath,
    loadingPaths,
    workspaceInfo,
    toggleDirectory,
    selectFile,
    refresh,
    handleFileChange,
    revealPath,
  };
}
