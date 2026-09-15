import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

export function resolve(specifier, context, nextResolve) {
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    if (specifier.startsWith('.') && extname(specifier) === '') {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}

export function load(url, context, nextLoad) {
  if (!url.endsWith('.ts')) return nextLoad(url, context);
  const source = readFileSync(new URL(url), 'utf8');
  return {
    format: 'module',
    shortCircuit: true,
    source: stripTypeScriptTypes(source, { mode: 'strip', sourceMap: false }),
  };
}
