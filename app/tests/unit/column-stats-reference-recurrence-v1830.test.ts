import { expect, test } from '@playwright/test';
import {
  COLUMN_STATS_ANALYSIS_START_CONTEST,
  calculateColumnPatternEntries,
  getRecentColumnStatsStartContest,
} from '../../src/shared/columnPatternStats';

const referenceFixture = [
  { contest: 3507, numbers: [2, 4, 5, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 24, 25] },
  { contest: 3598, numbers: [1, 3, 4, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20, 23, 25] },
  { contest: 3610, numbers: [3, 5, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24] },
  { contest: 3645, numbers: [2, 4, 5, 10, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25] },
  { contest: 3648, numbers: [1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 25] },
  { contest: 3651, numbers: [2, 3, 4, 5, 6, 7, 9, 12, 13, 15, 19, 20, 23, 24, 25] },
  { contest: 3657, numbers: [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 17, 19, 20, 24] },
  { contest: 3676, numbers: [1, 3, 4, 6, 8, 10, 12, 14, 18, 19, 20, 21, 22, 23, 25] },
  { contest: 3700, numbers: [1, 4, 8, 11, 13, 14, 15, 16, 17, 18, 20, 22, 23, 24, 25] },
  { contest: 3701, numbers: [1, 2, 3, 4, 5, 10, 11, 12, 13, 15, 17, 18, 19, 21, 24] },
  { contest: 3702, numbers: [1, 2, 3, 5, 9, 10, 12, 13, 14, 16, 17, 20, 22, 23, 24] },
  { contest: 3703, numbers: [1, 2, 3, 5, 7, 10, 12, 14, 17, 18, 19, 21, 23, 24, 25] },
  { contest: 3704, numbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 15, 18, 22, 24, 25] },
  { contest: 3705, numbers: [1, 2, 3, 5, 6, 7, 8, 9, 14, 15, 19, 20, 21, 22, 23] },
  { contest: 3706, numbers: [1, 2, 5, 8, 9, 13, 14, 15, 16, 17, 18, 21, 22, 24, 25] },
  { contest: 3707, numbers: [2, 3, 5, 7, 8, 9, 11, 13, 16, 17, 19, 20, 22, 24, 25] },
  { contest: 3708, numbers: [2, 4, 7, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 22, 23] },
];

const expectedReference = new Map([
  [3700, 52],
  [3701, 194],
  [3702, 51],
  [3703, 93],
  [3704, 56],
  [3705, 29],
  [3706, 61],
  [3707, 50],
  [3708, 110],
]);

test.describe('v1.8.30 column stats reference recurrence', () => {
  test('reproduz a referência do cliente usando maior DIST por card', () => {
    const rows = calculateColumnPatternEntries(referenceFixture, 3700, COLUMN_STATS_ANALYSIS_START_CONTEST);
    const actual = new Map(rows.map(row => [row.contest, row.generalRecurrence]));

    for (const [contest, recurrence] of expectedReference) {
      expect(actual.get(contest)).toBe(recurrence);
      const card = rows.find(row => row.contest === contest)!;
      expect(card.generalRecurrence).toBe(Math.max(...card.patterns.map(pattern => pattern.colDistance)));
    }
  });

  test('Concurso inicial de exibição não limita a base de análise', () => {
    const displayStartContest = getRecentColumnStatsStartContest(3708);
    const rows = calculateColumnPatternEntries(referenceFixture, displayStartContest, COLUMN_STATS_ANALYSIS_START_CONTEST);

    expect(displayStartContest).toBe(3699);
    expect(rows.map(row => row.contest)).toEqual([3700, 3701, 3702, 3703, 3704, 3705, 3706, 3707, 3708]);
    expect(rows.find(row => row.contest === 3701)?.generalRecurrence).toBe(194);
    expect(rows.find(row => row.contest === 3708)?.generalRecurrence).toBe(110);
  });
});
