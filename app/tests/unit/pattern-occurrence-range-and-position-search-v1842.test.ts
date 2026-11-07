import { test, expect } from '@playwright/test';
import {
  calculatePatternStats,
  clearPatternStatsCache,
  filterPatternStatsRows,
  filterPatternsByOccurrenceRange,
  filterPatternsByPositions,
  hasActivePatternPositions,
  parseOccurrenceLimit,
  parsePatternPositionValue,
} from '../../src/shared/patternStats';
import { applyBulkPatternRuleAction } from '../../src/shared/patternRules';
import { generateGames } from '../../src/shared/generator';
import { getColPatternArray, getRowPatternArray } from '../../src/shared/columns';
import { createDefaultExactGroupExclusions } from '../../src/shared/exactGroupExclusions';
import { GeneratorConfig, PatternStatsRow } from '../../src/shared/types';

// Dados sintéticos: nenhuma leitura/escrita de banco real.
function row(patternKey: string, occurrences: number, lag = 0): PatternStatsRow {
  const pattern = patternKey.split(',').map(Number);
  return {
    pattern,
    patternKey,
    occurrences,
    lastContest: 1000 - lag,
    lag,
    recentLags: [],
    percentage: occurrences,
  };
}

const rows: PatternStatsRow[] = [
  row('3,3,3,3,3', 60, 1),
  row('4,3,3,3,2', 50, 2),
  row('3,2,4,3,3', 45, 3),
  row('3,3,2,3,4', 30, 4),
  row('2,3,4,3,3', 29, 5),
  row('3,4,2,4,2', 12, 6),
  row('5,3,2,2,3', 1, 7),
  row('0,4,3,4,4', 0, 8),
];

const keys = (list: PatternStatsRow[]) => list.map(item => item.patternKey).sort();

test.describe('v1.8.42 · pesquisa por intervalo de ocorrências', () => {
  test('somente mínimo', () => {
    expect(keys(filterPatternStatsRows(rows, { minOccurrences: '30' }))).toEqual(
      ['3,2,4,3,3', '3,3,2,3,4', '3,3,3,3,3', '4,3,3,3,2'].sort()
    );
  });

  test('somente máximo', () => {
    expect(keys(filterPatternStatsRows(rows, { maxOccurrences: '29' }))).toEqual(
      ['0,4,3,4,4', '2,3,4,3,3', '3,4,2,4,2', '5,3,2,2,3'].sort()
    );
  });

  test('intervalo 30 a 50 é inclusivo nas duas pontas', () => {
    const result = filterPatternStatsRows(rows, { minOccurrences: '30', maxOccurrences: '50' });
    expect(keys(result)).toEqual(['3,2,4,3,3', '3,3,2,3,4', '4,3,3,3,2'].sort());
    expect(result.every(item => item.occurrences >= 30 && item.occurrences <= 50)).toBe(true);
  });

  test('campos vazios não aplicam restrição', () => {
    expect(filterPatternStatsRows(rows, { minOccurrences: '', maxOccurrences: '' })).toHaveLength(rows.length);
    expect(filterPatternStatsRows(rows, { minOccurrences: null, maxOccurrences: null })).toHaveLength(rows.length);
    expect(filterPatternStatsRows(rows, { minOccurrences: '  ', maxOccurrences: 'abc' })).toHaveLength(rows.length);
  });

  test('máximo 0 é um limite válido e mínimo maior que máximo não retorna nada', () => {
    expect(keys(filterPatternStatsRows(rows, { maxOccurrences: '0' }))).toEqual(['0,4,3,4,4']);
    expect(filterPatternStatsRows(rows, { minOccurrences: '50', maxOccurrences: '30' })).toEqual([]);
  });

  test('aceita números e strings', () => {
    expect(keys(filterPatternsByOccurrenceRange(rows, 30, 50))).toEqual(
      keys(filterPatternsByOccurrenceRange(rows, '30', '50'))
    );
    expect(parseOccurrenceLimit('')).toBeNull();
    expect(parseOccurrenceLimit('12')).toBe(12);
    expect(parseOccurrenceLimit(0)).toBe(0);
  });
});

