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

function numbersFromPattern(pattern: number[], buckets: number[][]): number[] {
  return pattern.flatMap((count, index) => buckets[index].slice(0, count)).sort((a, b) => a - b);
}

function csvRow(contest: number, numbers: number[]): string {
  return [contest, ...numbers.map(number => String(number).padStart(2, '0'))].join(',');
}

async function saveEvidenceScreenshot(page: Page, filename: string) {
  const screenshotDir = path.join(process.cwd(), '..', 'evidence', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
}

async function saveEvidenceViewportScreenshot(page: Page, filename: string) {
  const screenshotDir = path.join(process.cwd(), '..', 'evidence', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: false });
}

async function scrollPatternPanelToTop(page: Page) {
  await page.evaluate(() => {
    document.querySelector('[data-testid="generator-pattern-panel"]')?.scrollIntoView({
      block: 'start',
      inline: 'nearest',
    });
  });
  await page.waitForTimeout(150);
}

async function launchApp(extraEnv: Record<string, string> = {}): Promise<{ app: ElectronApplication; page: Page }> {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const releaseDir = path.join(process.cwd(), 'release');
  const unpackedExe = path.join(releaseDir, 'win-unpacked', 'ColunaMix.exe');
  const portableExe = fs.existsSync(releaseDir)
    ? fs.readdirSync(releaseDir)
        .filter((name) => /^ColunaMix-v.+\.exe$/i.test(name))
        .map((name) => path.join(releaseDir, name))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
    : null;
  const releaseExe = fs.existsSync(unpackedExe) ? unpackedExe : portableExe;
  const packagedPath = process.env.PW_TEST_USE_PACKAGED === 'true' && releaseExe
    ? releaseExe
    : null;
  const mainPath = path.join(process.cwd(), 'dist-electron', 'main', 'index.js');
  const app = await electron.launch({
    executablePath: packagedPath || undefined,
    args: packagedPath ? [] : [mainPath],
    env: {
      ...launchEnv,
      APP_DEV_TOOLS: 'true',
      PW_TEST: 'true',
      ...extraEnv,
    },
  });

  const page = await app.firstWindow();

  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e)}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });

  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(async () => {
    try {
      const api = (window as any).electronAPI;
      if (api?.devResetTrial) await api.devResetTrial();
      if (api?.dbClear) await api.dbClear();
      try { localStorage.clear(); } catch {
      }
    } catch {
    }
  });

  await page.reload();
  await page.waitForTimeout(500);

  try {
    await page.waitForSelector('button[title="Gerador"]', { timeout: 60_000 });
  } catch {
    const url = page.url();
    const title = await page.title().catch(() => '');
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '').catch(() => '');
    const errDump = errors.length ? errors.join('\n') : '(no console/page errors captured)';
    throw new Error(`App UI did not become ready. url=${url} title=${title}\nbodyText=${bodyText}\n${errDump}`);
  }

  return { app, page };
}

