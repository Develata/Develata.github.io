/**
 * @file records.ts
 * @description 推箱子成绩持久化。只保存可序列化成绩，不保存运行时对象。
 */

import type { LevelRecord } from './types';

export const SOKOBAN_RECORDS_KEY = 'sokoban-records-v2';

type RecordMap = Record<string, LevelRecord>;

function canUseStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadRecords(): RecordMap {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SOKOBAN_RECORDS_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as RecordMap;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

export function getLevelRecord(levelId: string): LevelRecord | null {
  return loadRecords()[levelId] ?? null;
}

export function saveLevelRecord(levelId: string, moves: number, pushes: number): LevelRecord {
  const records = loadRecords();
  const previous = records[levelId];
  const next = {
    moves,
    pushes,
    updatedAt: new Date().toISOString(),
  };

  if (previous && (previous.pushes < pushes || (previous.pushes === pushes && previous.moves <= moves))) {
    return previous;
  }

  records[levelId] = next;
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(SOKOBAN_RECORDS_KEY, JSON.stringify(records));
    } catch {
      // localStorage may be unavailable in private mode; gameplay must remain functional.
    }
  }
  return next;
}
