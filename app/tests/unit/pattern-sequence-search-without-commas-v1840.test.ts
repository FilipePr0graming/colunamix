import { test, expect } from '@playwright/test';
import { filterPatternStatsRows, filterPatternsBySequence, parsePatternSequenceInput } from '../../src/shared/patternStats';
import { PatternStatsRow } from '../../src/shared/types';

function row(patternKey: string, occurrences = 1): PatternStatsRow {
  return {
    pattern: patternKey.split(',').map(Number),
    patternKey,
    occurrences,
    lastContest: 3761,
    lag: 0,
    recentLags: [],
    percentage: occurrences,
  };
}

const rows = [
  row('3,3,4,2,3', 20),
  row('3,3,2,3,4', 19),
  row('3,3,3,2,4', 18),
  row('3,2,3,3,4', 17),
  row('4,3,3,2,3', 16),
  row('5,4,3,2,1', 15),
];

function keys(search: string) {
  return filterPatternsBySequence(rows, search).map(item => item.patternKey);
}

test.describe('pattern sequence search without commas v1.8.40', () => {
  test('normaliza entrada compacta digito a digito', () => {
    expect(parsePatternSequenceInput('3')).toEqual([3]);
    expect(parsePatternSequenceInput('33')).toEqual([3, 3]);
    expect(parsePatternSequenceInput('334')).toEqual([3, 3, 4]);
    expect(parsePatternSequenceInput('3342')).toEqual([3, 3, 4, 2]);
    expect(parsePatternSequenceInput('33423')).toEqual([3, 3, 4, 2, 3]);
    expect(parsePatternSequenceInput('3, 3, 4')).toEqual([3, 3, 4]);
  });

  test('33 equivale a 3,3 e preserva regra de prefixo para Linha', () => {
    expect(keys('33')).toEqual(keys('3,3'));
    expect(keys('33')).toEqual([
      '3,3,4,2,3',
      '3,3,2,3,4',
      '3,3,3,2,4',
    ]);
    expect(keys('33')).not.toContain('3,2,3,3,4');
    expect(keys('33')).not.toContain('4,3,3,2,3');
  });

  test('334, 3342 e 33423 equivalem às formas com vírgula para Linha e Coluna', () => {
    const cases = [
      ['334', '3,3,4'],
      ['3342', '3,3,4,2'],
      ['33423', '3,3,4,2,3'],
    ] as const;

    for (const [compact, comma] of cases) {
      const line = filterPatternStatsRows(rows, { sequenceSearchText: compact });
      const lineComma = filterPatternStatsRows(rows, { sequenceSearchText: comma });
      const column = filterPatternStatsRows(rows, { sequenceSearchText: compact });
      const columnComma = filterPatternStatsRows(rows, { sequenceSearchText: comma });

      expect(line.map(item => item.patternKey)).toEqual(lineComma.map(item => item.patternKey));
      expect(column.map(item => item.patternKey)).toEqual(columnComma.map(item => item.patternKey));
    }

    expect(keys('334')).toEqual(['3,3,4,2,3']);
    expect(keys('334')).not.toContain('3,3,2,3,4');
  });
});
