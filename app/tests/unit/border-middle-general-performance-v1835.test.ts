import { test, expect } from '@playwright/test';
import {
  BORDER_NUMBERS,
  CORE_NUMBERS,
  buildExactGroupExclusionKeySets,
  collectExactGroupsFromDraws,
  formatExactGroup,
  getBorderNumbers,
  getMiddleNumbers,
  normalizeExactGroupExclusions,
  parseExactGroupCategoryInput,
  shouldExcludeByExactGroup,
  shouldExcludeByExactGroupWithKeySets,
} from '../../src/shared/exactGroupExclusions';

test.describe('border/middle general exact exclusions v1.8.35', () => {
  const borderGroup = [1, 2, 3, 11, 21, 22, 23, 24, 25];
  const middleGroup = [7, 8, 12, 13, 17, 18];

  test('valida listas oficiais de Borda e Miolo', () => {
    expect(BORDER_NUMBERS).toEqual([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
    expect([...CORE_NUMBERS]).toEqual([7, 8, 9, 12, 13, 14, 17, 18, 19]);
  });

  test('valida entrada manual, normalização, ordenação e bloqueios por composição', () => {
    expect(parseExactGroupCategoryInput('23,01,11,03,21,02,25,24,22', 'borderGeneral')).toEqual({
      valid: true,
      numbers: borderGroup,
    });
    expect(formatExactGroup(borderGroup)).toBe('01,02,03,11,21,22,23,24,25');
    expect(parseExactGroupCategoryInput('18,07,13,08,12,17', 'middleGeneral')).toEqual({
      valid: true,
      numbers: middleGroup,
    });
    expect(parseExactGroupCategoryInput('07', 'borderGeneral')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente dezenas da borda.',
    });
    expect(parseExactGroupCategoryInput('01', 'middleGeneral')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente dezenas do miolo.',
    });
    expect(parseExactGroupCategoryInput('26', 'borderGeneral').valid).toBe(false);
    expect(parseExactGroupCategoryInput('07,07', 'middleGeneral').valid).toBe(false);
  });

  test('puxa grupos de Borda e Miolo do histórico sem duplicar', () => {
    const draws = [
      { numbers: [1, 2, 3, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25] },
      { numbers: [1, 2, 3, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25] },
      { numbers: [4, 5, 6, 9, 10, 12, 14, 15, 16, 19, 20, 21, 22, 23, 24] },
    ];

    expect(collectExactGroupsFromDraws(draws, 'borderGeneral')).toEqual([
      borderGroup,
      [4, 5, 6, 10, 15, 16, 20, 21, 22, 23, 24],
    ]);
    expect(collectExactGroupsFromDraws(draws, 'middleGeneral')).toEqual([
      middleGroup,
      [9, 12, 14, 19],
    ]);
  });

  test('limpeza, remoção individual e persistência são isoladas', () => {
    const state = normalizeExactGroupExclusions({
      borderOdd: [[1, 3, 5]],
      coreEven: [[8, 12, 14]],
      borderGeneral: [borderGroup, [4, 5, 6]],
      middleGeneral: [middleGroup],
      oddNumbers: [[1, 3, 5, 7]],
    });

    const afterBorderClear = { ...state, borderGeneral: [] };
    const afterMiddleRemove = { ...state, middleGeneral: state.middleGeneral.filter((_, index) => index !== 0) };

    expect(afterBorderClear.borderGeneral).toEqual([]);
    expect(afterBorderClear.middleGeneral).toEqual([middleGroup]);
    expect(afterBorderClear.borderOdd).toEqual([[1, 3, 5]]);
    expect(afterMiddleRemove.middleGeneral).toEqual([]);
    expect(afterMiddleRemove.borderGeneral).toEqual([borderGroup, [4, 5, 6]]);
    expect(afterMiddleRemove.oddNumbers).toEqual([[1, 3, 5, 7]]);
  });

  test('regressão: gerador exclui por subconjunto exato de Borda e Miolo com cache estável', () => {
    const borderExactGame = [1, 2, 3, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25];
    const borderDifferentGame = [1, 2, 4, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25];
    const middleExactGame = [1, 2, 3, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25];
    const middleDifferentGame = [1, 2, 3, 7, 9, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25];
    const borderKeySets = buildExactGroupExclusionKeySets({ borderGeneral: [borderGroup] });
    const middleKeySets = buildExactGroupExclusionKeySets({ middleGeneral: [middleGroup] });

    expect(getBorderNumbers(borderExactGame)).toEqual(borderGroup);
    expect(getMiddleNumbers(middleExactGame)).toEqual(middleGroup);
    expect(shouldExcludeByExactGroup(borderExactGame, { borderGeneral: [borderGroup] })).toBe(true);
    expect(shouldExcludeByExactGroup(borderDifferentGame, { borderGeneral: [borderGroup] })).toBe(false);
    expect(shouldExcludeByExactGroup(middleExactGame, { middleGeneral: [middleGroup] })).toBe(true);
    expect(shouldExcludeByExactGroup(middleDifferentGame, { middleGeneral: [middleGroup] })).toBe(false);

    for (let run = 0; run < 5; run++) {
      expect(shouldExcludeByExactGroupWithKeySets(borderExactGame, borderKeySets, {})).toBe(true);
      expect(shouldExcludeByExactGroupWithKeySets(borderDifferentGame, borderKeySets, {})).toBe(false);
      expect(shouldExcludeByExactGroupWithKeySets(middleExactGame, middleKeySets, {})).toBe(true);
      expect(shouldExcludeByExactGroupWithKeySets(middleDifferentGame, middleKeySets, {})).toBe(false);
    }
  });
});
