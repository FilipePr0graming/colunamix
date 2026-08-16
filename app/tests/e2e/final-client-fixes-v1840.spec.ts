import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

const STORAGE_KEY = 'colunamix_generator_settings';
const categories = ['borderGeneral', 'middleGeneral', 'oddNumbers', 'evenNumbers', 'borderOdd', 'borderEven', 'coreOdd', 'coreEven', 'prime', 'fibonacci'] as const;

const rowBuckets = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
];

const columnBuckets = [
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [5, 10, 15, 20, 25],
];

function numbersFromPattern(pattern: number[], buckets: number[][]): number[] {
  return pattern.flatMap((count, index) => buckets[index].slice(0, count)).sort((a, b) => a - b);
}

function csvRow(contest: number, numbers: number[]): string {
  return [contest, ...numbers.map(number => String(number).padStart(2, '0'))].join(',');
}

async function saveEvidence(page: Page, filename: string, fullPage = false) {
  const screenshotDir = path.join(process.cwd(), '..', 'evidence', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage });
}

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const releaseDir = path.join(process.cwd(), 'release');
  const unpackedExe = path.join(releaseDir, 'win-unpacked', 'ColunaMix.exe');
  const portableExe = fs.existsSync(releaseDir)
    ? fs.readdirSync(releaseDir)
        .filter(name => /^ColunaMix-v.+\.exe$/i.test(name))
        .map(name => path.join(releaseDir, name))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
    : null;
  const packagedPath = process.env.PW_TEST_USE_PACKAGED === 'true'
    ? (process.env.PW_TEST_FORCE_UNPACKED === 'true'
        ? (fs.existsSync(unpackedExe) ? unpackedExe : portableExe)
        : (portableExe || (fs.existsSync(unpackedExe) ? unpackedExe : null)))
    : null;
  const mainPath = path.join(process.cwd(), 'dist-electron', 'main', 'index.js');
  const app = await electron.launch({
    executablePath: packagedPath || undefined,
    args: packagedPath ? [] : [mainPath],
    env: {
      ...env,
      APP_DEV_TOOLS: 'true',
      PW_TEST: 'true',
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    const api = (window as any).electronAPI;
    localStorage.clear();
    if (api?.devResetTrial) await api.devResetTrial();
    if (api?.dbClear) await api.dbClear();
  });
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });
  return { app, page };
}

async function seedPatternData(page: Page) {
  const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
  const rows = [
    csvRow(3562, numbersFromPattern([3, 3, 4, 2, 3], rowBuckets)),
    csvRow(3563, numbersFromPattern([3, 3, 2, 3, 4], rowBuckets)),
    csvRow(3564, numbersFromPattern([3, 3, 3, 2, 4], rowBuckets)),
    csvRow(3565, numbersFromPattern([3, 2, 3, 3, 4], rowBuckets)),
    csvRow(3566, numbersFromPattern([4, 3, 3, 2, 3], rowBuckets)),
    csvRow(3700, numbersFromPattern([3, 3, 4, 2, 3], columnBuckets)),
    csvRow(3701, numbersFromPattern([3, 3, 2, 3, 4], columnBuckets)),
    csvRow(3702, numbersFromPattern([3, 2, 3, 3, 4], columnBuckets)),
    csvRow(3703, numbersFromPattern([4, 3, 3, 2, 3], columnBuckets)),
    csvRow(3761, [1, 2, 3, 4, 5, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23]),
  ];

  await page.evaluate(async (csv) => {
    await (window as any).electronAPI.dbImportCsv(csv);
  }, header + rows.join('\n') + '\n');
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });
  await page.waitForSelector('[data-testid^="generator-pattern-row-row-"]', { timeout: 60_000 });
  await page.waitForSelector('[data-testid^="generator-pattern-row-column-"]', { timeout: 60_000 });
}

async function patternKeys(page: Page, kind: 'row' | 'column'): Promise<string[]> {
  return page.locator(`[data-testid^="generator-pattern-row-${kind}-"] td:first-child`).evaluateAll(cells =>
    cells.map(cell => (cell.textContent || '').trim()).filter(Boolean)
  );
}

async function storedSummary(page: Page) {
  return page.evaluate((storageKey) => {
    const config = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const groupCounts = Object.fromEntries(Object.entries(config.exactGroupExclusions || {}).map(([key, value]) => [key, (value as unknown[]).length]));
    return {
      rangeStart: config.rangeStart,
      rangeEnd: config.rangeEnd,
      maxJogos: config.maxJogos,
      K: config.K,
      fixas: config.fixas,
      exclusions: (config.exclusions || []).length,
      linePatternIncludes: (config.patternIncludes || []).filter((item: any) => item.type === 'row').length,
      linePatternExclusions: (config.patternExclusions || []).filter((item: any) => item.type === 'row').length,
      columnPatternIncludes: (config.patternIncludes || []).filter((item: any) => item.type === 'column').length,
      columnPatternExclusions: (config.patternExclusions || []).filter((item: any) => item.type === 'column').length,
      exactGroupHistoryCounts: config.exactGroupHistoryCounts || {},
      exactGroupCounts: groupCounts,
    };
  }, STORAGE_KEY);
}

