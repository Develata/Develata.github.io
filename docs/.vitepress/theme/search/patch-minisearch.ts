/**
 * @file patch-minisearch.ts
 * @description 为 VitePress 本地搜索补充多词 AND 检索与短语加权。
 */

import MiniSearch from 'minisearch';
import { buildAdjacentLatinPhrases, extractQueryTerms } from '../../utils/search-tokenize';

const PATCH_FLAG = Symbol.for('develata.local-search.phrase-patch');
const PHRASE_BOOST = 3;

type SearchOptions = Record<string, unknown>;
type SearchQuery = string | { combineWith: string; queries: unknown[] };
type SearchMethod = (query: SearchQuery, searchOptions?: SearchOptions) => unknown;
type SearchLikeResult = { id: string; score?: number };

function mergeResults(baseResults: unknown, phraseResults: unknown[]): unknown {
  const merged = new Map<string, SearchLikeResult>();
  const attach = (items: unknown[], scale = 1) => {
    items.forEach((item) => {
      const result = item as SearchLikeResult;
      const current = merged.get(result.id);
      if (current) {
        current.score = (current.score ?? 0) + (result.score ?? 0) * scale;
        return;
      }
      merged.set(result.id, { ...result, score: (result.score ?? 0) * scale });
    });
  };

  attach(Array.isArray(baseResults) ? baseResults : []);
  phraseResults.forEach((result) => attach(Array.isArray(result) ? result : [], PHRASE_BOOST));
  return [...merged.values()].sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
}

if (!(MiniSearch as MiniSearch & { [PATCH_FLAG]?: boolean })[PATCH_FLAG]) {
  const originalSearch = MiniSearch.prototype.search as SearchMethod;

  MiniSearch.prototype.search = function patchedSearch(query: SearchQuery, searchOptions: SearchOptions = {}) {
    if (typeof query !== 'string') {
      return originalSearch.call(this, query, searchOptions);
    }

    const queryTerms = extractQueryTerms(query);
    if (queryTerms.length < 2) {
      return originalSearch.call(this, query, searchOptions);
    }

    const uniqueTerms = [...new Set(queryTerms)];
    const phraseTerms = buildAdjacentLatinPhrases(queryTerms);
    const andQuery = { combineWith: 'AND', queries: uniqueTerms };
    if (!phraseTerms.length) {
      return originalSearch.call(this, andQuery, searchOptions);
    }

    const baseResults = originalSearch.call(this, andQuery, searchOptions);
    const phraseResults = phraseTerms.map((phrase) => originalSearch.call(this, phrase, {
      ...searchOptions,
      tokenize: () => [phrase],
      fuzzy: false,
      prefix: false,
    }));
    return mergeResults(baseResults, phraseResults);
  } as SearchMethod;

  (MiniSearch as MiniSearch & { [PATCH_FLAG]?: boolean })[PATCH_FLAG] = true;
}
