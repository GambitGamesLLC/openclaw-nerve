import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderInlinePathReferences } from '../src/features/markdown/inlineReferences.tsx';

function htmlFor(text: string, aliases: Record<string,string>) {
  const node = renderInlinePathReferences(text, {
    prefixes: ['/workspace/'],
    aliases,
    onOpenPath: () => {},
    renderPlainText: (value: string) => value,
  });
  return Array.isArray(node)
    ? node.map((part) => typeof part === 'string' ? part : renderToStaticMarkup(<>{part}</>)).join('')
    : typeof node === 'string' ? node : renderToStaticMarkup(<>{node}</>);
}

const cases = [
  {
    name: 'specific-first',
    aliases: {
      'projects/openclaw-nerve/': '/workspace/projects/openclaw-nerve/',
      'projects/': '/workspace/projects-generic/',
    },
  },
  {
    name: 'generic-first',
    aliases: {
      'projects/': '/workspace/projects-generic/',
      'projects/openclaw-nerve/': '/workspace/projects/openclaw-nerve/',
    },
  },
  {
    name: 'non-recursive-chain',
    aliases: {
      'shortcut/': 'projects/',
      'projects/': '/workspace/projects/',
    },
  },
];

for (const c of cases) {
  console.log(`CASE:${c.name}`);
  console.log(htmlFor('Open projects/openclaw-nerve/src/App.tsx now', c.aliases));
  console.log(htmlFor('Open shortcut/demo.md now', c.aliases));
}
