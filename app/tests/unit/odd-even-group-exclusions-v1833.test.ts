import { test, expect } from '@playwright/test';
import {
  collectExactGroupsFromDraws,
  normalizeExactGroupExclusions,
  parseExactGroupCategoryInput,
  shouldExcludeByExactGroup,
} from '../../src/shared/exactGroupExclusions';

test.describe('odd/even exact group exclusions v1.8.33', () => {
  test('valida entrada manual dos blocos ímpares e pares', () => {
    expect(parseExactGroupCategoryInput('03,11,13,19,23', 'oddNumbers')).toEqual({
      valid: true,
      numbers: [3, 11, 13, 19, 23],
    });
    expect(parseExactGroupCategoryInput('02,04,10,22', 'evenNumbers')).toEqual({
      valid: true,
      numbers: [2, 4, 10, 22],
    });
    expect(parseExactGroupCategoryInput('02', 'oddNumbers')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente números ímpares.',
    });
    expect(parseExactGroupCategoryInput('03', 'evenNumbers')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente números pares.',
    });
    expect(parseExactGroupCategoryInput('27', 'oddNumbers').valid).toBe(false);
  });

  test('puxa grupos ímpares e pares do histórico', () => {
    const draws = [
      { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
      { numbers: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 1, 3, 5] },
    ];

    expect(collectExactGroupsFromDraws(draws, 'oddNumbers')).toEqual([
      [1, 3, 5, 7, 9, 11, 13, 15],
      [1, 3, 5],
    ]);
    expect(collectExactGroupsFromDraws(draws, 'evenNumbers')).toEqual([
      [2, 4, 6, 8, 10, 12, 14],
      [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
    ]);
  });

  test('persistência normalizada mantém novos grupos e evita duplicados', () => {
    const normalized = normalizeExactGroupExclusions({
      oddNumbers: [[23, 3, 11, 19, 13], [3, 11, 13, 19, 23]],
      evenNumbers: [[22, 2, 10, 4]],
    });

    expect(normalized.oddNumbers).toEqual([[3, 11, 13, 19, 23]]);
    expect(normalized.evenNumbers).toEqual([[2, 4, 10, 22]]);
  });

  test('regressão: gerador exclui apenas por grupo ímpar/par exato', () => {
    const exclusions = {
      oddNumbers: [[3, 11, 13, 19, 23]],
      evenNumbers: [[2, 4, 10, 22]],
    };

    const exactOddGame = [3, 11, 13, 19, 23, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const extraOddGame = [3, 11, 13, 19, 23, 25, 2, 4, 6, 8, 10, 12, 14, 16, 18];
    const exactEvenGame = [2, 4, 10, 22, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
    const extraEvenGame = [2, 4, 10, 20, 22, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    expect(shouldExcludeByExactGroup(exactOddGame, exclusions)).toBe(true);
    expect(shouldExcludeByExactGroup(extraOddGame, exclusions)).toBe(false);
    expect(shouldExcludeByExactGroup(exactEvenGame, exclusions)).toBe(true);
    expect(shouldExcludeByExactGroup(extraEvenGame, exclusions)).toBe(false);
  });

  test('limpeza e remoção individual são isoladas por categoria', () => {
    const state = normalizeExactGroupExclusions({
      borderOdd: [[1, 3, 5]],
      oddNumbers: [[3, 11, 13, 19, 23], [1, 5, 7]],
      evenNumbers: [[2, 4, 10, 22]],
    });

    const afterOddClear = { ...state, oddNumbers: [] };
    const afterEvenRemove = {
      ...state,
      evenNumbers: state.evenNumbers.filter((_, index) => index !== 0),
    };

    expect(afterOddClear.oddNumbers).toEqual([]);
    expect(afterOddClear.evenNumbers).toEqual([[2, 4, 10, 22]]);
    expect(afterOddClear.borderOdd).toEqual([[1, 3, 5]]);
    expect(afterEvenRemove.evenNumbers).toEqual([]);
    expect(afterEvenRemove.oddNumbers).toEqual([[3, 11, 13, 19, 23], [1, 5, 7]]);
  });
});