test.describe('v1.8.42 · pesquisa individual por posição', () => {
  test('uma posição: posição 3 = 2', () => {
    const result = filterPatternStatsRows(rows, { positions: ['', '', '2', '', ''] });
    expect(keys(result)).toEqual(['3,3,2,3,4', '3,4,2,4,2', '5,3,2,2,3'].sort());
    expect(result.every(item => item.pattern[2] === 2)).toBe(true);
  });

  test('respeita a posição real e não procura o número em qualquer lugar', () => {
    // 4,3,3,3,2 contém o número 2, mas na posição 5 — não pode aparecer.
    const result = filterPatternStatsRows(rows, { positions: ['', '', '2', '', ''] });
    expect(keys(result)).not.toContain('4,3,3,3,2');
    expect(keys(result)).not.toContain('3,2,4,3,3');
  });

  test('posições alternadas: posição 1 = 3 e posição 5 = 2', () => {
    expect(keys(filterPatternStatsRows(rows, { positions: ['3', '', '', '', '2'] }))).toEqual(['3,4,2,4,2']);
  });

  test('posições não contíguas sem ordem obrigatória: posição 2 = 3 e posição 4 = 3', () => {
    expect(keys(filterPatternStatsRows(rows, { positions: ['', '3', '', '3', ''] }))).toEqual(
      ['2,3,4,3,3', '3,3,2,3,4', '3,3,3,3,3', '4,3,3,3,2'].sort()
    );
  });

  test('cinco posições: correspondência exata', () => {
    expect(keys(filterPatternStatsRows(rows, { positions: ['4', '3', '3', '3', '2'] }))).toEqual(['4,3,3,3,2']);
    expect(filterPatternStatsRows(rows, { positions: ['4', '3', '3', '3', '3'] })).toEqual([]);
  });

  test('posições vazias ou inválidas são ignoradas; zero é valor válido', () => {
    expect(filterPatternsByPositions(rows, ['', '', '', '', ''])).toHaveLength(rows.length);
    expect(filterPatternsByPositions(rows, undefined)).toHaveLength(rows.length);
    expect(filterPatternsByPositions(rows, ['x', ' ', null, undefined, ''])).toHaveLength(rows.length);
    expect(keys(filterPatternsByPositions(rows, ['0', '', '', '', '']))).toEqual(['0,4,3,4,4']);
    expect(parsePatternPositionValue('0')).toBe(0);
    expect(parsePatternPositionValue('')).toBeNull();
    expect(hasActivePatternPositions(['', '', '', '', ''])).toBe(false);
    expect(hasActivePatternPositions(['', '', '2', '', ''])).toBe(true);
  });
});

test.describe('v1.8.42 · combinação com filtros existentes', () => {
  test('ocorrências + posições', () => {
    const result = filterPatternStatsRows(rows, {
      minOccurrences: '10',
      maxOccurrences: '40',
      positions: ['', '', '2', '', ''],
    });
    expect(keys(result)).toEqual(['3,3,2,3,4', '3,4,2,4,2'].sort());
  });

  test('busca normal + sequência + posição + intervalo + ordenação', () => {
    const result = filterPatternStatsRows(rows, {
      searchText: '3',
      sequenceSearchText: '3',
      positions: ['', '', '', '3', ''],
      minOccurrences: '30',
      maxOccurrences: '60',
      sort: 'occurrences-asc',
      variationSearch: true,
    });
    expect(result.map(item => item.patternKey)).toEqual(['3,2,4,3,3', '3,3,2,3,4', '3,3,3,3,3'].sort((a, b) => {
      const occ = (key: string) => rows.find(r => r.patternKey === key)!.occurrences;
      return occ(a) - occ(b);
    }));
  });

  test('sem novos filtros o resultado é idêntico ao comportamento anterior', () => {
    const before = filterPatternStatsRows(rows, { minOccurrences: '12', sort: 'numeric-desc', searchText: '3' });
    const after = filterPatternStatsRows(rows, {
      minOccurrences: '12',
      sort: 'numeric-desc',
      searchText: '3',
      maxOccurrences: '',
      positions: ['', '', '', '', ''],
    });
    expect(after).toEqual(before);
  });

  test('ordenações existentes continuam aplicadas após os novos filtros', () => {
    const filtered = filterPatternStatsRows(rows, { minOccurrences: '1', maxOccurrences: '60', sort: 'numeric-asc' });
    expect(filtered.map(item => item.patternKey)).toEqual(
      ['2,3,4,3,3', '3,2,4,3,3', '3,3,2,3,4', '3,3,3,3,3', '3,4,2,4,2', '4,3,3,3,2', '5,3,2,2,3']
    );
  });
});

// Bases sintéticas para Linha e Coluna usando o cálculo real.
const rowBuckets = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25]];
const columnBuckets = [[1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], [5, 10, 15, 20, 25]];
const fromPattern = (pattern: number[], buckets: number[][]) =>
  pattern.flatMap((count, index) => buckets[index].slice(0, count)).sort((a, b) => a - b);

