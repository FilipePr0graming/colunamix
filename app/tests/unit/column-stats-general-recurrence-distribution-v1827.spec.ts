import { expect, test } from '@playwright/test';
import {
  calculateColumnPatternEntries,
  countColumnPatternOccurrences,
  getColumnCountPatternKey,
  getColumnPatternKey,
} from '../../src/shared/columnPatternStats';

const pattern22344A = [1, 6, 2, 7, 3, 8, 13, 4, 9, 14, 19, 5, 10, 15, 20];
const pattern22344B = [11, 16, 12, 17, 8, 13, 18, 9, 14, 19, 24, 10, 15, 20, 25];
const differentPattern = [1, 6, 11, 2, 7, 3, 8, 13, 4, 9, 14, 5, 10, 15, 20];

test.describe('v1.8.30 general recurrence keeps count distribution separate', () => {
  test('gera a chave 2,2,3,4,4 usando somente quantidades por coluna', () => {
    expect(getColumnCountPatternKey(pattern22344A)).toBe('2,2,3,4,4');
  });

  test('dezenas exatas diferentes contam juntas no mapa, mas cards usam maior DIST', () => {
    expect(getColumnPatternKey(pattern22344A)).not.toBe(getColumnPatternKey(pattern22344B));
    expect(getColumnCountPatternKey(pattern22344A)).toBe(getColumnCountPatternKey(pattern22344B));

    const draws = [
      { contest: 3699, numbers: pattern22344A },
      { contest: 3700, numbers: pattern22344B },
      { contest: 3701, numbers: differentPattern },
    ];
    const occurrences = countColumnPatternOccurrences(draws);
    const rows = calculateColumnPatternEntries(draws, 3699);

    expect(occurrences.get('2,2,3,4,4')).toBe(2);
    expect(rows.slice(0, 2).map(row => row.generalRecurrence)).toEqual([0, 0]);
    expect(rows[2].generalRecurrence).toBe(2);
  });
});
