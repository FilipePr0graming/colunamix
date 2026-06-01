import { test, expect } from '@playwright/test';
import { generateGames } from '../../src/shared/generator';
import { getColPattern, getRowPattern } from '../../src/shared/columns';
import { applyPatternRuleAction } from '../../src/shared/patternRules';
import { GeneratorConfig, PatternExclusion } from '../../src/shared/types';

const draws = [
  { numbers: [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22] },
  { numbers: [1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23] },
  { numbers: [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19] },
  { numbers: [1, 2, 4, 6, 7, 9, 11, 12, 14, 16, 17, 19, 21, 22, 24] },
];

const baseConfig: GeneratorConfig = {
  mode: 'lastN',
  lastN: 4,
  rangeStart: 1,
  rangeEnd: 9999,
  dezenasPorJogo: 15,
  maxJogos: 300,
  fixas: [],
  fixasModo: 'contem',
  exclusions: [],
  patternExclusions: [],
  patternIncludes: [],
  exactGroupExclusions: {
    coreOdd: [],
    coreEven: [],
    borderOdd: [],
    borderEven: [],
  },
  colPatternMode: 'exclude',
  rowPatternMode: 'exclude',
  noRepeatDrawn: false,
};

function rule(type: 'row' | 'column', pattern: number[]): PatternExclusion {
  return { id: `${type}-${pattern.join('-')}`, type, pattern };
}

test.describe('pattern rule actions', () => {
  test('inclui padrão em usar somente sem duplicar', () => {
    const first = applyPatternRuleAction({
      includes: [],
      exclusions: [],
      rule: rule('row', [4, 3, 3, 3, 2]),
      action: 'include',
      createId: () => 'include-row',
    });
    const second = applyPatternRuleAction({
      includes: first.includes,
      exclusions: first.exclusions,
      rule: rule('row', [4, 3, 3, 3, 2]),
      action: 'include',
    });

    expect(first.includes).toHaveLength(1);
    expect(second.includes).toHaveLength(1);
    expect(second.status).toBe('already-exists');
  });

  test('inclui padrão em excluir sem duplicar', () => {
    const first = applyPatternRuleAction({
      includes: [],
      exclusions: [],
      rule: rule('column', [5, 5, 4, 1, 0]),
      action: 'exclude',
      createId: () => 'exclude-column',
    });
    const second = applyPatternRuleAction({
      includes: first.includes,
      exclusions: first.exclusions,
      rule: rule('column', [5, 5, 4, 1, 0]),
      action: 'exclude',
    });

    expect(first.exclusions).toHaveLength(1);
    expect(second.exclusions).toHaveLength(1);
    expect(second.status).toBe('already-exists');
  });

  test('move padrão conflitante entre usar somente e excluir', () => {
    const excludeFirst = applyPatternRuleAction({
      includes: [],
      exclusions: [],
      rule: rule('row', [3, 3, 3, 3, 3]),
      action: 'exclude',
    });
    const includeAfter = applyPatternRuleAction({
      includes: excludeFirst.includes,
      exclusions: excludeFirst.exclusions,
      rule: rule('row', [3, 3, 3, 3, 3]),
      action: 'include',
    });

    expect(includeAfter.status).toBe('moved');
    expect(includeAfter.includes).toHaveLength(1);
    expect(includeAfter.exclusions).toHaveLength(0);
  });
});

test.describe('generator pattern filters', () => {
  test('gerador respeita padrão de linha em usar somente', () => {
    const pattern = getRowPattern(draws[0].numbers);
    const games = generateGames(draws, {
      ...baseConfig,
      rowPatternMode: 'include',
      patternIncludes: [rule('row', pattern.split(',').map(Number))],
    });

    expect(games.length).toBeGreaterThan(0);
    expect(games.every(game => getRowPattern(game.numbers) === pattern)).toBeTruthy();
  });

  test('gerador respeita padrão de coluna em usar somente', () => {
    const pattern = getColPattern(draws[0].numbers);
    const games = generateGames(draws, {
      ...baseConfig,
      colPatternMode: 'include',
      patternIncludes: [rule('column', pattern.split(',').map(Number))],
    });

    expect(games.length).toBeGreaterThan(0);
    expect(games.every(game => getColPattern(game.numbers) === pattern)).toBeTruthy();
  });

  test('gerador respeita padrão de linha em excluir', () => {
    const pattern = getRowPattern(draws[0].numbers);
    const games = generateGames(draws, {
      ...baseConfig,
      patternExclusions: [rule('row', pattern.split(',').map(Number))],
    });

    expect(games.length).toBeGreaterThan(0);
    expect(games.every(game => getRowPattern(game.numbers) !== pattern)).toBeTruthy();
  });

  test('gerador respeita padrão de coluna em excluir', () => {
    const pattern = getColPattern(draws[0].numbers);
    const games = generateGames(draws, {
      ...baseConfig,
      patternExclusions: [rule('column', pattern.split(',').map(Number))],
    });

    expect(games.length).toBeGreaterThan(0);
    expect(games.every(game => getColPattern(game.numbers) !== pattern)).toBeTruthy();
  });
});
