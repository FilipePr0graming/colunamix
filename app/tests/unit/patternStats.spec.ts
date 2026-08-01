import { test, expect } from '@playwright/test';
import {
  calculatePatternStats,
  canonicalPatternKey,
  clearPatternStatsCache,
  filterPatternStatsRows,
  filterPatternsBySearch,
  isPatternVariation,
  parsePatternInput,
  serializePatternStatsCsv,
  serializePatternStatsExcel,
  serializePatternStatsTxt,
  sortPatternStatsRows,
} from '../../src/shared/patternStats';
import { PatternStatsRow } from '../../src/shared/types';

const draws = [
  { contest: 1001, numbers: [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22] },
  { contest: 1002, numbers: [1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23] },
  { contest: 1003, numbers: [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19] },
  { contest: 1004, numbers: [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22] },
];

function sortNumeric(rows: PatternStatsRow[], direction: 'asc' | 'desc') {
  return [...rows].sort((a, b) => {
    for (let i = 0; i < a.pattern.length; i++) {
      const diff = a.pattern[i] - b.pattern[i];
      if (diff !== 0) return direction === 'asc' ? diff : -diff;
    }
    return 0;
  });
}

test.describe('pattern stats', () => {
  test.beforeEach(() => clearPatternStatsCache());

  test('calcula corretamente padrões de linha', () => {
    const rows = calculatePatternStats(draws, 'row');
    const repeated = rows.find(row => row.patternKey === '4,3,3,3,2');

    expect(repeated).toMatchObject({
      occurrences: 2,
      lastContest: 1004,
      lag: 0,
    });
    expect(repeated?.percentage).toBe(50);
  });

  test('calcula corretamente padrões de coluna', () => {
    const rows = calculatePatternStats(draws, 'column');
    const repeated = rows.find(row => row.patternKey === '5,5,4,1,0');

    expect(repeated).toMatchObject({
      occurrences: 2,
      lastContest: 1004,
      lag: 0,
    });
  });

  test('calcula atraso pelo último concurso analisado', () => {
    const rows = calculatePatternStats(draws, 'row');
    const delayed = rows.find(row => row.patternKey === '3,3,3,3,3');

    expect(delayed).toMatchObject({
      occurrences: 1,
      lastContest: 1002,
      lag: 2,
    });
  });

  test('respeita filtro até concurso X', () => {
    const rows = calculatePatternStats(draws, 'row', 1002);
    const repeated = rows.find(row => row.patternKey === '4,3,3,3,2');
    const futurePattern = rows.find(row => row.patternKey === '5,5,5,0,0');

    expect(repeated).toMatchObject({
      occurrences: 1,
      lastContest: 1001,
      lag: 1,
    });
    expect(futurePattern).toBeUndefined();
  });

  test('ordenação numérica crescente e decrescente preserva sequência do padrão', () => {
    const rows = calculatePatternStats(draws, 'row');
    const asc = sortNumeric(rows, 'asc').map(row => row.patternKey);
    const desc = sortNumeric(rows, 'desc').map(row => row.patternKey);

    expect(asc).toEqual(['3,3,3,3,3', '4,3,3,3,2', '4,4,4,3,0']);
    expect(desc).toEqual(['4,4,4,3,0', '4,3,3,3,2', '3,3,3,3,3']);
  });

  test('ordenação por frequência suporta mais e menos ocorrências primeiro', () => {
    const rows = calculatePatternStats(draws, 'row');
    const most = sortPatternStatsRows(rows, 'occurrences-desc');
    const least = sortPatternStatsRows(rows, 'occurrences-asc');

    expect(most[0].patternKey).toBe('4,3,3,3,2');
    expect(least[0].occurrences).toBe(1);
  });

  test('filtra por mínimo de ocorrências', () => {
    const rows = calculatePatternStats(draws, 'row');
    const filtered = filterPatternStatsRows(rows, {
      minOccurrences: '2',
      sort: 'occurrences-desc',
    });

    expect(filtered.map(row => row.patternKey)).toEqual(['4,3,3,3,2']);
    expect(filtered.every(row => row.occurrences >= 2)).toBeTruthy();
  });

  test('busca exata encontra padrão informado', () => {
    const rows = calculatePatternStats(draws, 'column');
    const filtered = filterPatternStatsRows(rows, {
      searchText: '5,5,4,1,0',
      sort: 'occurrences-desc',
    });

    expect(filtered.map(row => row.patternKey)).toContain('5,5,4,1,0');
  });

  test('ordena pelo helper compartilhado em crescente e decrescente', () => {
    const rows = calculatePatternStats(draws, 'row');
    const asc = sortPatternStatsRows(rows, 'numeric-asc').map(row => row.patternKey);
    const desc = sortPatternStatsRows(rows, 'numeric-desc').map(row => row.patternKey);

    expect(asc).toEqual(['3,3,3,3,3', '4,3,3,3,2', '4,4,4,3,0']);
    expect(desc).toEqual(['4,4,4,3,0', '4,3,3,3,2', '3,3,3,3,3']);
  });

  test('exporta CSV', () => {
    const csv = serializePatternStatsCsv(calculatePatternStats(draws, 'row'));

    expect(csv).toContain('Padrao;Ocorrencias;Ultima vez;Atraso;Percentual');
    expect(csv).toContain('"4,3,3,3,2";2;1004;0;"50,00%"');
  });

  test('exporta TXT', () => {
    const txt = serializePatternStatsTxt(calculatePatternStats(draws, 'row'));

    expect(txt).toContain('Padrao 4,3,3,3,2 | Ocorrencias 2 | Ultima vez Concurso 1004 | Atraso 0 | Percentual 50.00%');
  });

  test('exporta Excel em formato SpreadsheetML legível pelo Excel', () => {
    const excel = serializePatternStatsExcel(calculatePatternStats(draws, 'row'));

    expect(excel).toContain('<?mso-application progid="Excel.Sheet"?>');
    expect(excel).toContain('<Worksheet ss:Name="Padroes">');
    expect(excel).toContain('4,3,3,3,2');
  });

  test('normaliza entrada com vírgulas, espaços e formato compacto', () => {
    expect(parsePatternInput(' 1, 2, 3, 4, 5 ')).toEqual([1, 2, 3, 4, 5]);
    expect(parsePatternInput('1 2 3 4 5')).toEqual([1, 2, 3, 4, 5]);
    expect(parsePatternInput('12345')).toEqual([1, 2, 3, 4, 5]);
    expect(canonicalPatternKey('5,4,3,2,1')).toBe('1,2,3,4,5');
  });

  test('busca por variações compara multiconjunto e preserva repetições', () => {
    expect(isPatternVariation('1,2,3,4,5', '5,4,3,2,1')).toBeTruthy();
    expect(isPatternVariation('1,2,3,4,5', '2,4,5,3,1')).toBeTruthy();
    expect(isPatternVariation('1,2,3,4,5', '4,5,3,2,1')).toBeTruthy();
    expect(isPatternVariation('4,3,3,3,2', '3,4,3,3,2')).toBeTruthy();
    expect(isPatternVariation('4,3,3,3,2', '3,3,4,2,3')).toBeTruthy();
    expect(isPatternVariation('4,3,3,3,2', '4,4,3,2,2')).toBeFalsy();
  });

  test('filtra padrões equivalentes em linha e coluna sem depender de ordem textual', () => {
    const rows: PatternStatsRow[] = [
      { pattern: [5, 4, 3, 2, 1], patternKey: '5,4,3,2,1', occurrences: 1, lastContest: 10, lag: 0, recentLags: [], percentage: 10 },
      { pattern: [2, 4, 5, 3, 1], patternKey: '2,4,5,3,1', occurrences: 1, lastContest: 11, lag: 0, recentLags: [], percentage: 10 },
      { pattern: [4, 5, 3, 2, 1], patternKey: '4,5,3,2,1', occurrences: 1, lastContest: 12, lag: 0, recentLags: [], percentage: 10 },
      { pattern: [4, 4, 3, 2, 2], patternKey: '4,4,3,2,2', occurrences: 1, lastContest: 13, lag: 0, recentLags: [], percentage: 10 },
    ];
    const columns: PatternStatsRow[] = [
      { pattern: [3, 4, 3, 3, 2], patternKey: '3,4,3,3,2', occurrences: 1, lastContest: 20, lag: 0, recentLags: [], percentage: 10 },
      { pattern: [3, 3, 4, 2, 3], patternKey: '3,3,4,2,3', occurrences: 1, lastContest: 21, lag: 0, recentLags: [], percentage: 10 },
      { pattern: [4, 4, 3, 2, 2], patternKey: '4,4,3,2,2', occurrences: 1, lastContest: 22, lag: 0, recentLags: [], percentage: 10 },
    ];

    expect(filterPatternsBySearch(rows, '1,2,3,4,5').map(row => row.patternKey)).toEqual([
      '5,4,3,2,1',
      '2,4,5,3,1',
      '4,5,3,2,1',
    ]);
    expect(filterPatternsBySearch(columns, '4,3,3,3,2').map(row => row.patternKey)).toEqual([
      '3,4,3,3,2',
      '3,3,4,2,3',
    ]);
  });

  test('busca inválida não quebra e mantém resultado vazio quando não há texto compatível', () => {
    const rows = calculatePatternStats(draws, 'row');

    expect(parsePatternInput('1,2,a,4,5')).toBeNull();
    expect(parsePatternInput('1,,2,3')).toBeNull();
    expect(parsePatternInput('texto')).toBeNull();
    expect(filterPatternsBySearch(rows, 'texto')).toEqual([]);
  });

  test('calcula os últimos atrasos sem alterar o atraso atual', () => {
    const repeatedNumbers = draws[0].numbers;
    const history = [3500, 3540, 3600, 3625, 3670, 3696].map(contest => ({
      contest,
      numbers: repeatedNumbers,
    }));
    history.push({ contest: 3704, numbers: draws[2].numbers });

    const rows = calculatePatternStats(history, 'row');
    const repeated = rows.find(row => row.patternKey === '4,3,3,3,2');
    const single = rows.find(row => row.patternKey === '4,4,4,3,0');

    expect(repeated?.recentLags).toEqual([40, 60, 25, 45, 26]);
    expect(repeated?.lag).toBe(8);
    expect(single?.recentLags).toEqual([]);
  });
});
