import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

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
  const rowPatterns = [
    [3, 3, 4, 2, 3],
    [3, 3, 2, 3, 4],
    [3, 3, 3, 2, 4],
    [3, 2, 3, 4, 3],
    [4, 3, 3, 2, 3],
    [5, 4, 3, 2, 1],
  ];
  const columnPatterns = [
    [3, 3, 4, 2, 3],
    [3, 3, 2, 3, 4],
    [3, 2, 3, 4, 3],
    [4, 3, 3, 2, 3],
  ];
  const rows = [
    ...rowPatterns.map((pattern, index) => csvRow(3650 + index, numbersFromPattern(pattern, rowBuckets))),
    ...columnPatterns.map((pattern, index) => csvRow(3700 + index, numbersFromPattern(pattern, columnBuckets))),
    csvRow(3749, [1, 2, 3, 4, 5, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23]),
  ];

  await page.evaluate(async (csv) => {
    await (window as any).electronAPI.dbImportCsv(csv);
  }, header + rows.join('\n') + '\n');
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });
}

async function patternKeys(page: Page, kind: 'row' | 'column'): Promise<string[]> {
  return page.locator(`[data-testid^="generator-pattern-row-${kind}-"] td:first-child`).evaluateAll(cells =>
    cells.map(cell => (cell.textContent || '').trim()).filter(Boolean)
  );
}

async function storedPatternCounts(page: Page) {
  return page.evaluate(() => {
    const config = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
    return {
      rowIncludes: (config.patternIncludes || []).filter((item: any) => item.type === 'row').length,
      rowExclusions: (config.patternExclusions || []).filter((item: any) => item.type === 'row').length,
      columnIncludes: (config.patternIncludes || []).filter((item: any) => item.type === 'column').length,
      columnExclusions: (config.patternExclusions || []).filter((item: any) => item.type === 'column').length,
      rowIncludeKeys: (config.patternIncludes || []).filter((item: any) => item.type === 'row').map((item: any) => item.pattern.join(',')),
      columnExcludeKeys: (config.patternExclusions || []).filter((item: any) => item.type === 'column').map((item: any) => item.pattern.join(',')),
    };
  });
}

