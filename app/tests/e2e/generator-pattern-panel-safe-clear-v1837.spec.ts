import path from 'path';
import fs from 'fs';
import os from 'os';
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

const expectedExactGroupOrder = [
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
];

function numbersFromPattern(pattern: number[], buckets: number[][]): number[] {
  return pattern.flatMap((count, index) => buckets[index].slice(0, count)).sort((a, b) => a - b);
}

function csvRow(contest: number, numbers: number[]): string {
  return [contest, ...numbers.map(number => String(number).padStart(2, '0'))].join(',');
}

function createPatternCsv(): string {
  const tmpCsv = path.join(os.tmpdir(), `cmx_v1837_pattern_safe_clear_${Date.now()}.csv`);
  const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
  const rowPatterns = [
    [5, 4, 3, 2, 1],
    [2, 4, 5, 3, 1],
    [4, 5, 3, 2, 1],
    [3, 4, 3, 3, 2],
  ];
  const columnPatterns = [
    [5, 4, 3, 2, 1],
    [2, 4, 5, 3, 1],
    [4, 5, 3, 2, 1],
    [3, 4, 3, 3, 2],
  ];
  let rowPatternIndex = 0;
  let columnPatternIndex = 0;
  const rows = Array.from({ length: 100 }, (_, index) => {
    const contest = 3650 + index;
    const useRowPattern = index % 2 === 0;
    const pattern = useRowPattern
      ? rowPatterns[rowPatternIndex++ % rowPatterns.length]
      : columnPatterns[columnPatternIndex++ % columnPatterns.length];
    const buckets = useRowPattern ? rowBuckets : columnBuckets;
    return csvRow(contest, numbersFromPattern(pattern, buckets));
  });

  fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');
  return tmpCsv;
}

async function saveEvidenceScreenshot(page: Page, filename: string, fullPage = false) {
  const screenshotDir = path.join(process.cwd(), '..', 'evidence', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage });
}

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const mainPath = path.join(process.cwd(), 'dist-electron', 'main', 'index.js');
  const app = await electron.launch({
    args: [mainPath],
    env: {
      ...launchEnv,
      APP_DEV_TOOLS: 'true',
      PW_TEST: 'true',
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    try {
      const api = (window as any).electronAPI;
      if (api?.devResetTrial) await api.devResetTrial();
      if (api?.dbClear) await api.dbClear();
      localStorage.clear();
    } catch {
    }
  });
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });

  return { app, page };
}

async function storedSettings(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}'));
}

async function expectPatternState(
  page: Page,
  listName: 'patternIncludes' | 'patternExclusions',
  type: 'row' | 'column',
  pattern: string
) {
  await page.waitForFunction(
    ({ listName, type, pattern }) => {
      const config = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
      return config[listName]?.some((item: any) => item.type === type && item.pattern?.join(',') === pattern);
    },
    { listName, type, pattern }
  );
}

async function expectPatternNotInverted(
  page: Page,
  listName: 'patternIncludes' | 'patternExclusions',
  wrongType: 'row' | 'column',
  pattern: string
) {
  const config = await storedSettings(page);
  expect(config[listName]?.some((item: any) => item.type === wrongType && item.pattern?.join(',') === pattern)).toBeFalsy();
}

