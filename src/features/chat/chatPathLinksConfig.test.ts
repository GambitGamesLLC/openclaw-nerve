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

    expect(config.prefixes).toEqual([
      '/workspace/',
      '/home/derrick/.openclaw/workspace/',
      '/home/derrick/workspace/',
    ]);
  });

  it('normalizes, dedupes, and falls back when parsing', () => {
    expect(parseChatPathLinksConfig('{"prefixes":[" /workspace ","/workspace/","","  "]}')).toEqual({
      prefixes: ['/workspace/'],
    });

    expect(parseChatPathLinksConfig('{"prefixes":[]}')).toEqual({
      prefixes: ['/workspace/'],
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
      + '  ]\n'
      + '}\n',
    );

    expect(stringifyChatPathLinksConfig({ prefixes: ['/workspace', '/workspace/'] })).toBe(
      '{\n'
      + '  "prefixes": [\n'
      + '    "/workspace/"\n'
      + '  ]\n'
      + '}\n',
    );
  });
});
