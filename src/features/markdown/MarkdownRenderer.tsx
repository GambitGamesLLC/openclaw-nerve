import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { hljs } from '@/lib/highlight';
import { sanitizeHtml } from '@/lib/sanitize';
import { escapeRegex } from '@/lib/constants';
import { CodeBlockActions } from './CodeBlockActions';
import { renderInlineReferences, type ReferencePlanSummary } from './inlineReferences';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  searchQuery?: string;
  suppressImages?: boolean;
  plans?: ReferencePlanSummary[];
  pathLinkPrefixes?: string[];
  onOpenPlanReference?: (path: string) => void;
  onOpenPath?: (path: string) => void;
  onOpenTask?: (taskId: string) => void;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  
  // split() with a capture group alternates: non-match, match, non-match, ...
  // Odd indices are always the captured matches — no regex.test() needed
  return parts.map((part, i) => 
    i % 2 === 1 ? (
      <mark key={i} className="search-highlight">{part}</mark>
    ) : part
  );
}

// Process React children to apply search highlighting and conservative inline references.
function processChildren(
  children: React.ReactNode,
  options: {
    searchQuery?: string;
    plans?: ReferencePlanSummary[];
    pathLinkPrefixes?: string[];
    onOpenPlanReference?: (path: string) => void;
    onOpenPath?: (path: string) => void;
    onOpenTask?: (taskId: string) => void;
  } = {},
): React.ReactNode {
  const { searchQuery } = options;

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const hasReferenceHandlers = Boolean(options.onOpenPlanReference || options.onOpenPath || options.onOpenTask);
      return hasReferenceHandlers
        ? renderInlineReferences(child, options)
        : highlightText(child, searchQuery || '');
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      if (typeof child.type === 'string' && (child.type === 'code' || child.type === 'a')) {
        return child;
      }
      if (child.props.children) {
        return React.cloneElement(child, {
          children: processChildren(child.props.children, options),
        });
      }
    }
    return child;
  });
}

// ─── Code Block with actions ─────────────────────────────────────────────────

function CodeBlock({ code, language, highlightedHtml }: {
  code: string;
  language: string;
  highlightedHtml?: string;
}) {
  return (
    <div className="code-block-wrapper">
      <CodeBlockActions code={code} language={language} />
      <pre className="hljs">
        <span className="code-lang">{language}</span>
        {highlightedHtml
          ? <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          : <code>{code}</code>
        }
      </pre>
    </div>
  );
}

// ─── Main renderer ───────────────────────────────────────────────────────────

/** Render markdown content with syntax highlighting, search-term highlighting, and inline charts. */
export function MarkdownRenderer({
  content,
  className = '',
  searchQuery,
  suppressImages,
  plans,
  pathLinkPrefixes,
  onOpenPlanReference,
  onOpenPath,
  onOpenTask,
}: MarkdownRendererProps) {
  // Memoize components object to avoid unnecessary ReactMarkdown re-renders.
  // Only recreated when searchQuery or suppressImages changes.
  const referenceOptions = useMemo(() => ({
    searchQuery,
    plans,
    pathLinkPrefixes,
    onOpenPlanReference,
    onOpenPath,
    onOpenTask,
  }), [searchQuery, plans, pathLinkPrefixes, onOpenPlanReference, onOpenPath, onOpenTask]);

  const components = useMemo(() => ({
    // Highlight search terms in text nodes and conservatively surface inline references.
    p: ({ children }: { children?: React.ReactNode }) => (
      <p>{processChildren(children, referenceOptions)}</p>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li>{processChildren(children, referenceOptions)}</li>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td>{processChildren(children, referenceOptions)}</td>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th>{processChildren(children, referenceOptions)}</th>
    ),
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1>{processChildren(children, referenceOptions)}</h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2>{processChildren(children, referenceOptions)}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3>{processChildren(children, referenceOptions)}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4>{processChildren(children, referenceOptions)}</h4>
    ),
    h5: ({ children }: { children?: React.ReactNode }) => (
      <h5>{processChildren(children, referenceOptions)}</h5>
    ),
    h6: ({ children }: { children?: React.ReactNode }) => (
      <h6>{processChildren(children, referenceOptions)}</h6>
    ),
    code: ({ className: codeClassName, children, ...props }: { className?: string; children?: React.ReactNode }) => {
      const match = /language-(\w+)/.exec(codeClassName || '');
      const lang = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const inline = !codeClassName;

      if (!inline && lang) {
        try {
          const highlighted = hljs.getLanguage(lang)
            ? hljs.highlight(codeString, { language: lang }).value
            : hljs.highlightAuto(codeString).value;

          return (
            <CodeBlock
              code={codeString}
              language={lang}
              highlightedHtml={sanitizeHtml(highlighted)}
            />
          );
        } catch {
          return (
            <CodeBlock code={codeString} language={lang} />
          );
        }
      }

      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="table-wrapper">
        <table className="markdown-table">{children}</table>
      </div>
    ),
    a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
        {children}
      </a>
    ),
    ...(suppressImages ? { img: () => null } : {}), // When set, images handled by extractedImages + ImageLightbox
  }), [referenceOptions, searchQuery, suppressImages]);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
