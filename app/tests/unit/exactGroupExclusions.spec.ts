import { test, expect } from '@playwright/test';
import {
  areGroupsEqual,
  getBorderEvenNumbers,
  getBorderOddNumbers,
  getCoreEvenNumbers,
  getCoreOddNumbers,
  getExactGroupNumbersForCategory,
  formatExactGroupInputText,
  normalizeGroup,
  parseExactGroupInput,
  shouldExcludeByExactGroup,
} from '../../src/shared/exactGroupExclusions';

test.describe('exact group exclusions', () => {
  test('exclui quando Miolo Ímpares bate exatamente', () => {
    const game = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 19, 20];

    expect(getCoreOddNumbers(game)).toEqual([7, 13, 19]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [[7, 13, 19]],
      coreEven: [],
      borderOdd: [],
      borderEven: [],
    })).toBe(true);
  });

  test('não exclui Miolo Ímpares quando o jogo tem menos dezenas', () => {
    const game = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 20, 21];

    expect(getCoreOddNumbers(game)).toEqual([7, 13]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [[7, 13, 19]],
      coreEven: [],
      borderOdd: [],
      borderEven: [],
    })).toBe(false);
  });

  test('não exclui Miolo Ímpares quando o jogo tem dezenas a mais', () => {
    const game = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20];

    expect(getCoreOddNumbers(game)).toEqual([7, 9, 13, 19]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [[7, 13, 19]],
      coreEven: [],
      borderOdd: [],
      borderEven: [],
    })).toBe(false);
  });

  test('não exclui quando o grupo está configurado em outra categoria', () => {
    const game = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

    expect(getBorderOddNumbers(game)).toEqual([1, 3, 5]);
    expect(getCoreOddNumbers(game)).toEqual([]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [[1, 3, 5]],
      coreEven: [],
      borderOdd: [],
      borderEven: [],
    })).toBe(false);
  });

  test('exclui Borda Ímpares quando bate exatamente', () => {
    const game = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 21, 23];

    expect(getBorderOddNumbers(game)).toEqual([1, 3, 5, 11, 21, 23]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [],
      coreEven: [],
      borderOdd: [[1, 3, 5, 11, 21, 23]],
      borderEven: [],
    })).toBe(true);
  });

  test('não exclui Borda Ímpares quando o jogo tem número extra', () => {
    const game = [1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 21, 23, 25];

    expect(getBorderOddNumbers(game)).toEqual([1, 3, 5, 11, 21, 23, 25]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [],
      coreEven: [],
      borderOdd: [[1, 3, 5, 11, 21, 23]],
      borderEven: [],
    })).toBe(false);
  });

  test('separa também Miolo Pares e Borda Pares', () => {
    const game = [1, 2, 3, 4, 5, 7, 8, 10, 12, 14, 16, 18, 20, 21, 23];

    expect(getCoreEvenNumbers(game)).toEqual([8, 12, 14, 18]);
    expect(getBorderEvenNumbers(game)).toEqual([2, 4, 10, 16, 20]);
    expect(shouldExcludeByExactGroup(game, {
      coreOdd: [],
      coreEven: [[8, 12, 14, 18]],
      borderOdd: [],
      borderEven: [],
    })).toBe(true);
  });

  test('normaliza entrada textual fora de ordem', () => {
    expect(parseExactGroupInput('19, 07, 13')).toEqual({
      valid: true,
      numbers: [7, 13, 19],
    });
  });

  test('adiciona vírgulas automaticamente ao digitar dezenas em pares', () => {
    expect(formatExactGroupInputText('0204')).toBe('02,04');
    expect(formatExactGroupInputText('061020')).toBe('06,10,20');
    expect(formatExactGroupInputText('02,0410')).toBe('02,04,10');
    expect(formatExactGroupInputText('7,13')).toBe('7,13');
  });

  test('extrai o grupo correto para cadastro histórico por categoria', () => {
    const game = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 19, 20];

    expect(getExactGroupNumbersForCategory(game, 'coreOdd')).toEqual([7, 13, 19]);
    expect(getExactGroupNumbersForCategory(game, 'coreEven')).toEqual([8, 12, 14]);
    expect(getExactGroupNumbersForCategory(game, 'borderOdd')).toEqual([1, 3, 5, 11]);
    expect(getExactGroupNumbersForCategory(game, 'borderEven')).toEqual([2, 4, 6, 10, 20]);
  });

  test('normaliza duplicidade dentro do grupo', () => {
    expect(normalizeGroup([7, 13, 13, 19])).toEqual([7, 13, 19]);
    expect(areGroupsEqual([19, 7, 13, 13], [7, 13, 19])).toBe(true);
  });

  test('rejeita texto inválido, grupo vazio e dezenas fora de 01 a 25', () => {
    expect(parseExactGroupInput('07,abc,19').valid).toBe(false);
    expect(parseExactGroupInput('').valid).toBe(false);
    expect(parseExactGroupInput('07,26').valid).toBe(false);
  });
});
