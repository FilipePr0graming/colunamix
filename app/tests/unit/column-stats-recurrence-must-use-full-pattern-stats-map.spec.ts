import { expect, test } from '@playwright/test';
import {
  calculateColumnPatternEntries,
  getColumnPatternStatsOfficialMap,
} from '../../src/shared/columnPatternStats';
import {
  COLUMN_STATS_BROWSER_CACHE_KEYS,
  COLUMN_STATS_SCHEMA_STATE_KEY,
  COLUMN_STATS_SCHEMA_VERSION,
} from '../../src/shared/columnStatsCache';
import { calculatePatternStats, clearPatternStatsCache } from '../../src/shared/patternStats';

const pattern22344A = [1, 6, 2, 7, 3, 8, 13, 4, 9, 14, 19, 5, 10, 15, 20];
const pattern22344B = [11, 16, 12, 17, 8, 13, 18, 9, 14, 19, 24, 10, 15, 20, 25];
const otherPattern = [1, 6, 11, 2, 7, 12, 3, 8, 4, 9, 14, 5, 10, 15, 20];

test.describe('v1.8.31 column cards use the v1.8.19 max-distance recurrence', () => {
  test.beforeEach(() => clearPatternStatsCache());

  test('Recorrência Geral usa maior DIST, não ocorrências oficiais do patternKey', () => {
    const draws = Array.from({ length: 60 }, (_, index) => ({
      contest: 3649 + index,
      numbers: index < 56
        ? (index % 2 === 0 ? pattern22344A : pattern22344B)
        : otherPattern,
    }));
    const officialRows = calculatePatternStats(draws, 'column');
    const official = officialRows.find(row => row.patternKey === '2,2,3,4,4');
    const visibleCards = calculateColumnPatternEntries(draws, 3699);

    expect(official?.occurrences).toBe(56);
    expect(visibleCards).toHaveLength(10);
    expect(visibleCards[0].generalPatternKey).toBe('2,2,3,4,4');
    expect(visibleCards[0].generalRecurrence).toBe(2);
    expect(visibleCards[0].generalRecurrence).not.toBe(official?.occurrences);
  });

  test('alterar Concurso inicial não altera a fonte oficial da recorrência', () => {
    const draws = Array.from({ length: 60 }, (_, index) => ({
      contest: 3649 + index,
      numbers: index % 2 === 0 ? pattern22344A : pattern22344B,
    }));
    const early = calculateColumnPatternEntries(draws, 3650);
    const recent = calculateColumnPatternEntries(draws, 3699);

    expect(early[0].generalRecurrence).toBe(0);
    expect(recent[0].generalRecurrence).toBe(2);
    expect(recent).toHaveLength(10);
  });

  test('mantém o mapa oficial separado da Recorrência Geral dos cards', () => {
    const draws = Array.from({ length: 60 }, (_, index) => ({
      contest: 3649 + index,
      numbers: index < 56
        ? (index % 2 === 0 ? pattern22344A : pattern22344B)
        : otherPattern,
    }));
    const officialMap = getColumnPatternStatsOfficialMap(draws);
    const officialRows = calculatePatternStats(draws, 'column');
    const cards = calculateColumnPatternEntries(draws, 3699);

    expect(officialMap.get('2,2,3,4,4')?.occurrences).toBe(56);
    expect(officialMap.get('2,2,3,4,4')?.occurrences).toBe(
      officialRows.find(row => row.patternKey === '2,2,3,4,4')?.occurrences
    );
    expect(cards.filter(card => card.generalPatternKey === '2,2,3,4,4')).toHaveLength(6);
    expect(cards.filter(card => card.generalPatternKey === '2,2,3,4,4').every(card => card.generalRecurrence < 56)).toBeTruthy();
  });

  test('não conta apenas cards visíveis e preserva ÚLT/DIST', () => {
    const draws = Array.from({ length: 60 }, (_, index) => ({
      contest: 3649 + index,
      numbers: index < 56
        ? (index % 2 === 0 ? pattern22344A : pattern22344B)
        : otherPattern,
    }));
    const cards = calculateColumnPatternEntries(draws, 3699);
    const visible22344 = cards.filter(card => card.generalPatternKey === '2,2,3,4,4');

    expect(visible22344).toHaveLength(6);
    expect(new Set(visible22344.map(card => card.patterns.map(pattern => pattern.numbers).join('|'))).size).toBeGreaterThan(1);
    expect(visible22344.every(card => card.generalRecurrence === Math.max(...card.patterns.map(pattern => pattern.colDistance)))).toBeTruthy();
    expect(visible22344.every(card => card.patterns.some(pattern => pattern.colLastSeen > 0 && pattern.colDistance > 0))).toBeTruthy();
  });

  test('declara schema novo e chaves antigas de cache para invalidação', () => {
    expect(COLUMN_STATS_SCHEMA_STATE_KEY).toBe('columnStatsSchemaVersion');
    expect(COLUMN_STATS_SCHEMA_VERSION).toBe('v1.8.32-column-stats-v1819-restore');
    expect(COLUMN_STATS_BROWSER_CACHE_KEYS).toEqual(expect.arrayContaining([
      'columnStatsCache',
      'columnPatternStats',
      'patternStatsCache',
    ]));
  });
});
