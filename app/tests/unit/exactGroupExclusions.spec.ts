import { test, expect } from '@playwright/test';
import {
  areGroupsEqual,
  getBorderEvenNumbers,
  getBorderNumbers,
  getBorderOddNumbers,
  getCoreEvenNumbers,
  getCoreOddNumbers,
  getExactGroupNumbersForCategory,
  getFibonacciNumbers,
  getEvenNumbers,
  getMiddleNumbers,
  getOddNumbers,
  getPrimeNumbers,
  formatExactGroupInputText,
  collectExactGroupsFromDraws,
  EXACT_GROUP_CATEGORIES,
  normalizeExactGroupExclusions,
  normalizeGroup,
  parseExactGroupInput,
  parseExactGroupCategoryInput,
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

  test('identifica e normaliza grupos de primos e Fibonacci', () => {
    const game = [1, 2, 3, 4, 5, 8, 9, 11, 13, 14, 19, 20, 21, 23, 25];

    expect(getPrimeNumbers(game)).toEqual([2, 3, 5, 11, 13, 19, 23]);
    expect(getFibonacciNumbers(game)).toEqual([1, 2, 3, 5, 8, 13, 21]);
    expect(parseExactGroupCategoryInput('23110313', 'prime')).toEqual({
      valid: true,
      numbers: [3, 11, 13, 23],
    });
    expect(parseExactGroupCategoryInput('21 01 08 03', 'fibonacci')).toEqual({
      valid: true,
      numbers: [1, 3, 8, 21],
    });
  });

  test('rejeita dezenas fora do conjunto e dezenas duplicadas', () => {
    expect(parseExactGroupCategoryInput('02,04,11', 'prime')).toMatchObject({
      valid: false,
      error: 'Use apenas dezenas primas: 02,03,05,07,11,13,17,19,23.',
    });
    expect(parseExactGroupCategoryInput('01,04,13', 'fibonacci')).toMatchObject({
      valid: false,
      error: 'Use apenas dezenas Fibonacci: 01,02,03,05,08,13,21.',
    });
    expect(parseExactGroupCategoryInput('03,03,11', 'prime')).toMatchObject({
      valid: false,
      error: 'Grupo inválido: existem dezenas repetidas.',
    });
  });

  test('exclusão de primos usa somente o grupo exato', () => {
    const exact = [1, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 19, 20, 23, 25];
    const subset = exact.filter(number => number !== 13);
    const superset = [...exact, 2];
    const exclusions = { prime: [[3, 11, 13, 19, 23]] };

    expect(shouldExcludeByExactGroup(exact, exclusions)).toBe(true);
    expect(shouldExcludeByExactGroup(subset, exclusions)).toBe(false);
    expect(shouldExcludeByExactGroup(superset, exclusions)).toBe(false);
  });

  test('exclusão Fibonacci usa somente o grupo exato', () => {
    const exact = [1, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 21, 22, 25];
    const subset = exact.filter(number => number !== 5);
    const superset = [...exact, 2];
    const exclusions = { fibonacci: [[1, 3, 5, 13, 21]] };

    expect(shouldExcludeByExactGroup(exact, exclusions)).toBe(true);
    expect(shouldExcludeByExactGroup(subset, exclusions)).toBe(false);
    expect(shouldExcludeByExactGroup(superset, exclusions)).toBe(false);
  });

  test('persiste categorias novas, coleta histórico sem duplicar e preserva a ordem dos painéis', () => {
    const normalized = normalizeExactGroupExclusions({
      prime: [[23, 3, 11], [3, 11, 23]],
      fibonacci: [[21, 1, 8]],
    });
    const draws = [
      { numbers: [1, 2, 3, 4, 5, 8, 9, 11, 13, 14, 19, 20, 21, 23, 25] },
      { numbers: [1, 2, 3, 4, 5, 8, 9, 11, 13, 14, 19, 20, 21, 23, 25] },
      { numbers: [1, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 21, 22, 25] },
    ];

    expect(normalized.prime).toEqual([[3, 11, 23]]);
    expect(normalized.fibonacci).toEqual([[1, 8, 21]]);
    expect(collectExactGroupsFromDraws(draws, 'prime')).toHaveLength(2);
    expect(collectExactGroupsFromDraws(draws, 'fibonacci')).toHaveLength(2);
    expect(EXACT_GROUP_CATEGORIES).toEqual([
      'borderOdd',
      'borderEven',
      'coreOdd',
      'coreEven',
      'borderGeneral',
      'middleGeneral',
      'prime',
      'fibonacci',
      'oddNumbers',
      'evenNumbers',
    ]);
  });

  test('valida listas de números ímpares e pares completas', () => {
    const fullGame = Array.from({ length: 25 }, (_, index) => index + 1);

    expect(getOddNumbers(fullGame)).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]);
    expect(getEvenNumbers(fullGame)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]);
  });

  test('bloqueia par no bloco Ímpares e ímpar no bloco Pares', () => {
    expect(parseExactGroupCategoryInput('01,03,05,10', 'oddNumbers')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente números ímpares.',
    });
    expect(parseExactGroupCategoryInput('02,04,06,11', 'evenNumbers')).toMatchObject({
      valid: false,
      error: 'Este bloco aceita somente números pares.',
    });
  });

  test('normaliza, ordena, formata e rejeita repetidos nos novos blocos', () => {
    expect(parseExactGroupCategoryInput('23, 3, 11, 19, 13', 'oddNumbers')).toEqual({
      valid: true,
      numbers: [3, 11, 13, 19, 23],
    });
    expect(parseExactGroupCategoryInput('22,2,10,04', 'evenNumbers')).toEqual({
      valid: true,
      numbers: [2, 4, 10, 22],
    });
    expect(parseExactGroupCategoryInput('03,03,11', 'oddNumbers')).toMatchObject({
      valid: false,
      error: 'Grupo inválido: existem dezenas repetidas.',
    });
  });

  test('puxa grupos ímpares e pares dos concursos históricos sem duplicar', () => {
    const draws = [
      { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
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

  test('normaliza persistência dos novos grupos e preserva grupos antigos', () => {
    const normalized = normalizeExactGroupExclusions({
      borderOdd: [[1, 3, 5]],
      coreEven: [[8, 12, 14]],
      prime: [[3, 11, 23]],
      fibonacci: [[1, 8, 21]],
      oddNumbers: [[23, 3, 11, 19, 13], [3, 11, 13, 19, 23]],
      evenNumbers: [[22, 2, 10, 4]],
    });

    expect(normalized.borderOdd).toEqual([[1, 3, 5]]);
    expect(normalized.coreEven).toEqual([[8, 12, 14]]);
    expect(normalized.prime).toEqual([[3, 11, 23]]);
    expect(normalized.fibonacci).toEqual([[1, 8, 21]]);
    expect(normalized.oddNumbers).toEqual([[3, 11, 13, 19, 23]]);
    expect(normalized.evenNumbers).toEqual([[2, 4, 10, 22]]);
  });
});
