import path from 'path';
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

const STORAGE_KEY = 'colunamix_generator_settings';
const blockedGame = [1, 2, 3, 6, 7, 9, 13, 14, 15, 18, 19, 20, 23, 24, 25];
const blockedKey = '01,02,03,06,07,09,13,14,15,18,19,20,23,24,25';

function csvRow(contest: number, numbers: number[]): string {
  return [contest, ...numbers.map(number => String(number).padStart(2, '0'))].join(',');
}

async function saveEvidence(page: Page, filename: string, fullPage = false) {
  const screenshotDir = path.join(process.cwd(), '..', 'evidence', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage });
}

async function launchApp(extraEnv: Record<string, string> = {}): Promise<{ app: ElectronApplication; page: Page }> {
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
      ...extraEnv,
    },
  });

  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    localStorage.clear();
    const api = (window as any).electronAPI;
    if (api?.devResetTrial) await api.devResetTrial();
    if (api?.dbClear) await api.dbClear();
  });
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });

  return { app, page };
}

async function seedDraws(page: Page) {
  const csv = [
    'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15',
    csvRow(4100, blockedGame),
    csvRow(4101, blockedGame),
  ].join('\n') + '\n';

  await page.evaluate(async (content) => {
    await (window as any).electronAPI.dbImportCsv(content);
  }, csv);
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });
}

async function combinedKeys(page: Page): Promise<string[]> {
  return page.getByTestId('combined-pattern-item').evaluateAll(items =>
    items.map(item => item.getAttribute('data-combined-key') || '').filter(Boolean)
  );
}

test('v1.8.41: filtro combinado de Linha + Coluna exclui somente a combinação completa', async () => {
  const { app, page } = await launchApp();
  const observed: Record<string, unknown> = {};

  try {
    page.on('dialog', dialog => dialog.accept());
    await seedDraws(page);

    await expect(page.getByText('v1.8.41')).toBeVisible();
    await saveEvidence(page, 'nova-versao-combined-filter.png');

    await page.getByTestId('combined-pattern-exclusion').scrollIntoViewIfNeeded();
    await expect(page.getByText('06. Padrão Linha + Coluna')).toBeVisible();
    await saveEvidence(page, 'combined-filter-visible.png');

    await page.getByTestId('combined-pattern-history-count').fill('2');
    await saveEvidence(page, 'combined-filter-pull-history.png');
    await page.getByTestId('combined-pattern-history-apply').click();
    await expect(page.getByTestId('combined-pattern-item')).toHaveCount(1);

    const pulledKeys = await combinedKeys(page);
    observed.pulledKeys = pulledKeys;
    expect(pulledKeys).toEqual(['3,3,3,3,3|2,2,4,4,3']);
    expect(new Set(pulledKeys).size).toBe(pulledKeys.length);
    await saveEvidence(page, 'combined-filter-groups-loaded.png');

    await page.getByTestId('combined-pattern-remove').click();
    await expect(page.getByTestId('combined-pattern-item')).toHaveCount(0);
    await page.getByTestId('combined-pattern-history-apply').click();
    await expect(page.getByTestId('combined-pattern-item')).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId('combined-pattern-item')).toHaveCount(1);
    observed.persistedKeys = await combinedKeys(page);

    await page.getByTestId('generator-last-n-input').fill('2');
    await page.getByTestId('generator-max-games-input').fill('5');
    await page.getByRole('button', { name: /GERAR JOGOS/i }).click();
    await expect(page.getByText('Nenhum jogo gerado')).toBeVisible();
    const blockedVisibleWithFilter = await page.getByText(blockedKey).count();
    observed.blockedVisibleWithFilter = blockedVisibleWithFilter;
    expect(blockedVisibleWithFilter).toBe(0);
    await saveEvidence(page, 'combined-filter-generation.png', true);

    await page.getByTestId('combined-pattern-exclusion').scrollIntoViewIfNeeded();
    await page.getByTestId('combined-pattern-clear').click();
    await expect(page.getByTestId('combined-pattern-item')).toHaveCount(0);
    await saveEvidence(page, 'combined-filter-clear.png');

    const storedAfterClear = await page.evaluate((storageKey) => {
      const config = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        combinedPatternExclusions: config.combinedPatternExclusions || [],
        lastN: config.lastN,
        maxJogos: config.maxJogos,
      };
    }, STORAGE_KEY);
    observed.storedAfterClear = storedAfterClear;
    expect(storedAfterClear.combinedPatternExclusions).toEqual([]);

    await page.getByRole('button', { name: /GERAR JOGOS/i }).click();
    await expect(page.getByText(blockedKey)).toBeVisible();
    await saveEvidence(page, 'generator-final-validation.png', true);

    observed.finalGeneratedKey = blockedKey;
    observed.version = 'v1.8.41';
    const logDir = path.join(process.cwd(), '..', 'evidence', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(
      path.join(logDir, 'playwright-combined-row-column-v1841.txt'),
      JSON.stringify(observed, null, 2),
      'utf-8'
    );
  } finally {
    await app.close();
  }
});