test('v1.8.37: painel de padrões no Gerador e limpeza segura preservam números', async () => {
  const { app, page } = await launchApp();
  try {
    const csv = createPatternCsv();

    await page.locator('button[title="Dados"]').click();
    await page.locator('input[type="file"]').setInputFiles(csv);
    await expect(page.locator('text=importado')).toBeVisible();

    await page.locator('button[title="Gerador"]').click();
    await expect(page.getByText('v1.8.37')).toBeVisible();
    await page.getByTestId('generator-history-mode').selectOption('range');
    await page.getByTestId('generator-contest-start').fill('3650');
    await page.getByTestId('generator-contest-final').fill('3749');
    await page.getByTestId('generator-max-games-input').fill('3268760');
    await page.getByTestId('fixed-numbers-input').fill('11,13,15,22,24');
    await expect(page.getByTestId('generator-k-select')).toHaveValue('15');

    const panel = page.getByTestId('generator-pattern-panel');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Painel ligado');
    await expect(panel).toContainText('Padrões de Linha');
    await expect(panel).toContainText('Padrões de Coluna');
    await expect(page.getByTestId('generator-pattern-use-row-2-4-5-3-1')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-exclude-row-2-4-5-3-1')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-use-column-5-4-3-2-1')).toBeVisible();
    await expect(page.getByTestId('generator-pattern-exclude-column-5-4-3-2-1')).toBeVisible();
    await saveEvidenceScreenshot(page, '151-v1837-painel-padroes-no-gerador.png');
    await saveEvidenceScreenshot(page, '152-v1837-padroes-linha-e-coluna-lado-a-lado.png');

    await page.getByTestId('generator-pattern-search-row').fill('2,4,5,3,1');
    await page.getByTestId('generator-pattern-min-row').fill('2');
    await expect(page.getByTestId('generator-pattern-row-row-2-4-5-3-1')).toBeVisible();
    await saveEvidenceScreenshot(page, '153-v1837-botoes-u-x-linha.png');

    await page.getByTestId('generator-pattern-search-column').fill('5,4,3,2,1');
    await page.getByTestId('generator-pattern-min-column').fill('2');
    await expect(page.getByTestId('generator-pattern-row-column-5-4-3-2-1')).toBeVisible();
    await saveEvidenceScreenshot(page, '154-v1837-botoes-u-x-coluna.png');

    await page.getByTestId('generator-pattern-use-row-2-4-5-3-1').click();
    await expectPatternState(page, 'patternIncludes', 'row', '2,4,5,3,1');
    await expectPatternNotInverted(page, 'patternIncludes', 'column', '2,4,5,3,1');

    await page.getByTestId('generator-pattern-exclude-row-2-4-5-3-1').click();
    await expectPatternState(page, 'patternExclusions', 'row', '2,4,5,3,1');
    await expectPatternNotInverted(page, 'patternExclusions', 'column', '2,4,5,3,1');

    await page.getByTestId('generator-pattern-use-column-5-4-3-2-1').click();
    await expectPatternState(page, 'patternIncludes', 'column', '5,4,3,2,1');
    await expectPatternNotInverted(page, 'patternIncludes', 'row', '5,4,3,2,1');

    await page.getByTestId('generator-pattern-exclude-column-5-4-3-2-1').click();
    await expectPatternState(page, 'patternExclusions', 'column', '5,4,3,2,1');
    await expectPatternNotInverted(page, 'patternExclusions', 'row', '5,4,3,2,1');

    await page.getByRole('button', { name: /Nova Regra/i }).click();
    await page.waitForFunction(() => {
      const config = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
      return config.exclusions?.length === 1;
    });

    await page.getByTestId('generator-safe-clear-config').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('generator-safe-clear-config')).toBeVisible();
    await saveEvidenceScreenshot(page, '155-v1837-botao-limpar-config.png');
    await page.getByTestId('generator-safe-clear-config').click();
    await expect(page.getByTestId('safe-clear-confirm-modal')).toContainText('Limpar configurações atuais sem apagar os números digitados?');
    await expect(page.getByTestId('safe-clear-cancel')).toBeVisible();
    await expect(page.getByTestId('safe-clear-confirm')).toBeVisible();
    await saveEvidenceScreenshot(page, '156-v1837-confirmacao-limpar-config.png');
    await page.getByTestId('safe-clear-confirm').click();
    await expect(page.getByText('Configurações limpas. Os números digitados foram preservados.')).toBeVisible();

    await expect(page.getByTestId('fixed-numbers-input')).toHaveValue('11,13,15,22,24');
    await expect(page.getByTestId('generator-contest-start')).toHaveValue('3650');
    await expect(page.getByTestId('generator-contest-final')).toHaveValue('3749');
    await expect(page.getByTestId('generator-max-games-input')).toHaveValue('3268760');
    await expect(page.getByTestId('generator-k-select')).toHaveValue('15');
    await saveEvidenceScreenshot(page, '157-v1837-numeros-preservados-apos-limpar.png');

    const cleared = await storedSettings(page);
    expect(cleared.exclusions ?? []).toEqual([]);
    expect(cleared.patternIncludes ?? []).toEqual([]);
    expect(cleared.patternExclusions ?? []).toEqual([]);
    expect(expectedExactGroupOrder.every(category => (cleared.exactGroupExclusions?.[category] ?? []).length === 0)).toBe(true);
    await saveEvidenceScreenshot(page, '158-v1837-regras-temporarias-limpas.png');

    const exactGroupOrder = await page.locator('[data-testid^="exact-group-card-"]').evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('data-testid')?.replace('exact-group-card-', ''))
    );
    expect(exactGroupOrder).toEqual(expectedExactGroupOrder);
    await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
    await saveEvidenceScreenshot(page, '159-v1837-ordem-quadros-nao-alterada.png');

    await page.locator('button:has-text("GERAR JOGOS")').click();
    await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();
    await saveEvidenceScreenshot(page, '160-v1837-gerador-funcionando.png', true);
  } finally {
    await app.close();
  }
});