function buildDraws(buckets: number[][]) {
  const plan: Array<[number[], number]> = [
    [[3, 3, 2, 3, 4], 4],
    [[4, 3, 3, 3, 2], 3],
    [[3, 4, 2, 4, 2], 2],
    [[3, 3, 3, 3, 3], 1],
  ];
  const draws: { contest: number; numbers: number[] }[] = [];
  let contest = 5000;
  for (const [pattern, times] of plan) {
    for (let i = 0; i < times; i++) draws.push({ contest: contest++, numbers: fromPattern(pattern, buckets) });
  }
  return draws;
}

for (const kind of ['row', 'column'] as const) {
  test(`funciona em Padrões de ${kind === 'row' ? 'Linha' : 'Coluna'} com estatísticas reais`, () => {
    clearPatternStatsCache();
    const draws = buildDraws(kind === 'row' ? rowBuckets : columnBuckets);
    const stats = calculatePatternStats(draws, kind);
    const total = stats.reduce((sum, item) => sum + item.occurrences, 0);

    const byRange = filterPatternStatsRows(stats, { minOccurrences: '2', maxOccurrences: '3' });
    expect(keys(byRange)).toEqual(['3,4,2,4,2', '4,3,3,3,2'].sort());

    const byPosition = filterPatternStatsRows(stats, { positions: ['', '', '2', '', ''] });
    expect(keys(byPosition)).toEqual(['3,3,2,3,4', '3,4,2,4,2'].sort());

    const combined = filterPatternStatsRows(stats, { positions: ['3', '', '2', '', ''], maxOccurrences: '2' });
    expect(keys(combined)).toEqual(['3,4,2,4,2']);

    // Estatísticas não são alteradas pelos filtros.
    expect(stats.reduce((sum, item) => sum + item.occurrences, 0)).toBe(total);
    expect(total).toBe(draws.length);
  });
}

test('integração com o gerador: Usar Todos sobre linhas filtradas por posição restringe os jogos', () => {
  clearPatternStatsCache();
  const draws = [
    { contest: 1, numbers: [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22] },
    { contest: 2, numbers: [1, 2, 3, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22, 23] },
    { contest: 3, numbers: [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19] },
    { contest: 4, numbers: [2, 3, 5, 7, 9, 10, 11, 13, 14, 15, 18, 20, 22, 24, 25] },
  ];
  const config: GeneratorConfig = {
    mode: 'lastN',
    lastN: draws.length,
    rangeStart: 0,
    rangeEnd: 0,
    dezenasPorJogo: 15,
    maxJogos: 100000,
    fixas: [],
    fixasModo: 'contem',
    exclusions: [],
    patternExclusions: [],
    patternIncludes: [],
    exactGroupExclusions: createDefaultExactGroupExclusions(),
    noRepeatDrawn: false,
  };

  const baseline = generateGames(draws, config);
  expect(baseline.length).toBeGreaterThan(0);

  const allRowPatterns = baseline.map(game => getRowPatternArray(game.numbers));
  const target = allRowPatterns[0];
  const positions = ['', '', String(target[2]), '', ''];
  const rowStats = calculatePatternStats(
    baseline.map((game, index) => ({ contest: index + 1, numbers: game.numbers })),
    'row'
  );
  const filtered = filterPatternStatsRows(rowStats, { positions });
  expect(filtered.length).toBeGreaterThan(0);

  const bulk = applyBulkPatternRuleAction({
    includes: [],
    exclusions: [],
    rules: filtered.map(item => ({ type: 'row' as const, pattern: item.pattern })),
    action: 'include',
  });
  const restricted = generateGames(draws, { ...config, patternIncludes: bulk.includes, rowPatternMode: 'include' });

  expect(restricted.length).toBeGreaterThan(0);
  expect(restricted.length).toBeLessThanOrEqual(baseline.length);
  expect(restricted.every(game => getRowPatternArray(game.numbers)[2] === target[2])).toBe(true);
  expect(restricted.length).toBe(allRowPatterns.filter(pattern => pattern[2] === target[2]).length);

  // Sem regras novas, o gerador continua produzindo exatamente o mesmo resultado.
  expect(generateGames(draws, config).map(game => game.key)).toEqual(baseline.map(game => game.key));
  // Padrão de coluna também segue disponível no gerador.
  expect(baseline.every(game => getColPatternArray(game.numbers).reduce((a, b) => a + b, 0) === 15)).toBe(true);
});
