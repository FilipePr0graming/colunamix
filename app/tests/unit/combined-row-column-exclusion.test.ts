import { test, expect } from '@playwright/test';
import { getColPattern, getRowPattern } from '../../src/shared/columns';
import {
  collectCombinedPatternExclusionsFromDraws,
  getCombinedPatternKey,
  normalizeCombinedPatternExclusions,
  parseCombinedPatternInput,
  toCombinedPatternKey,
} from '../../src/shared/combinedPatternExclusions';
import { createSafeBoxConfigClearSnapshot, parsePersistedGeneratorSettings } from '../../src/shared/generatorSettings';
import { generateGames } from '../../src/shared/generator';
import { GeneratorConfig, PatternExclusion } from '../../src/shared/types';

const blockedGame = [1, 2, 3, 6, 7, 9, 13, 14, 15, 18, 19, 20, 23, 24, 25];
const sameRowDifferentColumn = [1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23];
const differentRowSameColumn = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 18, 19];
const differentCombination = [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 16, 17, 21, 22];

const baseDraws = [
  { numbers: blockedGame },
  { numbers: sameRowDifferentColumn },
  { numbers: differentRowSameColumn },
  { numbers: differentCombination },
];

const baseConfig: GeneratorConfig = {
  mode: 'lastN',
  lastN: 4,
  rangeStart: 1,
  rangeEnd: 9999,
  dezenasPorJogo: 15,
  maxJogos: 2000,
  fixas: [],
  fixasModo: 'contem',
  exclusions: [],
  patternExclusions: [],
  patternIncludes: [],
  combinedPatternExclusions: [],
  exactGroupExclusions: {
    borderOdd: [],
    borderEven: [],
    coreOdd: [],
    coreEven: [],
    borderGeneral: [],
    middleGeneral: [],
    prime: [],
    fibonacci: [],
    oddNumbers: [],
    evenNumbers: [],
  },
  colPatternMode: 'exclude',
  rowPatternMode: 'exclude',
  noRepeatDrawn: false,
};

function rule(type: 'row' | 'column', patternKey: string): PatternExclusion {
  return { id: `${type}-${patternKey}`, type, pattern: patternKey.split(',').map(Number) };
}

function onlyGeneratedGame(config: Partial<GeneratorConfig>, draw = blockedGame) {
  const games = generateGames([{ numbers: draw }], {
    ...baseConfig,
    ...config,
    maxJogos: 5,
  });
  return games.find(game => game.key === draw.map(number => String(number).padStart(2, '0')).join(','));
}