test('final-client-scope-v1839: sequência, massa, ordem e limpeza segura', async () => {
  const { app, page } = await launchApp();
  const observed: Record<string, unknown> = {};

  try {
    await seedPatternData(page);
    await expect(page.getByText('v1.8.39')).toBeVisible();
    await saveEvidence(page, '151-v1839-versao-final.png');

    await expect(page.getByTestId('generator-pattern-row-panel')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-column-panel')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-search-row')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-sequence-search-row')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-search-column')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-sequence-search-column')).toBeVisible();
    await saveEvidence(page, '152-v1839-busca-antiga-e-sequencia-linha.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('3');
    let rowKeys = await patternKeys(page, 'row');
    expect(rowKeys.length).toBeGreaterThan(0);
    expect(rowKeys.every(key => key.split(',')[0] === '3')).toBeTruthy();

    await page.getByTestId('generator-pattern-sequence-search-row').fill('3,3');
    rowKeys = await patternKeys(page, 'row');
    observed.busca33 = rowKeys.length;
    expect(rowKeys.every(key => key.startsWith('3,3'))).toBeTruthy();
    await saveEvidence(page, '153-v1839-busca-sequencia-3-3.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('3,3,4');
    rowKeys = await patternKeys(page, 'row');
    observed.busca334 = rowKeys.length;
    expect(rowKeys).toEqual(['3,3,4,2,3']);
    await saveEvidence(page, '154-v1839-busca-sequencia-3-3-4.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('');
    await page.getByTestId('generator-pattern-search-row').fill('4,3,3,2,3');
    rowKeys = await patternKeys(page, 'row');
    expect(rowKeys).toContain('3,3,4,2,3');
    await page.getByTestId('generator-pattern-search-row').fill('');

    await page.getByTestId('generator-pattern-sequence-search-column').fill('3,3');
    const columnKeys = await patternKeys(page, 'column');
    expect(columnKeys.every(key => key.startsWith('3,3'))).toBeTruthy();
    await saveEvidence(page, '155-v1839-busca-sequencia-coluna.png');

    await page.getByTestId('generator-pattern-sequence-search-row').fill('3,3');
    rowKeys = await patternKeys(page, 'row');
    await page.getByTestId('generator-pattern-use-all-row').click();
    await expect(page.getByText('Linha / Usar Todos')).toBeVisible();
    let counts = await storedPatternCounts(page);
    observed.bulkLinhaUsarEncontrados = rowKeys.length;
    observed.bulkLinhaUsarAdicionados = counts.rowIncludes;
    expect(counts.rowIncludes).toBe(rowKeys.length);
    expect(counts.rowExclusions).toBe(0);
    await saveEvidence(page, '156-v1839-usar-todos-linha.png');

    await page.getByTestId('generator-pattern-use-all-row').click();
    counts = await storedPatternCounts(page);
    expect(counts.rowIncludes).toBe(rowKeys.length);
    await saveEvidence(page, '157-v1839-sem-duplicidade.png');

    await page.getByTestId('generator-pattern-exclude-all-row').click();
    counts = await storedPatternCounts(page);
    expect(counts.rowIncludes).toBe(0);
    expect(counts.rowExclusions).toBe(rowKeys.length);
    await saveEvidence(page, '158-v1839-excluir-todos-linha.png');

    await page.getByTestId('generator-pattern-use-all-column').click();
    counts = await storedPatternCounts(page);
    expect(counts.columnIncludes).toBe(columnKeys.length);
    expect(counts.rowExclusions).toBe(rowKeys.length);
    await saveEvidence(page, '159-v1839-usar-todos-coluna.png');

    await page.getByTestId('generator-pattern-exclude-all-column').click();
    counts = await storedPatternCounts(page);
    observed.bulkColunaExcluirEncontrados = columnKeys.length;
    observed.bulkColunaExcluirAdicionados = counts.columnExclusions;
    expect(counts.columnIncludes).toBe(0);
    expect(counts.columnExclusions).toBe(columnKeys.length);
    expect(counts.rowExclusions).toBe(rowKeys.length);
    await saveEvidence(page, '160-v1839-excluir-todos-coluna.png');
    await saveEvidence(page, '161-v1839-bulk-respeita-filtro.png');

    await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
    const titles = await page.locator('[data-testid^="exact-group-card-"] h4').evaluateAll(nodes => nodes.map(node => (node.textContent || '').trim()));
    expect(titles).toEqual([
      'Borda - Grupos Gerais',
      'Miolo - Grupos Gerais',
      'Números Ímpares',
      'Números Pares',
      'Borda - Ímpares',
      'Borda - Pares',
      'Miolo - Ímpares',
      'Miolo - Pares',
      'Números Primos',
      'Números Fibonacci',
    ]);
    await saveEvidence(page, '162-v1839-ordem-10-quadros.png', true);

    await page.getByTestId('generator-history-mode').selectOption('range');
    await page.getByTestId('generator-contest-start').fill('3650');
    await page.getByTestId('generator-contest-final').fill('3749');
    await page.getByTestId('generator-max-games-input').fill('3268760');
    await page.getByTestId('exact-group-input-borderGeneral').fill('01,02,03');
    await page.getByTestId('exact-group-add-borderGeneral').click();
    await page.getByTestId('exact-group-input-middleGeneral').fill('07,08,09');
    await page.getByTestId('exact-group-add-middleGeneral').click();
    const beforeNumbers = await page.locator('[data-testid^="exact-group-item-"]').evaluateAll(nodes => nodes.map(node => (node.textContent || '').replace('×', '').trim()));
    observed.numerosAntes = beforeNumbers;
    await saveEvidence(page, '163-v1839-limpeza-antes.png', true);

    await page.getByTestId('safe-box-config-clear-open').click();
    await expect(page.getByTestId('safe-box-config-clear-modal')).toBeVisible();
    await saveEvidence(page, '164-v1839-modal-limpeza.png');
    await page.getByTestId('safe-box-config-clear-confirm').click();
    await expect(page.getByText('Os números foram mantidos')).toBeVisible();
    const afterNumbers = await page.locator('[data-testid^="exact-group-item-"]').evaluateAll(nodes => nodes.map(node => (node.textContent || '').replace('×', '').trim()));
    observed.numerosDepois = afterNumbers;
    expect(afterNumbers).toEqual(beforeNumbers);
    await expect(page.getByTestId('generator-contest-start')).toHaveValue('3650');
    await expect(page.getByTestId('generator-contest-final')).toHaveValue('3749');
    await expect(page.getByTestId('generator-max-games-input')).toHaveValue('3268760');
    await saveEvidence(page, '165-v1839-limpeza-depois-numeros-preservados.png', true);

    await page.locator('button:has-text("GERAR JOGOS")').click();
    await expect(page.getByText(/jogos? gerados?/i).first()).toBeVisible({ timeout: 60_000 });
    await saveEvidence(page, '166-v1839-gerador-final.png', true);

    const logDir = path.join(process.cwd(), '..', 'evidence', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, 'playwright-final-client-scope-observed-v1839.json'), JSON.stringify(observed, null, 2), 'utf-8');
  } finally {
    await app.close();
  }
});
