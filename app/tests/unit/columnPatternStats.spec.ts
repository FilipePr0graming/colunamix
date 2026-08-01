import { test, expect } from '@playwright/test';
import {
  calculateColumnPatternEntries,
  COLUMN_STATS_BATCH_SIZE,
  COLUMN_STATS_START_CONTEST,
  countColumnPatternOccurrences,
  getColumnCountPatternKey,
  getColumnPatternKey,
  getRecentColumnStatsStartContest,
  groupColumnPatternEntries,
} from '../../src/shared/columnPatternStats';

const repeated = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21];
const changed = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18];

test.describe('column pattern card stats', () => {
  test('gera chave normalizada igual para a mesma distribuição e diferente para outra', () => {
    expect(getColumnPatternKey(repeated)).toBe('C1=01,06,11,16,21|C2=02,07,12,17|C3=03,08,13,18|C4=04|C5=05');
    expect(getColumnPatternKey([...repeated].reverse())).toBe(getColumnPatternKey(repeated));
    expect(getColumnPatternKey(changed)).not.toBe(getColumnPatternKey(repeated));
  });

  test('calcula recorrência geral pelo maior DIST das colunas', () => {
    const draws = [
      { contest: 3000, numbers: changed },
      { contest: 3001, numbers: repeated },
      { contest: 3004, numbers: repeated },
    ];
    const occurrenceMap = countColumnPatternOccurrences(draws);
    const rows = calculateColumnPatternEntries(draws);

    expect(occurrenceMap.get(getColumnCountPatternKey(repeated))).toBe(2);
    expect(occurrenceMap.get(getColumnCountPatternKey(changed))).toBe(1);
    expect(rows.map(row => row.generalRecurrence)).toEqual([0, 1, 3]);
    expect(rows[2].patterns.some(pattern => pattern.colDistance === 3)).toBeTruthy();
  });

  test('calcula C1 a C5 e preserva último concurso e distância por coluna', () => {
    const rows = calculateColumnPatternEntries([
      { contest: 3000, numbers: changed },
      { contest: 3001, numbers: repeated },
      { contest: 3004, numbers: repeated },
    ]);
    const entry = rows.find(row => row.contest === 3004)!;

    expect(entry.patterns.map(pattern => pattern.col)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
    expect(entry.patterns[0]).toMatchObject({ numbers: '01, 06, 11, 16, 21', colLastSeen: 3001, colDistance: 3 });
    expect(entry.generalRecurrence).toBe(3);
    expect(rows[0].patterns.some(pattern => pattern.colLastSeen === -1 && pattern.colDistance === -1)).toBeTruthy();
  });

  test('começa em 3000, retorna ordem crescente e divide em blocos de até 10', () => {
    const rows = calculateColumnPatternEntries([
      ...Array.from({ length: 22 }, (_, index) => ({ contest: 3021 - index, numbers: index % 2 ? changed : repeated })),
      { contest: 2999, numbers: repeated },
    ]);
    const blocks = groupColumnPatternEntries(rows);

    expect(COLUMN_STATS_START_CONTEST).toBe(3000);
    expect(COLUMN_STATS_BATCH_SIZE).toBe(10);
    expect(rows.map(row => row.contest)).toEqual(Array.from({ length: 22 }, (_, index) => 3000 + index));
    expect(blocks.map(block => block.length)).toEqual([10, 10, 2]);
    expect(blocks.flat().map(row => row.contest)).toEqual(rows.map(row => row.contest));
  });

  test('processa base grande em uma única passagem prática', () => {
    const draws = Array.from({ length: 10_000 }, (_, index) => ({
      contest: index + 1,
      numbers: index % 2 ? changed : repeated,
    }));
    const startedAt = Date.now();
    const rows = calculateColumnPatternEntries(draws);

    expect(rows).toHaveLength(7_001);
    expect(rows[0].generalRecurrence).toBe(0);
    expect(rows[2].generalRecurrence).toBe(2);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  });

  test('calcula o bloco recente sem perder a ordem crescente', () => {
    expect(getRecentColumnStatsStartContest(3708)).toBe(3699);
    expect(getRecentColumnStatsStartContest(3025)).toBe(3016);
    expect(getRecentColumnStatsStartContest(2998, 2990)).toBe(3000);
    expect(getRecentColumnStatsStartContest(3712, 3697)).toBe(3703);
  });
});