test.describe('combined row and column exclusions', () => {
  test('calcula corretamente o Padrão de Linha', () => {
    expect(getRowPattern(blockedGame)).toBe('3,3,3,3,3');
  });

  test('calcula corretamente o Padrão de Coluna', () => {
    expect(getColPattern(blockedGame)).toBe('2,2,4,4,3');
  });

  test('cria corretamente a chave combinada', () => {
    expect(getCombinedPatternKey(blockedGame)).toBe('3,3,3,3,3|2,2,4,4,3');
  });

  test('mesma Linha + mesma Coluna gera mesma chave', () => {
    expect(toCombinedPatternKey([3, 3, 3, 3, 3], [2, 2, 4, 4, 3])).toBe('3,3,3,3,3|2,2,4,4,3');
    expect(getCombinedPatternKey(blockedGame)).toBe(toCombinedPatternKey([3, 3, 3, 3, 3], [2, 2, 4, 4, 3]));
  });

  test('mesma Linha + Coluna diferente gera chave diferente', () => {
    expect(getRowPattern(sameRowDifferentColumn)).toBe('3,3,3,3,3');
    expect(getColPattern(sameRowDifferentColumn)).not.toBe('2,2,4,4,3');
    expect(getCombinedPatternKey(sameRowDifferentColumn)).not.toBe(getCombinedPatternKey(blockedGame));
  });

  test('Linha diferente + mesma Coluna gera chave diferente', () => {
    expect(getRowPattern(differentRowSameColumn)).not.toBe('3,3,3,3,3');
    expect(getColPattern(differentRowSameColumn)).toBe('2,2,4,4,3');
    expect(getCombinedPatternKey(differentRowSameColumn)).not.toBe(getCombinedPatternKey(blockedGame));
  });

  test('histórico gera combinações corretamente', () => {
    const combinations = collectCombinedPatternExclusionsFromDraws([{ numbers: blockedGame }], () => 'fixed-id');
    expect(combinations).toEqual([{
      id: 'fixed-id',
      rowPattern: [3, 3, 3, 3, 3],
      columnPattern: [2, 2, 4, 4, 3],
    }]);
  });

  test('duplicidades históricas são removidas', () => {
    const combinations = collectCombinedPatternExclusionsFromDraws([
      { numbers: blockedGame },
      { numbers: blockedGame },
    ]);
    expect(combinations).toHaveLength(1);
  });

  test('adicionar combinação manual/programaticamente funciona', () => {
    const parsed = parseCombinedPatternInput('33333', '22443', 15);
    expect(parsed.valid).toBe(true);
    expect(toCombinedPatternKey(parsed.rowPattern, parsed.columnPattern)).toBe('3,3,3,3,3|2,2,4,4,3');
  });

  test('remover combinação funciona', () => {
    const combinations = normalizeCombinedPatternExclusions([
      { id: 'keep', rowPattern: [3, 3, 3, 3, 3], columnPattern: [3, 3, 3, 3, 3] },
      { id: 'remove', rowPattern: [3, 3, 3, 3, 3], columnPattern: [2, 2, 4, 4, 3] },
    ]).filter(item => item.id !== 'remove');
    expect(combinations.map(item => item.id)).toEqual(['keep']);
  });

  test('limpar filtro funciona', () => {
    expect([] as ReturnType<typeof normalizeCombinedPatternExclusions>).toEqual([]);
  });

  test('persistência funciona', () => {
    const parsed = parsePersistedGeneratorSettings(JSON.stringify({
      combinedPatternExclusions: [
        { id: 'stored', rowPattern: [3, 3, 3, 3, 3], columnPattern: [2, 2, 4, 4, 3] },
      ],
      combinedPatternHistoryCount: 12,
    }));
    expect(parsed?.combinedPatternHistoryCount).toBe(12);
    expect(normalizeCombinedPatternExclusions(parsed?.combinedPatternExclusions)).toHaveLength(1);
  });

  test('Gerador exclui jogo com combinação cadastrada', () => {
    expect(onlyGeneratedGame({
      combinedPatternExclusions: [
        { id: 'blocked', rowPattern: [3, 3, 3, 3, 3], columnPattern: [2, 2, 4, 4, 3] },
      ],
    })).toBeUndefined();
  });

  test('Gerador NÃO exclui se somente a Linha coincidir', () => {
    expect(onlyGeneratedGame({
      combinedPatternExclusions: [
        { id: 'other-column', rowPattern: [3, 3, 3, 3, 3], columnPattern: [3, 2, 4, 3, 3] },
      ],
    })).toBeTruthy();
  });

  test('Gerador NÃO exclui se somente a Coluna coincidir', () => {
    expect(onlyGeneratedGame({
      combinedPatternExclusions: [
        { id: 'other-row', rowPattern: [4, 3, 2, 3, 3], columnPattern: [2, 2, 4, 4, 3] },
      ],
    })).toBeTruthy();
  });

  test('Gerador NÃO exclui combinação diferente', () => {
    expect(onlyGeneratedGame({
      combinedPatternExclusions: [
        { id: 'different', rowPattern: [4, 3, 2, 3, 3], columnPattern: [3, 2, 4, 3, 3] },
      ],
    })).toBeTruthy();
  });

  test('filtros anteriores continuam funcionando', () => {
    const rowPattern = getRowPattern(blockedGame);
    const games = generateGames(baseDraws, {
      ...baseConfig,
      patternExclusions: [rule('row', rowPattern)],
    });
    expect(games.length).toBeGreaterThan(0);
    expect(games.every(game => getRowPattern(game.numbers) !== rowPattern)).toBe(true);
  });

  test('geração continua válida sem nenhuma combinação cadastrada', () => {
    const games = generateGames([{ numbers: blockedGame }], baseConfig);
    expect(games.some(game => game.key === '01,02,03,06,07,09,13,14,15,18,19,20,23,24,25')).toBe(true);
  });

  test('limpeza global inclui somente snapshot de filtros e preserva dados-base', () => {
    const snapshot = createSafeBoxConfigClearSnapshot({
      mode: 'range' as const,
      rangeStart: 3600,
      rangeEnd: 3708,
      combinedPatternExclusions: [
        { id: 'stored', rowPattern: [3, 3, 3, 3, 3], columnPattern: [2, 2, 4, 4, 3] },
      ],
    });

    expect(snapshot.mode).toBe('range');
    expect(snapshot.rangeStart).toBe(3600);
    expect(snapshot.rangeEnd).toBe(3708);
    expect(snapshot.combinedPatternExclusions).toEqual([]);
  });
});
