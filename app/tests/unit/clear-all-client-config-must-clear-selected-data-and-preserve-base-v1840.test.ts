import { test, expect } from '@playwright/test';
import { EXACT_GROUP_CATEGORIES, createDefaultExactGroupExclusions } from '../../src/shared/exactGroupExclusions';
import { createSafeBoxConfigClearSnapshot } from '../../src/shared/generatorSettings';

const historyCounts = {
  borderGeneral: 200,
  middleGeneral: 300,
  oddNumbers: 370,
  evenNumbers: 100,
  borderOdd: 10,
  borderEven: 10,
  coreOdd: 10,
  coreEven: 10,
  prime: 10,
  fibonacci: 10,
};

test('clear-all-client-config-must-clear-selected-data-and-preserve-base-v1840', () => {
  const before = {
    mode: 'range' as const,
    rangeStart: 3562,
    rangeEnd: 3761,
    maxJogos: 3268760,
    K: 15,
    fixas: '02,05,10,13,21',
    exclusions: [{ id: 'rule-1', type: 'dozens', values: [1, 2, 3] }],
    patternIncludes: [
      { id: 'line-use-1', type: 'row', pattern: [3, 3, 4, 2, 3] },
      { id: 'line-use-2', type: 'row', pattern: [3, 3, 2, 3, 4] },
      { id: 'column-use-1', type: 'column', pattern: [3, 3, 4, 2, 3] },
      { id: 'column-use-2', type: 'column', pattern: [3, 3, 2, 3, 4] },
    ],
    patternExclusions: [
      { id: 'line-exclude-1', type: 'row', pattern: [3, 3, 3, 2, 4] },
      { id: 'line-exclude-2', type: 'row', pattern: [4, 3, 3, 2, 3] },
      { id: 'column-exclude-1', type: 'column', pattern: [3, 2, 3, 3, 4] },
      { id: 'column-exclude-2', type: 'column', pattern: [4, 3, 3, 2, 3] },
    ],
    exactGroupExclusions: {
      borderGeneral: [[1, 2, 3], [11, 21, 22]],
      middleGeneral: [[7, 8, 9], [12, 13, 14]],
      oddNumbers: [[1, 3, 5], [7, 9, 11]],
      evenNumbers: [[2, 4, 6], [8, 10, 12]],
      borderOdd: [[1, 3, 11], [21, 23, 25]],
      borderEven: [[2, 4, 10], [22, 24]],
      coreOdd: [[7, 13, 19], [9, 17]],
      coreEven: [[8, 12, 14], [18]],
      prime: [[2, 3, 5], [11, 13, 23]],
      fibonacci: [[1, 2, 3], [5, 8, 13]],
    },
    exactGroupHistoryCounts: historyCounts,
  };

  const after = createSafeBoxConfigClearSnapshot(before);

  expect(after.rangeStart).toBe(3562);
  expect(after.rangeEnd).toBe(3761);
  expect(after.maxJogos).toBe(3268760);
  expect(after.K).toBe(15);
  expect(after.exactGroupHistoryCounts).toEqual(historyCounts);

  expect(after.fixas).toBe('');
  expect(after.exclusions).toEqual([]);
  expect(after.patternIncludes).toEqual([]);
  expect(after.patternExclusions).toEqual([]);
  expect(after.exactGroupExclusions).toEqual(createDefaultExactGroupExclusions());

  for (const category of EXACT_GROUP_CATEGORIES) {
    expect(after.exactGroupExclusions[category]).toEqual([]);
  }
});
