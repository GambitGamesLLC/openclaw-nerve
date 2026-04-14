import { describe, expect, it } from 'vitest';
import {
  createChatPathLinksTemplate,
  createDefaultChatPathLinksConfig,
  parseChatPathLinksConfig,
  stringifyChatPathLinksConfig,
} from './chatPathLinksConfig';

describe('chatPathLinksConfig', () => {
  it('builds richer local defaults from workspace and user context', () => {
    const config = createDefaultChatPathLinksConfig({
      platform: 'linux',
      username: 'derrick',
      workspaceRoot: '/home/derrick/.openclaw/workspace',
    });

    expect(config).toEqual({
      prefixes: [
        '/workspace/',
        '/home/derrick/.openclaw/workspace/',
        '/home/derrick/workspace/',
      ],
      aliases: {},
    });
  });

  it('derives Windows-aware defaults from the actual workspace root', () => {
    const config = createDefaultChatPathLinksConfig({
      platform: 'win32',
      username: 'derrick',
      workspaceRoot: 'D:\\Users\\derrick\\.openclaw\\workspace-research',
    });

    expect(config).toEqual({
      prefixes: [
        '/workspace/',
        'D:/Users/derrick/.openclaw/workspace-research/',
        'D:/Users/derrick/.openclaw/workspace/',
        'D:/Users/derrick/workspace/',
      ],
      aliases: {},
    });
  });

  it('falls back to conventional Windows home defaults when only username is available', () => {
    const config = createDefaultChatPathLinksConfig({
      platform: 'windows',
      username: 'derrick',
    });

    expect(config).toEqual({
      prefixes: [
        '/workspace/',
        'C:/Users/derrick/.openclaw/workspace/',
        'C:/Users/derrick/workspace/',
      ],
      aliases: {},
    });
  });

  it('normalizes, dedupes, and falls back when parsing', () => {
    expect(parseChatPathLinksConfig('{"prefixes":[" /workspace ","/workspace/","","  "]}')).toEqual({
      prefixes: ['/workspace/'],
      aliases: {},
    });

    expect(parseChatPathLinksConfig('{"prefixes":[],"aliases":{"projects":"workspace/projects"}}')).toEqual({
      prefixes: ['/workspace/'],
      aliases: { 'projects/': '/workspace/projects/' },
    });
  });

  it('serializes the shared template with trailing newline', () => {
    const template = createChatPathLinksTemplate({
      platform: 'linux',
      homeDir: '/home/derrick',
      workspaceRoot: '/home/derrick/.openclaw/workspace',
    });

    expect(template).toBe(
      '{\n'
      + '  "prefixes": [\n'
      + '    "/workspace/",\n'
      + '    "/home/derrick/.openclaw/workspace/",\n'
      + '    "/home/derrick/workspace/"\n'
      + '  ],\n'
      + '  "aliases": {}\n'
      + '}\n',
    );

    expect(stringifyChatPathLinksConfig({
      prefixes: ['/workspace', '/workspace/'],
      aliases: { projects: 'workspace/projects' },
    })).toBe(
      '{\n'
      + '  "prefixes": [\n'
      + '    "/workspace/"\n'
      + '  ],\n'
      + '  "aliases": {\n'
      + '    "projects/": "/workspace/projects/"\n'
      + '  }\n'
      + '}\n',
    );
  });
});
