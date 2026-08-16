import { test, expect } from '@playwright/test';
import { EXACT_GROUP_CATEGORIES, createDefaultExactGroupExclusions } from '../../src/shared/exactGroupExclusions';
import { createSafeBoxConfigClearSnapshot } from '../../src/shared/generatorSettings';
import { applyBulkPatternRuleAction, applyPatternRuleAction } from '../../src/shared/patternRules';
import {
  filterPatternStatsRows,
  filterPatternsBySearch,
  filterPatternsBySequence,
  parsePatternSequenceInput,
} from '../../src/shared/patternStats';
import { PatternStatsRow } from '../../src/shared/types';

function row(patternKey: string, occurrences = 1): PatternStatsRow {
  return {
    pattern: patternKey.split(',').map(Number),
    patternKey,
    occurrences,
    lastContest: 3700,
    lag: 0,
    recentLags: [],
    percentage: occurrences,
  };
}

const sequenceRows = [
  row('3,3,4,2,3', 20),
  row('3,3,2,3,4', 19),
  row('3,3,3,2,4', 18),
  row('3,2,3,4,3', 17),
  row('4,3,3,2,3', 16),
  row('4,3,2,3,3', 15),
];

test.describe('escopo final Anderson v1.8.39', () => {
  test('busca por sequência filtra por prefixo tokenizado em tempo real', () => {
    expect(parsePatternSequenceInput('3')).toEqual([3]);
    expect(parsePatternSequenceInput('3,')).toEqual([3]);
    expect(parsePatternSequenceInput('3, 3, 4')).toEqual([3, 3, 4]);
    expect(parsePatternSequenceInput('3,a')).toBeNull();

    expect(filterPatternsBySequence(sequenceRows, '3').map(item => item.patternKey)).toEqual([
      '3,3,4,2,3',
      '3,3,2,3,4',
      '3,3,3,2,4',
      '3,2,3,4,3',
    ]);
    expect(filterPatternsBySequence(sequenceRows, '3,3').map(item => item.patternKey)).toEqual([
      '3,3,4,2,3',
      '3,3,2,3,4',
      '3,3,3,2,4',
    ]);
    expect(filterPatternsBySequence(sequenceRows, '3,3,4').map(item => item.patternKey)).toEqual(['3,3,4,2,3']);
    expect(filterPatternsBySequence(sequenceRows, '3,3,4,2,3').map(item => item.patternKey)).toEqual(['3,3,4,2,3']);
    expect(filterPatternsBySequence(sequenceRows, '').length).toBe(sequenceRows.length);
    expect(filterPatternsBySequence(sequenceRows, '3,3').map(item => item.patternKey)).not.toContain('4,3,3,2,3');
    expect(filterPatternsBySequence(sequenceRows, '3,3').map(item => item.patternKey)).not.toContain('3,2,3,4,3');
  });

  test('busca antiga continua preservada e acumula com sequência, mínimo e recorte calculado', () => {
    expect(filterPatternsBySearch(sequenceRows, '4,3,3,2,3', { variationSearch: true }).map(item => item.patternKey)).toContain('3,3,4,2,3');

    const filtered = filterPatternStatsRows(sequenceRows, {
      searchText: '3,3,4,2,3',
      sequenceSearchText: '3,3',
      minOccurrences: 19,
      sort: 'occurrences-desc',
      variationSearch: true,
    });

    expect(filtered.map(item => item.patternKey)).toEqual([
      '3,3,4,2,3',
      '3,3,2,3,4',
    ]);

    const rowFiltered = filterPatternStatsRows(sequenceRows, { sequenceSearchText: '3,3' });
    const columnFiltered = filterPatternStatsRows(sequenceRows, { sequenceSearchText: '4,3' });
    expect(rowFiltered.map(item => item.patternKey)).toEqual(expect.arrayContaining(['3,3,4,2,3']));
    expect(columnFiltered.map(item => item.patternKey)).toEqual(expect.arrayContaining(['4,3,3,2,3']));
    expect(rowFiltered.map(item => item.patternKey)).not.toEqual(columnFiltered.map(item => item.patternKey));
  });

  test('ações em massa usam todos os filtrados, evitam duplicidade e preservam eixo Linha/Coluna', () => {
    const total392 = Array.from({ length: 392 }, (_, index) => row(index < 20 ? `3,3,${index},2,3` : `4,${index},3,2,3`));
    const filtered20 = total392.slice(0, 20);

    const lineUse = applyBulkPatternRuleAction({
      includes: [],
      exclusions: [],
      rules: filtered20.map(item => ({ type: 'row' as const, pattern: item.pattern })),
      action: 'include',
      createId: () => 'fixed-id',
    });

    expect(total392).toHaveLength(392);
    expect(filtered20).toHaveLength(20);
    expect(lineUse.found).toBe(20);
    expect(lineUse.includes).toHaveLength(20);
    expect(lineUse.includes.every(item => item.type === 'row')).toBeTruthy();
    expect(lineUse.exclusions).toHaveLength(0);

    const lineUseAgain = applyBulkPatternRuleAction({
      includes: lineUse.includes,
      exclusions: lineUse.exclusions,
      rules: filtered20.map(item => ({ type: 'row' as const, pattern: item.pattern })),
      action: 'include',
    });
    expect(lineUseAgain.includes).toHaveLength(20);
    expect(lineUseAgain.alreadyExisting).toBe(20);

    const columnExclude = applyBulkPatternRuleAction({
      includes: lineUseAgain.includes,
      exclusions: lineUseAgain.exclusions,
      rules: filtered20.map(item => ({ type: 'column' as const, pattern: item.pattern })),
      action: 'exclude',
    });
    expect(columnExclude.exclusions).toHaveLength(20);
    expect(columnExclude.exclusions.every(item => item.type === 'column')).toBeTruthy();
    expect(columnExclude.includes.every(item => item.type === 'row')).toBeTruthy();

    const individual = applyPatternRuleAction({
      includes: [],
      exclusions: [],
      rule: { type: 'row', pattern: [3, 3, 4, 2, 3] },
      action: 'exclude',
    });
    expect(individual.status).toBe('added');
    expect(individual.exclusions[0]).toMatchObject({ type: 'row', pattern: [3, 3, 4, 2, 3] });
  });

  test('ordem final dos 10 quadros e limpeza segura preservam números e dados principais', () => {
    expect(EXACT_GROUP_CATEGORIES).toEqual([
      'borderGeneral',
      'middleGeneral',
      'oddNumbers',
      'evenNumbers',
      'borderOdd',
      'borderEven',
      'coreOdd',
      'coreEven',
      'prime',
      'fibonacci',
    ]);

    const before = {
      mode: 'range' as const,
      rangeStart: 3650,
      rangeEnd: 3749,
      maxJogos: 3268760,
      exactGroupExclusions: {
        borderGeneral: [[1, 2, 3, 4, 5]],
        middleGeneral: [[7, 8, 9]],
        oddNumbers: [[1, 3, 5]],
        evenNumbers: [[2, 4, 6]],
        borderOdd: [[1, 3, 5]],
        borderEven: [[2, 4, 6]],
        coreOdd: [[7, 13, 19]],
        coreEven: [[8, 12, 14]],
        prime: [[2, 3, 5]],
        fibonacci: [[1, 2, 3, 5]],
      },
      exactGroupHistoryCounts: {
        borderGeneral: 99,
        middleGeneral: 88,
      },
    };

    const after = createSafeBoxConfigClearSnapshot(before);
    expect(after.rangeStart).toBe(3650);
    expect(after.rangeEnd).toBe(3749);
    expect(after.maxJogos).toBe(3268760);
    expect(after.exactGroupExclusions).toEqual(createDefaultExactGroupExclusions());
    expect(after.exactGroupHistoryCounts).toEqual(before.exactGroupHistoryCounts);
  });
});
