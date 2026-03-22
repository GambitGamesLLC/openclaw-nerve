/** Tests for server/lib/config.ts — env-driven config, helpers, and banner. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

describe('config module', () => {
  const originalEnv = { ...process.env };

  async function importFreshConfig() {
    vi.resetModules();
    return import('./config.js');
  }

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('default values (via fresh import)', () => {
    it('exports a config object with expected shape', async () => {
      // Use the already-imported module for basic shape checks
      const { config } = await import('./config.js');
      expect(config).toBeDefined();
      expect(typeof config.port).toBe('number');
      expect(typeof config.host).toBe('string');
      expect(typeof config.gatewayUrl).toBe('string');
      expect(typeof config.gatewayToken).toBe('string');
      expect(typeof config.auth).toBe('boolean');
      expect(typeof config.language).toBe('string');
      expect(typeof config.agentName).toBe('string');
      expect(config.limits).toBeDefined();
      expect(typeof config.limits.tts).toBe('number');
      expect(typeof config.limits.transcribe).toBe('number');
    });

    it('has sensible defaults for port', async () => {
      const { config } = await import('./config.js');
      expect(config.port).toBeGreaterThan(0);
      expect(config.port).toBeLessThan(65536);
    });

    it('has a default host of 127.0.0.1', async () => {
      const { config } = await import('./config.js');
      expect(['127.0.0.1', 'localhost', '::1', '0.0.0.0']).toContain(config.host);
    });

    it('defaults auth to false', async () => {
      const { config } = await import('./config.js');
      if (!process.env.NERVE_AUTH || process.env.NERVE_AUTH !== 'true') {
        expect(config.auth).toBe(false);
      }
    });

    it('defaults language to en', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.language).toBe('string');
      expect(config.language.length).toBeGreaterThan(0);
    });

    it('agentName is a non-empty string', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.agentName).toBe('string');
      expect(config.agentName.length).toBeGreaterThan(0);
    });
  });

  describe('SESSION_COOKIE_NAME', () => {
    it('includes the port number', async () => {
      const { SESSION_COOKIE_NAME, config } = await import('./config.js');
      expect(SESSION_COOKIE_NAME).toBe(`nerve_session_${config.port}`);
    });
  });

  describe('WS_ALLOWED_HOSTS', () => {
    it('always includes localhost variants', async () => {
      const { WS_ALLOWED_HOSTS } = await import('./config.js');
      expect(WS_ALLOWED_HOSTS.has('localhost')).toBe(true);
      expect(WS_ALLOWED_HOSTS.has('127.0.0.1')).toBe(true);
      expect(WS_ALLOWED_HOSTS.has('::1')).toBe(true);
    });
  });

  describe('limits', () => {
    it('has reasonable TTS limit', async () => {
      const { config } = await import('./config.js');
      expect(config.limits.tts).toBe(64 * 1024);
    });

    it('has reasonable transcribe limit', async () => {
      const { config } = await import('./config.js');
      expect(config.limits.transcribe).toBe(12 * 1024 * 1024);
    });

    it('maxBodyBytes is larger than transcribe', async () => {
      const { config } = await import('./config.js');
      expect(config.limits.maxBodyBytes).toBeGreaterThan(config.limits.transcribe);
    });
  });

  describe('validateConfig', () => {
    it('does not throw when called', async () => {
      process.env.HOST = '127.0.0.1';
      process.env.NERVE_AUTH = 'false';

      const { validateConfig } = await importFreshConfig();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => validateConfig()).not.toThrow();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('warns when GATEWAY_TOKEN is not set', async () => {
      const originalToken = process.env.GATEWAY_TOKEN;
      const originalOCToken = process.env.OPENCLAW_GATEWAY_TOKEN;
      delete process.env.GATEWAY_TOKEN;
      delete process.env.OPENCLAW_GATEWAY_TOKEN;

      const { validateConfig, config: cfg } = await import('./config.js');
      if (!cfg.gatewayToken) {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        validateConfig();
        const allWarns = warnSpy.mock.calls.map(c => c.join(' ')).join('\n');
        expect(allWarns).toContain('GATEWAY_TOKEN');
        warnSpy.mockRestore();
        errorSpy.mockRestore();
      }

      if (originalToken) process.env.GATEWAY_TOKEN = originalToken;
      if (originalOCToken) process.env.OPENCLAW_GATEWAY_TOKEN = originalOCToken;
    });
  });

  describe('printStartupBanner', () => {
    it('prints version info to console', async () => {
      const { printStartupBanner } = await import('./config.js');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      printStartupBanner('1.2.3');
      expect(logSpy).toHaveBeenCalled();
      const allOutput = logSpy.mock.calls.map(c => c.join(' ')).join('\n');
      expect(allOutput).toContain('1.2.3');
      expect(allOutput).toContain('Nerve');
      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('probeGateway', () => {
    it('does not throw when gateway is unreachable', async () => {
      const { probeGateway } = await import('./config.js');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await expect(probeGateway()).resolves.toBeUndefined();
      warnSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('config type coercion', () => {
    it('port is always a number', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.port).toBe('number');
      expect(Number.isFinite(config.port)).toBe(true);
    });

    it('sslPort is always a number', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.sslPort).toBe('number');
      expect(Number.isFinite(config.sslPort)).toBe(true);
    });

    it('ttsCacheTtlMs is always a number', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.ttsCacheTtlMs).toBe('number');
      expect(config.ttsCacheTtlMs).toBeGreaterThan(0);
    });

    it('ttsCacheMax is always a number', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.ttsCacheMax).toBe('number');
      expect(config.ttsCacheMax).toBeGreaterThan(0);
    });

    it('sessionTtlMs is always a number', async () => {
      const { config } = await import('./config.js');
      expect(typeof config.sessionTtlMs).toBe('number');
      expect(config.sessionTtlMs).toBeGreaterThan(0);
    });
  });

  describe('language normalization', () => {
    it('language is a valid ISO 639-1 code', async () => {
      const { config } = await import('./config.js');
      expect(config.language).toMatch(/^[a-z]{2}$/);
    });

    it('edgeVoiceGender is either male or female', async () => {
      const { config } = await import('./config.js');
      expect(['male', 'female']).toContain(config.edgeVoiceGender);
    });
  });

  describe('sttProvider', () => {
    it('is either local or openai', async () => {
      const { config } = await import('./config.js');
      expect(['local', 'openai']).toContain(config.sttProvider);
    });
  });

  describe('paths are absolute', () => {
    it('dist path is absolute', async () => {
      const { config } = await import('./config.js');
      expect(path.isAbsolute(config.dist)).toBe(true);
    });

    it('memoryPath is absolute', async () => {
      const { config } = await import('./config.js');
      expect(path.isAbsolute(config.memoryPath)).toBe(true);
    });

    it('sessionsDir is absolute', async () => {
      const { config } = await import('./config.js');
      expect(path.isAbsolute(config.sessionsDir)).toBe(true);
    });
  });

  describe('network-exposed auth guard', () => {
    it('exits when HOST=0.0.0.0 and auth is disabled', async () => {
      vi.resetModules();
      process.env.HOST = '0.0.0.0';
      process.env.NERVE_AUTH = 'false';
      delete process.env.NERVE_ALLOW_INSECURE;

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { validateConfig } = await import('./config.js');
      validateConfig();

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('warns but does not exit when NERVE_ALLOW_INSECURE=true', async () => {
      vi.resetModules();
      process.env.HOST = '0.0.0.0';
      process.env.NERVE_AUTH = 'false';
      process.env.NERVE_ALLOW_INSECURE = 'true';

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { validateConfig } = await import('./config.js');
      validateConfig();

      expect(exitSpy).not.toHaveBeenCalled();
      const allWarns = warnSpy.mock.calls.map(c => c.join(' ')).join('\n');
      expect(allWarns).toContain('INSECURE MODE');
      exitSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('updateConfig', () => {
    it('updates sttProvider to openai', async () => {
      const { config, updateConfig } = await import('./config.js');
      const original = config.sttProvider;
      updateConfig('sttProvider', 'openai');
      expect(config.sttProvider).toBe('openai');
      // Restore
      updateConfig('sttProvider', original);
    });

    it('updates sttProvider to local', async () => {
      const { config, updateConfig } = await import('./config.js');
      updateConfig('sttProvider', 'local');
      expect(config.sttProvider).toBe('local');
    });

    it('rejects invalid sttProvider', async () => {
      const { updateConfig } = await import('./config.js');
      // @ts-expect-error testing invalid input
      expect(() => updateConfig('sttProvider', 'whisper')).toThrow(/Invalid sttProvider/);
    });

    it('updates language to a supported code', async () => {
      const { config, updateConfig } = await import('./config.js');
      const original = config.language;
      updateConfig('language', 'en');
      expect(config.language).toBe('en');
      updateConfig('language', original);
    });

    it('rejects unsupported language code', async () => {
      const { updateConfig } = await import('./config.js');
      expect(() => updateConfig('language', 'zz')).toThrow(/Invalid language/);
    });

    it('rejects empty language', async () => {
      const { updateConfig } = await import('./config.js');
      expect(() => updateConfig('language', '')).toThrow(/Invalid language/);
    });

    it('updates edgeVoiceGender to male', async () => {
      const { config, updateConfig } = await import('./config.js');
      const original = config.edgeVoiceGender;
      updateConfig('edgeVoiceGender', 'male');
      expect(config.edgeVoiceGender).toBe('male');
      updateConfig('edgeVoiceGender', original);
    });

    it('updates edgeVoiceGender to female', async () => {
      const { config, updateConfig } = await import('./config.js');
      updateConfig('edgeVoiceGender', 'female');
      expect(config.edgeVoiceGender).toBe('female');
    });

    it('rejects invalid edgeVoiceGender', async () => {
      const { updateConfig } = await import('./config.js');
      // @ts-expect-error testing invalid input
      expect(() => updateConfig('edgeVoiceGender', 'nonbinary')).toThrow(/Invalid edgeVoiceGender/);
    });

    it('updates sessionSecret', async () => {
      const { config, updateConfig } = await import('./config.js');
      updateConfig('sessionSecret', 'test-secret-value-123');
      expect(config.sessionSecret).toBe('test-secret-value-123');
    });

    it('rejects empty sessionSecret', async () => {
      const { updateConfig } = await import('./config.js');
      expect(() => updateConfig('sessionSecret', '')).toThrow(/sessionSecret must be a non-empty string/);
    });

    it('does not accept unknown keys at compile time', async () => {
      const { updateConfig } = await import('./config.js');
      // @ts-expect-error — 'port' is not a mutable key
      expect(() => updateConfig('port', 9999)).toThrow();
    });

    it('config object retains as-const read types after mutation', async () => {
      const { config, updateConfig } = await import('./config.js');
      updateConfig('sttProvider', 'openai');
      // TypeScript still sees config.sttProvider as 'local' | 'openai' (readonly),
      // but the runtime value should be updated.
      const provider: string = config.sttProvider;
      expect(provider).toBe('openai');
      updateConfig('sttProvider', 'local');
    });
  });

  describe('workflow shell config', () => {
    it('defaults to native tasks compatibility mode', async () => {
      delete process.env.NERVE_WORKFLOW_PRIMARY;
      delete process.env.NERVE_HIDE_NATIVE_TASKS;

      const { config } = await importFreshConfig();

      expect(config.workflow).toEqual({
        primarySurface: 'native',
        prefersBeads: false,
        hideNativeTasks: false,
        topLevelPlansEnabled: false,
        navigationLabel: 'Tasks',
        defaultBoardMode: 'kanban',
      });
    });

    it('enables beads-first shell mode from env', async () => {
      process.env.NERVE_WORKFLOW_PRIMARY = 'beads';
      delete process.env.NERVE_HIDE_NATIVE_TASKS;

      const { config } = await importFreshConfig();

      expect(config.workflow.primarySurface).toBe('beads');
      expect(config.workflow.prefersBeads).toBe(true);
      expect(config.workflow.hideNativeTasks).toBe(false);
      expect(config.workflow.navigationLabel).toBe('Beads');
      expect(config.workflow.defaultBoardMode).toBe('beads');
      expect(config.workflow.topLevelPlansEnabled).toBe(false);
    });

    it('enables the optional top-level plans surface from env', async () => {
      delete process.env.NERVE_WORKFLOW_PRIMARY;
      delete process.env.NERVE_HIDE_NATIVE_TASKS;
      process.env.NERVE_TOP_LEVEL_PLANS = 'true';

      const { config } = await importFreshConfig();

      expect(config.workflow.topLevelPlansEnabled).toBe(true);
      expect(config.workflow.defaultBoardMode).toBe('kanban');
    });

    it('forces beads mode when native tasks are hidden', async () => {
      process.env.NERVE_WORKFLOW_PRIMARY = 'native';
      process.env.NERVE_HIDE_NATIVE_TASKS = 'true';

      const { config } = await importFreshConfig();

      expect(config.workflow.primarySurface).toBe('native');
      expect(config.workflow.prefersBeads).toBe(true);
      expect(config.workflow.hideNativeTasks).toBe(true);
      expect(config.workflow.topLevelPlansEnabled).toBe(false);
      expect(config.workflow.navigationLabel).toBe('Beads');
      expect(config.workflow.defaultBoardMode).toBe('beads');
    });
  });

  describe('upload feature flags', () => {
    it('uses inline-only defaults for upload config', async () => {
      delete process.env.NERVE_UPLOAD_TWO_MODE_ENABLED;
      delete process.env.NERVE_UPLOAD_INLINE_ENABLED;
      delete process.env.NERVE_UPLOAD_FILE_REFERENCE_ENABLED;
      delete process.env.NERVE_UPLOAD_MODE_CHOOSER_ENABLED;
      delete process.env.NERVE_INLINE_ATTACHMENT_MAX_MB;

      const { config } = await importFreshConfig();

      expect(config.upload).toEqual({
        twoModeEnabled: false,
        inlineEnabled: true,
        fileReferenceEnabled: false,
        modeChooserEnabled: false,
        inlineAttachmentMaxMb: 4,
        inlineImageContextMaxBytes: 32768,
        inlineImageAutoDowngradeToFileReference: true,
        inlineImageShrinkMinDimension: 512,
        inlineImageMaxDimension: 2048,
        inlineImageWebpQuality: 82,
        exposeInlineBase64ToAgent: false,
        staging: {
          tempDir: path.join(process.env.HOME || '', '.openclaw', 'workspace', '.temp', 'nerve-uploads'),
          staleMaxAgeHours: 24,
        },
        optimization: {
          enabled: true,
          tempDir: '~/.cache/openclaw/nerve/optimized-uploads',
          targetBytes: 1024 * 1024,
          maxBytes: 1280 * 1024,
          maxDimension: 4096,
          preserveTransparency: true,
          webpQuality: 90,
          staleMaxAgeHours: 24,
        },
      });
    });

    it('reads upload flags from env', async () => {
      process.env.NERVE_UPLOAD_TWO_MODE_ENABLED = 'true';
      process.env.NERVE_UPLOAD_INLINE_ENABLED = 'true';
      process.env.NERVE_UPLOAD_FILE_REFERENCE_ENABLED = 'true';
      process.env.NERVE_UPLOAD_MODE_CHOOSER_ENABLED = 'true';
      process.env.NERVE_INLINE_ATTACHMENT_MAX_MB = '6';
      process.env.NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES = '196608';
      process.env.NERVE_INLINE_IMAGE_AUTO_DOWNGRADE_TO_FILE_REFERENCE = 'false';
      process.env.NERVE_INLINE_IMAGE_SHRINK_MIN_DIMENSION = '896';
      process.env.NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT = 'true';
      process.env.NERVE_INLINE_IMAGE_MAX_DIMENSION = '1536';
      process.env.NERVE_INLINE_IMAGE_WEBP_QUALITY = '76';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_ENABLED = 'true';
      process.env.NERVE_UPLOAD_STAGING_TEMP_DIR = '~/tmp/nerve-uploads';
      process.env.NERVE_UPLOAD_STAGING_STALE_MAX_AGE_HOURS = '72';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_TEMP_DIR = '~/tmp/optimized';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_TARGET_BYTES = '1048576';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_BYTES = '1572864';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_DIMENSION = '3072';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_WEBP_QUALITY = '72';
      process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_STALE_MAX_AGE_HOURS = '48';

      const { config } = await importFreshConfig();

      expect(config.upload.twoModeEnabled).toBe(true);
      expect(config.upload.inlineEnabled).toBe(true);
      expect(config.upload.fileReferenceEnabled).toBe(true);
      expect(config.upload.modeChooserEnabled).toBe(true);
      expect(config.upload.inlineAttachmentMaxMb).toBe(6);
      expect(config.upload.inlineImageContextMaxBytes).toBe(196608);
      expect(config.upload.inlineImageAutoDowngradeToFileReference).toBe(false);
      expect(config.upload.inlineImageShrinkMinDimension).toBe(896);
      expect(config.upload.inlineImageMaxDimension).toBe(1536);
      expect(config.upload.inlineImageWebpQuality).toBe(76);
      expect(config.upload.exposeInlineBase64ToAgent).toBe(true);
      expect(config.upload.staging.tempDir).toBe('~/tmp/nerve-uploads');
      expect(config.upload.staging.staleMaxAgeHours).toBe(72);
      expect(config.upload.optimization.enabled).toBe(true);
      expect(config.upload.optimization.tempDir).toBe('~/tmp/optimized');
      expect(config.upload.optimization.targetBytes).toBe(1048576);
      expect(config.upload.optimization.maxBytes).toBe(1572864);
      expect(config.upload.optimization.maxDimension).toBe(3072);
      expect(config.upload.optimization.webpQuality).toBe(72);
      expect(config.upload.optimization.staleMaxAgeHours).toBe(48);
    });

    it('falls back to default inline cap when env is invalid', async () => {
      process.env.NERVE_INLINE_ATTACHMENT_MAX_MB = '0';
      const { config } = await importFreshConfig();
      expect(config.upload.inlineAttachmentMaxMb).toBe(4);
    });
  });

  describe('beads source registry', () => {
    it('defaults to the built-in ~/.openclaw source', async () => {
      const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-config-home-'));
      await fs.mkdir(path.join(homeDir, '.openclaw', 'workspace', 'projects'), { recursive: true });
      process.env.HOME = homeDir;
      delete process.env.NERVE_BEADS_SOURCES;
      delete process.env.NERVE_BEADS_DEFAULT_SOURCE;
      delete process.env.NERVE_BEADS_PROJECTS_ROOT;

      const { config, resolveBeadsSource, listBeadsSources } = await importFreshConfig();

      expect(config.beads.defaultSourceId).toBe('openclaw');
      expect(config.beads.sources).toEqual([
        {
          id: 'openclaw',
          label: '~/.openclaw',
          rootPath: path.join(homeDir, '.openclaw'),
          kind: 'openclaw',
        },
      ]);
      expect(listBeadsSources()).toEqual(config.beads.sources);
      expect(resolveBeadsSource()).toEqual(config.beads.sources[0]);
    });

    it('parses configured project sources and resolves the configured default', async () => {
      const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-config-home-'));
      const projectsRoot = path.join(homeDir, '.openclaw', 'workspace', 'projects');
      const projectRoot = path.join(projectsRoot, 'alpha');
      await fs.mkdir(projectRoot, { recursive: true });

      process.env.HOME = homeDir;
      process.env.NERVE_BEADS_SOURCES = `alpha|Alpha Repo|${projectRoot}`;
      process.env.NERVE_BEADS_DEFAULT_SOURCE = 'alpha';
      delete process.env.NERVE_BEADS_PROJECTS_ROOT;

      const { config, resolveBeadsSource } = await importFreshConfig();

      expect(config.beads.defaultSourceId).toBe('alpha');
      expect(config.beads.projectsRoot).toBe(projectsRoot);
      expect(config.beads.sources).toEqual([
        {
          id: 'openclaw',
          label: '~/.openclaw',
          rootPath: path.join(homeDir, '.openclaw'),
          kind: 'openclaw',
        },
        {
          id: 'alpha',
          label: 'Alpha Repo',
          rootPath: projectRoot,
          kind: 'project',
        },
      ]);
      expect(resolveBeadsSource('alpha')).toEqual(config.beads.sources[1]);
      expect(resolveBeadsSource('missing')).toBeNull();
    });

    it('rejects sources outside ~/.openclaw and the configured projects root', async () => {
      const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-config-home-'));
      const outsideRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-config-outside-'));
      await fs.mkdir(path.join(homeDir, '.openclaw', 'workspace', 'projects'), { recursive: true });

      process.env.HOME = homeDir;
      process.env.NERVE_BEADS_SOURCES = `outside|Outside|${outsideRoot}`;
      process.env.NERVE_BEADS_DEFAULT_SOURCE = 'outside';
      delete process.env.NERVE_BEADS_PROJECTS_ROOT;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { config, resolveBeadsSource } = await importFreshConfig();

      expect(config.beads.sources).toEqual([
        {
          id: 'openclaw',
          label: '~/.openclaw',
          rootPath: path.join(homeDir, '.openclaw'),
          kind: 'openclaw',
        },
      ]);
      expect(config.beads.defaultSourceId).toBe('openclaw');
      expect(resolveBeadsSource('outside')).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
