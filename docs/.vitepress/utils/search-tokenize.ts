/**
 * @file search-tokenize.ts
 * @description 本地搜索的索引分词与查询分词工具。
 */

const LATIN_ONLY_RE = /^[a-z0-9][a-z0-9_-]*$/;

export function buildAdjacentLatinPhrases(tokens: string[]): string[] {
  const phrases = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const left = tokens[i];
    const right = tokens[i + 1];
    if (LATIN_ONLY_RE.test(left) && LATIN_ONLY_RE.test(right)) {
      phrases.add(`${left} ${right}`);
    }
  }
  return [...phrases];
}

export function tokenizeSearchQuery(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  const latinTokenRe = /[a-z0-9][a-z0-9_-]*/g;
  const cjkSegmentRe = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu;
  const tokens = new Set<string>();
  const latinTokens = normalized.match(latinTokenRe) ?? [];
  latinTokens.forEach((token) => tokens.add(token));

  const cjkSegments = normalized.match(cjkSegmentRe) ?? [];
  cjkSegments.forEach((segment) => {
    tokens.add(segment);
    for (let i = 0; i < segment.length - 1; i += 1) {
      tokens.add(segment.slice(i, i + 2));
    }
  });

  return [...tokens];
}

export function tokenizeMixedText(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return [];

  const latinTokenRe = /[a-z0-9][a-z0-9_-]*/g;
  const cjkSegmentRe = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu;
  const tokens = new Set<string>();
  const latinTokens = normalized.match(latinTokenRe) ?? [];

  latinTokens.forEach((token) => tokens.add(token));

  const cjkSegments = normalized.match(cjkSegmentRe) ?? [];
  cjkSegments.forEach((segment) => {
    tokens.add(segment);
    for (let i = 0; i < segment.length - 1; i += 1) {
      tokens.add(segment.slice(i, i + 2));
    }
  });

  for (let i = 0; i < latinTokens.length - 1; i += 1) {
    const left = latinTokens[i];
    const right = latinTokens[i + 1];
    if (LATIN_ONLY_RE.test(left) && LATIN_ONLY_RE.test(right)) {
      tokens.add(`${left} ${right}`);
    }
  }

  return [...tokens];
}