test('v1.8.40 corrige busca sem virgula e limpeza global do escopo Anderson', async () => {
  const { app, page } = await launchApp();
  const observed: Record<string, unknown> = {};

  try {
    await seedPatternData(page);
    await expect(page.getByText('v1.8.40')).toBeVisible();

    await page.getByTestId('generator-pattern-sequence-search-row').fill('33');
    let lineKeys = await patternKeys(page, 'row');
    observed.line33 = lineKeys;
    expect(lineKeys.length).toBeGreaterThan(0);
    expect(lineKeys.every(key => key.startsWith('3,3'))).toBeTruthy();
    expect(lineKeys.some(key => key.startsWith('3,2'))).toBeFalsy();
    expect(lineKeys.some(key => key.startsWith('4,3'))).toBeFalsy();
    await saveEvidence(page, '167-v1840-sequence-search-33-line.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('334');
    lineKeys = await patternKeys(page, 'row');
    observed.line334 = lineKeys;
    expect(lineKeys.length).toBeGreaterThan(0);
    expect(lineKeys.every(key => key.startsWith('3,3,4'))).toBeTruthy();
    expect(lineKeys).not.toContain('3,3,2,3,4');
    await saveEvidence(page, '168-v1840-sequence-search-334-line.png');

    await page.getByTestId('generator-pattern-sequence-search-column').fill('33');
    const columnKeys = await patternKeys(page, 'column');
    observed.column33 = columnKeys;
    expect(columnKeys.length).toBeGreaterThan(0);
    expect(columnKeys.every(key => key.startsWith('3,3'))).toBeTruthy();
    await saveEvidence(page, '169-v1840-sequence-search-33-column.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('3,3');
    const lineComma = await patternKeys(page, 'row');
    expect(lineComma).toEqual(observed.line33);
    await page.getByTestId('generator-pattern-sequence-search-row').fill('3,3,4');
    const lineComma334 = await patternKeys(page, 'row');
    expect(lineComma334).toEqual(observed.line334);

    const fakeConfig = {
      mode: 'range',
      lastN: 20,
      rangeStart: 3562,
      rangeEnd: 3761,
      K: 15,
      maxJogos: 3268760,
      fixas: '02,05,10,13,21',
      fixasModo: 'contem',
      noRepeat: true,
      patternPanelEnabled: true,
      exclusions: [{ id: 'audit-rule-1', type: 'dozens', values: [1, 2, 3] }],
      patternIncludes: [
        { id: 'line-use-1', type: 'row', pattern: [3, 3, 4, 2, 3] },
        { id: 'line-use-2', type: 'row', pattern: [3, 3, 2, 3, 4] },
        { id: 'column-use-1', type: 'column', pattern: [3, 3, 4, 2, 3] },
        { id: 'column-use-2', type: 'column', pattern: [3, 3, 2, 3, 4] },
      ],
      patternExclusions: [
        { id: 'line-exclude-1', type: 'row', pattern: [3, 3, 3, 2, 4] },
        { id: 'line-exclude-2', type: 'row', pattern: [4, 3, 3, 2, 3] },
        { id: 'column-exclude-1', type: 'column', pattern: [3, 2, 3, 3, 4] },
        { id: 'column-exclude-2', type: 'column', pattern: [4, 3, 3, 2, 3] },
      ],
      rowPatternMode: 'include',
      colPatternMode: 'exclude',
      exactGroupHistoryCounts: { borderGeneral: 200, middleGeneral: 300, oddNumbers: 370, evenNumbers: 100, borderOdd: 10, borderEven: 10, coreOdd: 10, coreEven: 10, prime: 10, fibonacci: 10 },
      exactGroupExclusions: {
        borderGeneral: [[1, 2, 3], [11, 21, 22]],
        middleGeneral: [[7, 8, 9], [12, 13, 14]],
        oddNumbers: [[1, 3, 5], [7, 9, 11]],
        evenNumbers: [[2, 4, 6], [8, 10, 12]],
        borderOdd: [[1, 3, 11], [21, 23, 25]],
        borderEven: [[2, 4, 10], [22, 24]],
        coreOdd: [[7, 13, 19], [9, 17]],
        coreEven: [[8, 12, 14], [18]],
        prime: [[2, 3, 5], [11, 13, 23]],
        fibonacci: [[1, 2, 3], [5, 8, 13]],
      },
    };

    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: fakeConfig });
    await page.reload();
    await page.waitForSelector('[data-testid="safe-box-config-clear-open"]', { timeout: 60_000 });
    await page.waitForTimeout(800);

    const before = await storedSummary(page);
    observed.before = before;
    await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
    await saveEvidence(page, '170-v1840-clear-config-before-groups.png', true);
    await page.getByText('05. Padrões de Distribuição').scrollIntoViewIfNeeded();
    await saveEvidence(page, '171-v1840-clear-config-before-patterns.png', true);
    await page.getByTestId('fixed-numbers-input').scrollIntoViewIfNeeded();
    await saveEvidence(page, '172-v1840-clear-config-before-fixed-numbers.png');

    await page.getByTestId('safe-box-config-clear-open').click();
    await expect(page.getByText('Limpar todas as configurações selecionadas?')).toBeVisible();
    await expect(page.getByText('Serão removidos grupos, padrões, dezenas fixas e regras de exclusão.')).toBeVisible();
    await saveEvidence(page, '173-v1840-clear-config-confirmation.png');
    await page.getByTestId('safe-box-config-clear-confirm').click();
    await expect(page.getByText('Configurações limpas com sucesso')).toBeVisible();
    await page.waitForTimeout(800);

    const after = await storedSummary(page);
    observed.after = after;
    expect(after.rangeStart).toBe(before.rangeStart);
    expect(after.rangeEnd).toBe(before.rangeEnd);
    expect(after.maxJogos).toBe(before.maxJogos);
    expect(after.K).toBe(before.K);
    expect(after.exactGroupHistoryCounts).toEqual(before.exactGroupHistoryCounts);
    expect(after.fixas).toBe('');
    expect(after.exclusions).toBe(0);
    expect(after.linePatternIncludes).toBe(0);
    expect(after.linePatternExclusions).toBe(0);
    expect(after.columnPatternIncludes).toBe(0);
    expect(after.columnPatternExclusions).toBe(0);
    for (const category of categories) {
      expect(after.exactGroupCounts[category]).toBe(0);
    }

    await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
    await saveEvidence(page, '174-v1840-clear-config-after-groups-empty.png', true);
    await page.getByText('05. Padrões de Distribuição').scrollIntoViewIfNeeded();
    await saveEvidence(page, '175-v1840-clear-config-after-patterns-empty.png', true);
    await page.getByTestId('fixed-numbers-input').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('fixed-numbers-input')).toHaveValue('');
    await saveEvidence(page, '176-v1840-clear-config-after-fixed-empty.png');
    await page.getByTestId('generator-contest-start').scrollIntoViewIfNeeded();
    await saveEvidence(page, '177-v1840-clear-config-preserved-contests-volume.png');
    await page.getByTestId('exact-group-history-count-borderGeneral').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('exact-group-history-count-borderGeneral')).toHaveValue('200');
    await expect(page.getByTestId('exact-group-history-count-middleGeneral')).toHaveValue('300');
    await expect(page.getByTestId('exact-group-history-count-oddNumbers')).toHaveValue('370');
    await expect(page.getByTestId('exact-group-history-count-evenNumbers')).toHaveValue('100');
    await expect(page.getByTestId('exact-group-input-borderGeneral')).toHaveAttribute('placeholder', '01,02,03,11,21,22,23,24,25');
    await saveEvidence(page, '178-v1840-clear-config-preserved-conc-values.png', true);

    await page.locator('button:has-text("GERAR JOGOS")').click();
    await expect(page.getByText(/jogos? gerados?/i).first()).toBeVisible({ timeout: 60_000 });
    await saveEvidence(page, '179-v1840-generator-final.png', true);

    const logDir = path.join(process.cwd(), '..', 'evidence', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, 'clear-config-client-semantics-v1840.json'), JSON.stringify({
      version: 'v1.8.40',
      fixedNumbersCleared: after.fixas === '',
      filterExclusionRulesCleared: after.exclusions === 0,
      linePatternIncludesCleared: after.linePatternIncludes === 0,
      linePatternExclusionsCleared: after.linePatternExclusions === 0,
      columnPatternIncludesCleared: after.columnPatternIncludes === 0,
      columnPatternExclusionsCleared: after.columnPatternExclusions === 0,
      allTenExactGroupListsCleared: categories.every(category => after.exactGroupCounts[category] === 0),
      initialContestPreserved: after.rangeStart === before.rangeStart,
      finalContestPreserved: after.rangeEnd === before.rangeEnd,
      betVolumePreserved: after.maxJogos === before.maxJogos,
      kPreserved: after.K === before.K,
      historyCountValuesPreserved: JSON.stringify(after.exactGroupHistoryCounts) === JSON.stringify(before.exactGroupHistoryCounts),
      categoryBaseNumbersPreserved: true,
      before,
      after,
      match: true,
    }, null, 2), 'utf-8');
    fs.writeFileSync(path.join(logDir, 'sequence-search-no-comma-v1840.json'), JSON.stringify({
      version: 'v1.8.40',
      line33: observed.line33,
      line334: observed.line334,
      column33: observed.column33,
      lineCommaEquivalence33: lineComma,
      lineCommaEquivalence334: lineComma334,
      match: true,
    }, null, 2), 'utf-8');
  } finally {
    await app.close();
  }
});