test.describe('ColunaMix Desktop - E2E', () => {
  test('ABERTURA DO APP: carrega UI e navegação principal funciona', async () => {
    const { app, page } = await launchApp();
    try {
      await expect(page.locator('text=Carregando...')).toHaveCount(0);
      await expect(page.locator('button[title="Gerador"]')).toBeVisible();

      await page.locator('button[title="Dados"]').click();
      await expect(page.locator('text=Importar Concursos')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();

      await page.locator('button[title="Dashboard"]').click();
      await expect(page.locator('text=Status do Sistema')).toBeVisible();

      await page.locator('button[title="Padrões de Coluna"]').click();
      await expect(page.getByText('Importe concursos para visualizar os padrões.', { exact: true })).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('SELETOR DE DEZENAS: marca com mouse e libera digitação sem travar', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Gerador"]').click();

      await page.getByTestId('fixed-numbers-picker').click();
      await page.getByTestId('grid-picker-number-1').click();
      await page.getByTestId('grid-picker-number-2').click();
      await page.getByTestId('grid-picker-number-3').click();
      await page.getByTestId('grid-picker-number-4').click();
      await page.getByTestId('grid-picker-number-5').click();

      await expect(page.getByText('5 dezenas selecionadas')).toBeVisible();
      await expect(page.getByTestId('fixed-numbers-input')).toHaveValue('');

      await page.getByTestId('grid-picker-confirm').click();
      await expect(page.getByTestId('fixed-numbers-input')).toHaveValue('01,02,03,04,05');

      const start = Date.now();
      await page.getByTestId('fixed-numbers-input').fill('09,10,11');
      await expect(page.getByTestId('fixed-numbers-input')).toHaveValue('09,10,11');
      expect(Date.now() - start).toBeLessThan(1500);
    } finally {
      await app.close();
    }
  });

  test('PAINEL DE PADRÕES NO GERADOR: tabelas lado a lado, filtros, toggle e geração com regras', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_generator_pattern_panel_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rowPatterns = [
        [5, 4, 3, 2, 1],
        [2, 4, 5, 3, 1],
        [4, 5, 3, 2, 1],
        [3, 4, 3, 3, 2],
        [3, 3, 4, 2, 3],
        [4, 4, 3, 2, 2],
      ];
      const columnPatterns = [
        [5, 4, 3, 2, 1],
        [2, 4, 5, 3, 1],
        [4, 5, 3, 2, 1],
      ];
      const rows = [
        ...rowPatterns.map((pattern, index) => csvRow(2101 + index, numbersFromPattern(pattern, rowBuckets))),
        ...columnPatterns.map((pattern, index) => csvRow(2201 + index, numbersFromPattern(pattern, columnBuckets))),
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-last-n-input').fill('9');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.locator('text=jogos gerados').first()).toBeVisible();

      const panel = page.getByTestId('generator-pattern-panel');
      await expect(panel).toBeVisible();
      await expect(panel).toContainText('Painel de Padrões');
      await expect(panel).toContainText('1 clique para usar ou excluir');
      await expect(panel).toContainText('Padrões de Linha');
      await expect(panel).toContainText('Padrões de Coluna');
      await expect(page.getByTestId('locked-radar-card')).toHaveCount(0);
      await expect(page.locator('[data-testid^="generator-pattern-card-"]')).toHaveCount(0);
      await expect(page.getByTestId('generator-pattern-row-panel')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-column-panel')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-table-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-table-column')).toBeVisible();
      await expect(panel.getByText('Página')).toHaveCount(0);
      await expect(panel.getByText('Próxima')).toHaveCount(0);

      await expect(page.getByTestId('generator-pattern-until-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-min-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-search-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-until-column')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-min-column')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-search-column')).toBeVisible();

      await expect(page.getByTestId('generator-pattern-sort-row-numeric-desc')).toHaveText('<');
      await expect(page.getByTestId('generator-pattern-sort-row-numeric-asc')).toHaveText('>');
      await expect(page.getByTestId('generator-pattern-sort-row-occurrences-desc')).toHaveText('+');
      await expect(page.getByTestId('generator-pattern-sort-row-occurrences-asc')).toHaveText('-');
      await expect(page.getByTestId('generator-pattern-toggle')).toBeVisible();

      await expect(page.getByTestId('generator-pattern-row-row-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-column-5-4-3-2-1')).toBeVisible();
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '20-gerador-painel-padroes-corrigido-v1823.png');
      await saveEvidenceViewportScreenshot(page, '21-padroes-linha-coluna-lado-a-lado-v1823.png');

      await page.getByTestId('generator-pattern-min-row').fill('2');
      await expect(page.getByTestId('generator-pattern-row-row-3-4-3-3-2')).toHaveCount(0);
      await page.getByTestId('generator-pattern-min-row').fill('');

      await page.getByTestId('generator-pattern-until-row').fill('2103');
      await expect(page.getByTestId('generator-pattern-row-row-3-4-3-3-2')).toHaveCount(0);
      await page.getByTestId('generator-pattern-until-row').fill('');

      await page.getByTestId('generator-pattern-search-row').fill('1,2,3,4,5');
      await expect(page.getByTestId('generator-pattern-row-row-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-row-2-4-5-3-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-row-4-5-3-2-1')).toBeVisible();
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '22-busca-variacoes-linha-v1823.png');

      await page.getByTestId('generator-pattern-search-column').fill('1,2,3,4,5');
      await expect(page.getByTestId('generator-pattern-row-column-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-column-2-4-5-3-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-column-4-5-3-2-1')).toBeVisible();
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '23-busca-variacoes-coluna-v1823.png');

      await page.getByTestId('generator-pattern-use-row-5-4-3-2-1').click();
      await expect(page.locator('text=Padrão aplicado')).toBeVisible();
      await expect(page.locator('text=Usar Somente').first()).toBeVisible();
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '24-botao-azul-usar-padrao-v1823.png');

      await page.getByTestId('generator-pattern-exclude-row-2-4-5-3-1').click();
      await expect(page.locator('text=Padrão aplicado')).toBeVisible();
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '25-botao-vermelho-excluir-padrao-v1823.png');

      const saved = await page.waitForFunction(() => {
        const config = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        const hasRowInclude = config.patternIncludes?.some((item: any) => item.type === 'row' && item.pattern?.join(',') === '5,4,3,2,1');
        const hasRowExclude = config.patternExclusions?.some((item: any) => item.type === 'row' && item.pattern?.join(',') === '2,4,5,3,1');
        return hasRowInclude && hasRowExclude && config.rowPatternMode === 'include';
      });
      expect(saved).toBeTruthy();

      await page.getByTestId('generator-pattern-exclude-row-5-4-3-2-1').click();
      await page.waitForFunction(() => {
        const config = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        const includeRemoved = !config.patternIncludes?.some((item: any) => item.type === 'row' && item.pattern?.join(',') === '5,4,3,2,1');
        const movedToExclude = config.patternExclusions?.some((item: any) => item.type === 'row' && item.pattern?.join(',') === '5,4,3,2,1');
        return includeRemoved && movedToExclude && config.rowPatternMode === 'exclude';
      });

      await page.getByTestId('generator-pattern-toggle').click();
      await expect(page.getByTestId('generator-pattern-panel-disabled')).toContainText('Painel de padrões desligado para preservar performance.');
      await scrollPatternPanelToTop(page);
      await saveEvidenceViewportScreenshot(page, '26-toggle-painel-padroes-desligado-v1823.png');
      await page.getByTestId('generator-pattern-toggle').click();
      await expect(page.getByTestId('generator-pattern-table-row')).toBeVisible();

      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.locator('text=jogos gerados').first()).toBeVisible();
      await saveEvidenceScreenshot(page, '27-gerador-jogos-com-padroes-v1823.png');
    } finally {
      await app.close();
    }
  });

  test('BUSCA POR VARIAÇÕES: preserva abas separadas de estatísticas de linha e coluna', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_variation_search_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rowPatterns = [
        [5, 4, 3, 2, 1],
        [2, 4, 5, 3, 1],
        [4, 5, 3, 2, 1],
        [3, 4, 3, 3, 2],
        [3, 3, 4, 2, 3],
        [4, 4, 3, 2, 2],
      ];
      const columnPatterns = [
        [5, 4, 3, 2, 1],
        [2, 4, 5, 3, 1],
        [4, 5, 3, 2, 1],
      ];
      const rows = [
        ...rowPatterns.map((pattern, index) => csvRow(2101 + index, numbersFromPattern(pattern, rowBuckets))),
        ...columnPatterns.map((pattern, index) => csvRow(2201 + index, numbersFromPattern(pattern, columnBuckets))),
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Padrões de Linha"]').click();
      await expect(page.getByRole('heading', { name: 'Padrões de Linha' })).toBeVisible();
      await page.getByTestId('pattern-stats-search').fill('1,2,3,4,5');
      await expect(page.locator('tr', { hasText: '5,4,3,2,1' })).toBeVisible();
      await expect(page.locator('tr', { hasText: '2,4,5,3,1' })).toBeVisible();
      await expect(page.locator('tr', { hasText: '4,5,3,2,1' })).toBeVisible();
      await saveEvidenceScreenshot(page, '15-busca-variacoes-linha.png');

      await page.locator('button[title="Padrões de Coluna"]').click();
      await expect(page.getByRole('heading', { name: 'Padrões de Coluna' })).toBeVisible();
      await page.getByTestId('pattern-stats-search').fill('1,2,3,4,5');
      await expect(page.locator('tr', { hasText: '5,4,3,2,1' })).toBeVisible();
      await expect(page.locator('tr', { hasText: '2,4,5,3,1' })).toBeVisible();
      await expect(page.locator('tr', { hasText: '4,5,3,2,1' })).toBeVisible();
      await saveEvidenceScreenshot(page, '16-busca-variacoes-coluna.png');
    } finally {
      await app.close();
    }
  });

  test('MOTOR AVANÇADO DE GRUPOS: mostra extensão bloqueada abaixo dos grupos sem links externos', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Gerador"]').click();

      const exactGroupSection = page.getByTestId('exact-group-exclusions');
      const card = page.getByTestId('locked-group-engine-card');
      await expect(exactGroupSection).toBeVisible();
      await expect(card).toBeVisible();
      await expect(card).toContainText('Motor Avançado de Processamento de Grupos');
      await expect(card).toContainText('Extensão avançada');
      await expect(card).toContainText('Otimize o processamento dos grupos de exclusão');

      const cardIsAfterGroupSection = await page.evaluate(() => {
        const groupSection = document.querySelector('[data-testid="exact-group-exclusions"]');
        const engineCard = document.querySelector('[data-testid="locked-group-engine-card"]');
        if (!groupSection || !engineCard) return false;
        return Boolean(groupSection.compareDocumentPosition(engineCard) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(cardIsAfterGroupSection).toBeTruthy();

      const beforeUrl = page.url();
      await page.getByTestId('locked-group-engine-details').click();

      const modal = page.getByTestId('locked-group-engine-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('heading', { name: 'Motor Avançado de Processamento de Grupos' })).toBeVisible();
      await expect(modal).toContainText('Esta extensão melhora o desempenho e a análise dos grupos cadastrados');
      await expect(modal).toContainText('Processamento otimizado para muitos grupos de exclusão');
      await expect(modal).toContainText('Prévia de impacto antes da geração');
      await expect(modal).toContainText('Alerta de configuração pesada');
      await expect(modal).toContainText('Análise de conflito entre grupos cadastrados');
      await expect(modal).toContainText('Mais segurança antes de gerar jogos com muitos filtros');
      await expect(modal).toContainText('Extensão avançada disponível para ativação futura.');

      const externalTargets = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="locked-group-engine-modal"]');
        const scopedLinks = Array.from(root?.querySelectorAll('a[href]') || []).map((link) => (link as HTMLAnchorElement).href);
        return {
          links: scopedLinks,
          hasWhatsAppText: /whatsapp/i.test(root?.textContent || ''),
          hasPhoneHref: scopedLinks.some((href) => href.startsWith('tel:')),
        };
      });
      expect(externalTargets.links).toHaveLength(0);
      expect(externalTargets.hasWhatsAppText).toBeFalsy();
      expect(externalTargets.hasPhoneHref).toBeFalsy();

      await page.getByTestId('locked-group-engine-contact').click();
      await expect(page.getByTestId('locked-group-engine-contact-message')).toHaveText(
        'Para ativar esta extensão, entre em contato com o desenvolvedor responsável pelo sistema.'
      );
      expect(page.url()).toBe(beforeUrl);

      await modal.getByRole('button', { name: 'Fechar', exact: true }).click();
      await expect(modal).toHaveCount(0);
    } finally {
      await app.close();
    }
  });

  test('GERADOR + DADOS: importa CSV real e executa geração normal com UI responsiva', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Dados"]').click();
      await expect(page.locator('text=Importar Concursos')).toBeVisible();

      const input = page.locator('input[type="file"]');
      await input.setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await expect(page.locator('text=Importe concursos para começar')).toHaveCount(0);

      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.locator('text=Erro na geração')).toHaveCount(0);
      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('GERADOR: capacidade da prévia bate com total gerado', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();

      const result = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const config = {
          mode: 'lastN',
          lastN: 20,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 200000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: {
            coreOdd: [],
            coreEven: [],
            borderOdd: [],
            borderEven: [],
          },
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
        const preview = await api.generatorPreview(config);
        const generated = await api.generatorGenerateWithCount(config);
        return {
          previewTotal: preview.totalCombinations,
          previewPartial: preview.isPartial,
          generatedTotal: generated.totalCount,
          loadedCount: generated.games.length,
          displayLimit: generated.displayLimit,
        };
      });

      expect(result.previewPartial).toBeFalsy();
      expect(result.generatedTotal).toBe(result.previewTotal);
      expect(result.loadedCount).toBe(Math.min(result.generatedTotal, result.displayLimit));
    } finally {
      await app.close();
    }
  });

  test('PADRÕES: linha e coluna recalculam até concurso X, ordenam e exportam CSV/TXT/Excel', async () => {
    const savePath = path.join(os.tmpdir(), `cmx_patterns_${Date.now()}.csv`);
    const { app, page } = await launchApp({ PW_TEST_SAVE_PATH: savePath });
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_patterns_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rows = [
        '1001,01,02,03,04,06,07,08,11,12,13,16,17,18,21,22',
        '1002,01,02,03,06,07,08,11,12,13,16,17,18,21,22,23',
        '1003,01,02,04,05,06,07,09,10,11,12,14,15,16,17,19',
        '1004,01,02,03,04,06,07,08,11,12,13,16,17,18,21,22',
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Padrões de Linha"]').click();
      await expect(page.getByRole('heading', { name: 'Padrões de Linha' })).toBeVisible();
      await expect(page.locator('td', { hasText: '4,3,3,3,2' }).first()).toBeVisible();
      await expect(page.locator('tr', { hasText: '4,3,3,3,2' })).toContainText('2');

      await page.locator('input[placeholder="1004"]').fill('1002');
      await expect(page.locator('tr', { hasText: '4,3,3,3,2' })).toContainText('Concurso 1001');
      await expect(page.locator('tr', { hasText: '4,3,3,3,2' })).toContainText('1');

      await page.locator('button:has-text("Ordem Numérica Crescente")').click();
      await expect(page.locator('tbody tr').first()).toContainText('3,3,3,3,3');
      await page.locator('button:has-text("Decrescente")').click();
      await expect(page.locator('tbody tr').first()).toContainText('4,3,3,3,2');

      await page.locator('input[placeholder="1004"]').fill('');
      await page.locator('button[title="Mais frequentes primeiro"]').click();
      await expect(page.locator('tbody tr').first()).toContainText('4,3,3,3,2');
      await page.locator('button[title="Menos frequentes primeiro"]').click();
      await expect(page.locator('tbody tr').first()).toContainText('3,3,3,3,3');

      const exportChecks = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const lineRows = await api.patternStatsGet('row', null);
        const columnRows = await api.patternStatsGet('column', null);
        const csv = await api.patternStatsExport('row', 'csv', lineRows);
        const txt = await api.patternStatsExport('row', 'txt', lineRows);
        const excel = await api.patternStatsExport('column', 'excel', columnRows);
        return {
          lineHasExpected: lineRows.some((row: { patternKey: string; occurrences: number }) => row.patternKey === '4,3,3,3,2' && row.occurrences === 2),
          columnHasExpected: columnRows.some((row: { patternKey: string; occurrences: number }) => row.patternKey === '5,5,4,1,0' && row.occurrences === 2),
          csvSuccess: csv.success,
          txtSuccess: txt.success,
          excelSuccess: excel.success,
        };
      });

      expect(exportChecks).toEqual({
        lineHasExpected: true,
        columnHasExpected: true,
        csvSuccess: true,
        txtSuccess: true,
        excelSuccess: true,
      });
      expect(fs.existsSync(savePath)).toBeTruthy();
    } finally {
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
      await app.close();
    }
  });

  test('INCLUDE ONLY + HISTÓRICO + LIMPAR: aplica recorte histórico com variações, alterna modo include e limpa resultados', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Dados"]').click();
      const input = page.locator('input[type="file"]');
      await input.setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();

      await page.locator('text=Usar Somente').first().click();

      const historyInput = page.locator('input[type="number"]').filter({ hasText: '' }).first();
      await page.locator('text=Puxar e Excluir Padrões').click();
      await expect(page.locator('text=Limpar Todos')).toHaveCount(1);

      await page.locator('text=Padrão Linhas').click();
      await page.locator('text=Usar Somente').first().click();
      await page.locator('text=Puxar e Excluir Padrões').click();
      await expect(page.locator('text=Limpar Todos')).toHaveCount(1);

      await page.locator('button:has-text("GERAR JOGOS")').click();
      const generatedLabel = page.locator('text=jogos gerados');
      const noneLabel = page.locator('text=Nenhum jogo gerado');
      await Promise.race([
        expect(generatedLabel).toBeVisible(),
        expect(noneLabel).toBeVisible(),
      ]);

      if (await generatedLabel.count()) {
        await page.locator('text=Limpar Resultados').click();
        await expect(generatedLabel).toHaveCount(0);
      }
    } finally {
      await app.close();
    }
  });

  test('RANGE + HISTÓRICO: recorte por faixa respeita endContest e não puxa padrões do concurso fora do range', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_range_${Date.now()}.csv`);

      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rows: string[] = [];

      for (let c = 3600; c <= 3662; c++) {
        rows.push(`${c},01,02,03,06,07,08,11,12,13,16,17,18,21,22,23`);
      }
      rows.push(`3663,01,02,03,04,05,06,07,11,12,16,17,21,22,23,24`);

      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();

      await page.locator('select').first().selectOption('range');
      await page.locator('input[type="number"]').nth(0).fill('3600');
      await page.locator('input[type="number"]').nth(1).fill('3662');

      await page.locator('button:has-text("Padrão Colunas")').click();
      await page.locator('button:has-text("Puxar e Excluir Padrões")').click();

      await expect(page.locator('text=7,2,2,2,2')).toHaveCount(0);
    } finally {
      await app.close();
    }
  });

  test('RANGE + HISTÓRICO LONGO: aceita puxar mais concursos do que a faixa visível usando concursos anteriores ao início', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_history_backfill_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rows: string[] = [];

      for (let c = 3580; c <= 3663; c++) {
        if (c === 3620) {
          rows.push(`${c},01,02,03,04,06,07,08,11,12,13,16,17,18,21,22`);
        } else {
          rows.push(`${c},01,02,03,06,07,08,11,12,13,16,17,18,21,22,23`);
        }
      }

      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      const result = await page.evaluate(async () => {
        return await (window as any).electronAPI.generatorApplyHistory(50, 'column', {
          mode: 'range',
          lastN: 50,
          rangeStart: 3624,
          rangeEnd: 3663,
        });
      });

      expect(result.drawsUsed).toBe(50);
      expect(result.available).toBeGreaterThanOrEqual(50);
      expect(result.patterns.some((item: { pattern: number[] }) => item.pattern.join(',') === '5,5,4,1,0')).toBeTruthy();
    } finally {
      await app.close();
    }
  });

  test('INCLUDE ONLY - EXCLUDE HISTÓRICO: interseção é removida (final = include - excluded) e pode zerar geração', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_include_exclude_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';

      const rows: string[] = [];
      for (let i = 0; i < 10; i++) {
        const c = 5000 + i;
        rows.push(`${c},01,02,03,06,07,08,11,12,13,16,17,18,21,22,23`);
      }
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await page.locator('input[type="number"]').first().fill('10');

      await page.locator('button:has-text("Padrão Linhas")').click();
      await page.locator('button:has-text("Usar Somente")').click();
      await page.locator('input[placeholder="Ex: 43332"]').fill('33333');
      await page.getByRole('button', { name: 'ADICIONAR', exact: true }).click();

      await page.locator('button:has-text("Modo Excluir")').click();
      await page.locator('button:has-text("Puxar e Excluir Padrões")').click();

      await page.locator('button:has-text("GERAR JOGOS")').click();
      const apiResult = await page.evaluate(async () => {
        return await (window as any).electronAPI.generatorGenerate({
          mode: 'lastN',
          lastN: 10,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 50,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [{ id: 'test-exclude', type: 'row', pattern: [3, 3, 3, 3, 3] }],
          patternIncludes: [{ id: 'test-include', type: 'row', pattern: [3, 3, 3, 3, 3] }],
          colPatternMode: 'exclude',
          rowPatternMode: 'include',
          noRepeatDrawn: false,
        });
      });
      expect(apiResult).toHaveLength(0);
    } finally {
      await app.close();
    }
  });

  test('EXCLUSÃO POR GRUPO EXATO: UI, preview, geração e lote removem só a categoria exata', async () => {
    const savePath = path.join(os.tmpdir(), `cmx_exact_groups_${Date.now()}.txt`);
    const { app, page } = await launchApp({ PW_TEST_SAVE_PATH: savePath });
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_exact_groups_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rows = [
        '9101,01,02,03,04,05,06,07,08,10,11,12,13,14,19,20',
        '9102,01,02,03,04,05,06,07,08,10,11,12,13,14,20,21',
        '9103,01,02,03,04,05,07,08,09,10,11,12,13,14,19,20',
        '9104,01,02,03,04,05,06,07,08,09,11,12,13,14,21,23',
        '9105,01,02,03,04,05,07,08,09,11,12,13,14,21,23,25',
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      const coreExactKey = '01,02,03,04,05,06,07,08,10,11,12,13,14,19,20';
      const coreLessKey = '01,02,03,04,05,06,07,08,10,11,12,13,14,20,21';
      const coreMoreKey = '01,02,03,04,05,07,08,09,10,11,12,13,14,19,20';
      const borderExactKey = '01,02,03,04,05,06,07,08,09,11,12,13,14,21,23';
      const borderExtraKey = '01,02,03,04,05,07,08,09,11,12,13,14,21,23,25';

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByTestId('exact-group-exclusions')).toBeVisible();

      await page.getByTestId('exact-group-input-coreOdd').fill('19, 07, 13');
      await page.getByTestId('exact-group-add-coreOdd').click();
      await expect(page.getByTestId('exact-group-item-coreOdd').filter({ hasText: '07,13,19' })).toBeVisible();

      await page.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return saved.exactGroupExclusions?.coreOdd?.[0]?.join(',') === '7,13,19';
      });

      const coreConfig = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          mode: 'lastN',
          lastN: 5,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 10000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: saved.exactGroupExclusions,
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
      });

      const coreResult = await page.evaluate(async (config) => {
        const api = (window as any).electronAPI;
        const preview = await api.generatorPreview(config);
        const games = await api.generatorGenerate(config);
        return { preview, keys: games.map((game: { key: string }) => game.key) };
      }, coreConfig);

      expect(coreResult.keys).not.toContain(coreExactKey);
      expect(coreResult.keys).toContain(coreLessKey);
      expect(coreResult.keys).toContain(coreMoreKey);
      expect(coreResult.preview.totalCombinations).toBe(coreResult.keys.length);

      await page.getByTestId('exact-group-input-borderOdd').fill('01,03,05,11,21,23');
      await page.getByTestId('exact-group-add-borderOdd').click();
      await expect(page.getByTestId('exact-group-item-borderOdd').filter({ hasText: '01,03,05,11,21,23' })).toBeVisible();

      await page.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return saved.exactGroupExclusions?.borderOdd?.[0]?.join(',') === '1,3,5,11,21,23';
      });

      const bothConfig = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          mode: 'lastN',
          lastN: 5,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 10000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: saved.exactGroupExclusions,
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
      });

      const bothResult = await page.evaluate(async (config) => {
        const api = (window as any).electronAPI;
        const preview = await api.generatorPreview(config);
        const games = await api.generatorGenerate(config);
        const mass = await api.generatorSaveMass(config, games.length);
        return { preview, mass, keys: games.map((game: { key: string }) => game.key) };
      }, bothConfig);

      expect(bothResult.keys).not.toContain(coreExactKey);
      expect(bothResult.keys).not.toContain(borderExactKey);
      expect(bothResult.keys).toContain(coreLessKey);
      expect(bothResult.keys).toContain(coreMoreKey);
      expect(bothResult.keys).toContain(borderExtraKey);
      expect(bothResult.preview.totalCombinations).toBe(bothResult.keys.length);
      expect(bothResult.mass.success).toBeTruthy();
      expect(bothResult.mass.count).toBe(bothResult.keys.length);
      expect(fs.existsSync(savePath)).toBeTruthy();

      await page.getByLabel(/Remover grupo 07,13,19/).click();
      await expect(page.getByTestId('exact-group-item-coreOdd').filter({ hasText: '07,13,19' })).toHaveCount(0);

      const withoutCoreConfig = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          mode: 'lastN',
          lastN: 5,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 10000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: saved.exactGroupExclusions,
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
      });

      const withoutCoreKeys = await page.evaluate(async (config) => {
        const games = await (window as any).electronAPI.generatorGenerate(config);
        return games.map((game: { key: string }) => game.key);
      }, withoutCoreConfig);

      expect(withoutCoreKeys).toContain(coreExactKey);
      expect(withoutCoreKeys).not.toContain(borderExactKey);

      await page.getByLabel(/Remover grupo 01,03,05,11,21,23/).click();
      await expect(page.getByTestId('exact-group-item-borderOdd').filter({ hasText: '01,03,05,11,21,23' })).toHaveCount(0);

      const withoutBorderConfig = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          mode: 'lastN',
          lastN: 5,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 10000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: saved.exactGroupExclusions,
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
      });

      const withoutBorderKeys = await page.evaluate(async (config) => {
        const games = await (window as any).electronAPI.generatorGenerate(config);
        return games.map((game: { key: string }) => game.key);
      }, withoutBorderConfig);

      expect(withoutBorderKeys).toContain(borderExactKey);
    } finally {
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
      await app.close();
    }
  });

  test('LOTE GRANDE: salva TXT sem deixar overlay travado em 100%', async () => {
    const savePath = path.join(os.tmpdir(), `cmx_mass_${Date.now()}.txt`);
    const { app, page } = await launchApp({ PW_TEST_SAVE_PATH: savePath });
    try {
      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await page.locator('button:has-text("Padrão Colunas")').click();
      await page.locator('button:has-text("Puxar e Excluir Padrões")').click();
      await page.locator('input[type="number"]').nth(2).fill('100');

      await expect(page.locator('button:has-text("Salvar Grande Lote (TXT)")')).toBeVisible();
      await page.locator('button:has-text("Salvar Grande Lote (TXT)")').click();

      await expect(page.locator('text=Lote salvo')).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('text=Processando Jogos')).toHaveCount(0);

      expect(fs.existsSync(savePath)).toBeTruthy();
      const content = fs.readFileSync(savePath, 'utf-8').trim().split(/\r?\n/);
      expect(content.length).toBeGreaterThan(0);
    } finally {
      if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
      await app.close();
    }
  });
});
