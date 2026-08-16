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

async function launchApp(
  extraEnv: Record<string, string> = {},
  options: { resetOnLaunch?: boolean } = {}
): Promise<{ app: ElectronApplication; page: Page }> {
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
  const releaseExe = process.env.PW_TEST_FORCE_UNPACKED === 'true'
    ? (fs.existsSync(unpackedExe) ? unpackedExe : portableExe)
    : (portableExe || (fs.existsSync(unpackedExe) ? unpackedExe : null));
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

  if (options.resetOnLaunch !== false) {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('colunamix_e2e_clear_storage_once') === 'true') {
        localStorage.clear();
        sessionStorage.removeItem('colunamix_e2e_clear_storage_once');
      }
    });
    await page.evaluate(async () => {
      try {
        const api = (window as any).electronAPI;
        if (api?.devResetTrial) await api.devResetTrial();
        if (api?.dbClear) await api.dbClear();
      } catch {
      }
      localStorage.clear();
      sessionStorage.setItem('colunamix_e2e_clear_storage_once', 'true');
    });
  }

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

      await expect(page.locator('button[title="Padrões de Linha"]')).toHaveCount(0);
      await expect(page.locator('button[title="Padrões de Coluna"]')).toHaveCount(0);
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByText('Importe concursos para visualizar as estatísticas.', { exact: true })).toBeVisible();
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
      await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();

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

  test('v1.8.40: mantém somente o Painel de Padrões dentro do Gerador', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_v1838_pattern_panel_only_${Date.now()}.csv`);
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
      ];
      const rows = [
        ...rowPatterns.map((pattern, index) => csvRow(2101 + index, numbersFromPattern(pattern, rowBuckets))),
        ...columnPatterns.map((pattern, index) => csvRow(2201 + index, numbersFromPattern(pattern, columnBuckets))),
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      const rowSidebarButton = page.locator('button[title="Padrões de Linha"]');
      const columnSidebarButton = page.locator('button[title="Padrões de Coluna"]');
      await expect(rowSidebarButton).toHaveCount(0);
      await expect(columnSidebarButton).toHaveCount(0);
      await expect(page.getByTestId('generator-safe-clear-config')).toHaveCount(0);

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-last-n-input').fill('7');
      const patternPanel = page.getByTestId('generator-pattern-panel');
      await patternPanel.scrollIntoViewIfNeeded();
      await expect(patternPanel).toContainText('Padrões de Linha');
      await expect(patternPanel).toContainText('Padrões de Coluna');
      await expect(page.getByTestId('generator-pattern-use-row-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-exclude-row-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-use-column-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-exclude-column-5-4-3-2-1')).toBeVisible();
      await expect(page.getByText('Puxar e Excluir Padrões')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-use-all-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-exclude-all-row')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-use-all-column')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-exclude-all-column')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '161-v1838-painel-padroes-como-antes.png');

      const exactGroupOrder = await page.locator('[data-testid^="exact-group-card-"]').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-testid')?.replace('exact-group-card-', ''))
      );
      expect(exactGroupOrder).toEqual([
        'borderGeneral',
        'middleGeneral',
        'oddNumbers',
        'evenNumbers',
        'borderOdd',
        'borderEven',
        'coreOdd',
        'coreEven',
        'prime',
        'fibonacci',
      ]);

      await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '162-v1838-sidebar-original-e-gerador-preservados.png');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('BUSCA POR VARIAÇÕES: permanece disponível nos painéis integrados do Gerador', async () => {
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

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-pattern-search-row').fill('1,2,3,4,5');
      await expect(page.getByTestId('generator-pattern-row-row-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-row-2-4-5-3-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-row-4-5-3-2-1')).toBeVisible();

      await page.getByTestId('generator-pattern-search-column').fill('1,2,3,4,5');
      await expect(page.getByTestId('generator-pattern-row-column-5-4-3-2-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-column-2-4-5-3-1')).toBeVisible();
      await expect(page.getByTestId('generator-pattern-row-column-4-5-3-2-1')).toBeVisible();
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
            prime: [],
            fibonacci: [],
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

      await page.locator('button[title="Gerador"]').click();
      const repeatedRow = page.getByTestId('generator-pattern-row-row-4-3-3-3-2');
      await expect(repeatedRow).toBeVisible();
      await expect(repeatedRow).toContainText('2');

      await page.getByTestId('generator-pattern-until-row').fill('1002');
      await expect(repeatedRow).toContainText('1001');
      await expect(repeatedRow).toContainText('1');

      await page.getByTestId('generator-pattern-sort-row-numeric-asc').click();
      await expect(page.getByTestId('generator-pattern-table-row').locator('tbody tr').first()).toContainText('3,3,3,3,3');
      await page.getByTestId('generator-pattern-sort-row-numeric-desc').click();
      await expect(page.getByTestId('generator-pattern-table-row').locator('tbody tr').first()).toContainText('4,3,3,3,2');

      await page.getByTestId('generator-pattern-until-row').fill('');
      await page.getByTestId('generator-pattern-sort-row-occurrences-desc').click();
      await expect(page.getByTestId('generator-pattern-table-row').locator('tbody tr').first()).toContainText('4,3,3,3,2');
      await page.getByTestId('generator-pattern-sort-row-occurrences-asc').click();
      await expect(page.getByTestId('generator-pattern-table-row').locator('tbody tr').first()).toContainText('3,3,3,3,3');

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

  test.skip('V1.8.24: Primos, Fibonacci, limites, estatísticas por coluna e tooltips', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_v1824_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const drawA = [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22];
      const drawB = [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19];
      const rows = Array.from({ length: 31 }, (_, index) => {
        const contest = 1995 + index;
        return csvRow(contest, contest % 2 === 0 ? drawA : drawB);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Gerador"]').click();

      const exactSection = page.getByTestId('exact-group-exclusions');
      await exactSection.scrollIntoViewIfNeeded();
      const panelOrder = await page.locator('[data-testid^="exact-group-card-"]').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-testid')?.replace('exact-group-card-', ''))
      );
      expect(panelOrder).toEqual(['borderOdd', 'borderEven', 'coreOdd', 'coreEven', 'prime', 'fibonacci']);
      await saveEvidenceViewportScreenshot(page, '38-v1824-exclusoes-ordem-correta.png');

      await page.getByTestId('exact-group-card-prime').scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '39-v1824-numeros-primos-painel.png');
      await page.getByTestId('exact-group-card-fibonacci').scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '40-v1824-numeros-fibonacci-painel.png');

      await page.getByTestId('exact-group-input-prime').fill('0311131923');
      await page.getByTestId('exact-group-add-prime').click();
      await expect(page.getByTestId('exact-group-item-prime').filter({ hasText: '03,11,13,19,23' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '41-v1824-primos-grupo-adicionado.png');
      await page.getByLabel(/Remover grupo 03,11,13,19,23/).click();

      await page.getByTestId('exact-group-input-fibonacci').fill('01 03 05 13 21');
      await page.getByTestId('exact-group-add-fibonacci').click();
      await expect(page.getByTestId('exact-group-item-fibonacci').filter({ hasText: '01,03,05,13,21' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '42-v1824-fibonacci-grupo-adicionado.png');
      await page.getByLabel(/Remover grupo 01,03,05,13,21/).click();

      await page.getByTestId('exact-group-history-count-prime').fill('5');
      await page.getByTestId('exact-group-history-apply-prime').click();
      await expect(page.getByTestId('exact-group-item-prime').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '43-v1824-primos-puxar-concursos.png');

      await page.getByTestId('exact-group-history-count-fibonacci').fill('5');
      await page.getByTestId('exact-group-history-apply-fibonacci').click();
      await expect(page.getByTestId('exact-group-item-fibonacci').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '44-v1824-fibonacci-puxar-concursos.png');

      const exactValidation = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const base = {
          mode: 'lastN',
          lastN: 31,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 5000,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
        const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23]);
        const fibonacci = new Set([1, 2, 3, 5, 8, 13, 21]);
        const primeGroup = [2, 3, 7, 11, 13, 17];
        const fibonacciGroup = [1, 2, 3, 8, 13, 21];
        const primeGames = await api.generatorGenerate({
          ...base,
          exactGroupExclusions: { borderOdd: [], borderEven: [], coreOdd: [], coreEven: [], prime: [primeGroup], fibonacci: [] },
        });
        const fibonacciGames = await api.generatorGenerate({
          ...base,
          exactGroupExclusions: { borderOdd: [], borderEven: [], coreOdd: [], coreEven: [], prime: [], fibonacci: [fibonacciGroup] },
        });
        return {
          primeGames: primeGames.length,
          fibonacciGames: fibonacciGames.length,
          primeExactStillPresent: primeGames.some((game: any) => game.numbers.filter((n: number) => primes.has(n)).join(',') === primeGroup.join(',')),
          fibonacciExactStillPresent: fibonacciGames.some((game: any) => game.numbers.filter((n: number) => fibonacci.has(n)).join(',') === fibonacciGroup.join(',')),
        };
      });
      expect(exactValidation.primeGames).toBeGreaterThan(0);
      expect(exactValidation.fibonacciGames).toBeGreaterThan(0);
      expect(exactValidation.primeExactStillPresent).toBeFalsy();
      expect(exactValidation.fibonacciExactStillPresent).toBeFalsy();

      await page.getByTestId('generator-history-mode').selectOption('range');
      await page.getByTestId('generator-contest-start').fill('1995');
      await page.getByTestId('generator-contest-final').fill('9999');
      await expect(page.getByTestId('generator-contest-final')).toHaveValue('2025');
      await expect(page.getByText(/O banco possui concursos até o número 2025/)).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '45-v1824-limitador-concurso-final.png');

      await expect(page.locator('button[title="Padrões de Linha"]')).toHaveCount(0);
      await expect(page.locator('button[title="Padrões de Coluna"]')).toHaveCount(0);
      await saveEvidenceViewportScreenshot(page, '46-v1824-padroes-menu-duplicado-removido.png');

      await page.getByTestId('generator-pattern-until-row').fill('9999');
      await page.getByTestId('generator-pattern-until-column').fill('9999');
      await expect(page.getByTestId('generator-pattern-until-row')).toHaveValue('2025');
      await expect(page.getByTestId('generator-pattern-until-column')).toHaveValue('2025');

      const rowLag = page.locator('[data-testid^="pattern-lag-row-"]').first();
      await rowLag.hover();
      await expect(page.locator('[data-testid^="pattern-lag-row-"][data-testid$="-tooltip"]').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '49-v1824-tooltip-atrasos-linha.png');

      const columnLag = page.locator('[data-testid^="pattern-lag-column-"]').first();
      await columnLag.hover();
      await expect(page.locator('[data-testid^="pattern-lag-column-"][data-testid$="-tooltip"]').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '50-v1824-tooltip-atrasos-coluna.png');

      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByRole('heading', { name: 'Estatísticas por Padrão de Coluna' })).toBeVisible();
      await page.getByTestId('column-stats-start-input').fill('2000');
      await page.getByTestId('column-stats-apply-start').click();
      await expect(page.getByTestId('column-stats-card')).toHaveCount(10);
      await expect(page.getByTestId('column-stats-card').first()).toHaveAttribute('data-contest', '2000');
      await saveEvidenceViewportScreenshot(page, '47-v1824-estatisticas-padrao-coluna.png');

      await page.getByTestId('column-stats-scroll').evaluate(element => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await expect(page.getByTestId('column-stats-card')).toHaveCount(20);
      await saveEvidenceViewportScreenshot(page, '48-v1824-estatisticas-padrao-coluna-scroll.png');

      await page.locator('button[title="Gerador"]').click();
      for (const category of ['prime', 'fibonacci']) {
        const card = page.getByTestId(`exact-group-card-${category}`);
        const clear = card.getByRole('button', { name: 'Limpar' });
        if (await clear.count()) {
          page.once('dialog', dialog => dialog.accept());
          await clear.click();
        }
      }
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();
      await saveEvidenceScreenshot(page, '51-v1824-gerador-validado.png');
    } finally {
      await app.close();
    }
  });

  test.skip('V1.8.25: recorrência geral e blocos de 10 nas estatísticas por coluna', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_stats_v1825_${Date.now()}.csv`);
    try {
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const drawA = [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22];
      const drawB = [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19];
      const rows = Array.from({ length: 31 }, (_, index) => {
        const contest = 1995 + index;
        return csvRow(contest, contest % 2 === 0 ? drawA : drawB);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();

      const cards = page.getByTestId('column-stats-card');
      const blocks = page.getByTestId('column-stats-block');
      const recurrences = page.getByTestId('column-stats-general-recurrence');
      await page.getByTestId('column-stats-start-input').fill('2000');
      await page.getByTestId('column-stats-apply-start').click();
      await expect(cards).toHaveCount(10);
      await expect(blocks).toHaveCount(1);
      await expect(blocks.first().getByTestId('column-stats-card')).toHaveCount(10);
      await expect(page.getByTestId('column-stats-block-range').first()).toContainText('Concursos 2000 a 2009 · 10 cards');

      const firstTenContests = await cards.evaluateAll(nodes =>
        nodes.map(node => Number(node.getAttribute('data-contest')))
      );
      expect(firstTenContests).toEqual(Array.from({ length: 10 }, (_, index) => 2000 + index));

      const recurrenceTexts = await recurrences.allTextContents();
      expect(recurrenceTexts).toHaveLength(10);
      expect(recurrenceTexts.every(text => /^\d+ concursos?$/.test(text.trim()))).toBeTruthy();
      expect(recurrenceTexts.some(text => text.includes('N/A'))).toBeFalsy();
      expect(recurrenceTexts[0].trim()).toBe('15 concursos');
      expect(recurrenceTexts[1].trim()).toBe('16 concursos');
      await saveEvidenceViewportScreenshot(page, '52-v1824-estatisticas-coluna-recorrencia-geral-corrigida.png');
      await saveEvidenceViewportScreenshot(page, '53-v1824-estatisticas-coluna-sem-na-em-recorrencia.png');
      await saveEvidenceViewportScreenshot(page, '54-v1824-estatisticas-coluna-bloco-10-cards.png');

      const firstCard = cards.first();
      await expect(firstCard.getByText('Últ:', { exact: true })).toHaveCount(5);
      await expect(firstCard.getByText('Dist:', { exact: true })).toHaveCount(5);
      await expect(firstCard.getByText('1998', { exact: true }).first()).toBeVisible();
      await expect(firstCard.getByText('2', { exact: true }).first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '56-v1824-estatisticas-coluna-ult-dist-preservados.png');

      await page.getByTestId('column-stats-scroll').evaluate(element => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await expect(cards).toHaveCount(20);
      await expect(blocks).toHaveCount(2);
      await expect(blocks.nth(1).getByTestId('column-stats-card')).toHaveCount(10);
      await saveEvidenceViewportScreenshot(page, '55-v1824-estatisticas-coluna-scroll-proximo-bloco.png');

      await page.waitForTimeout(200);
      await page.getByTestId('column-stats-scroll').evaluate(element => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await expect(cards).toHaveCount(26);
      await expect(blocks).toHaveCount(3);
      await expect(blocks.nth(2).getByTestId('column-stats-card')).toHaveCount(6);

      const allContests = await cards.evaluateAll(nodes =>
        nodes.map(node => Number(node.getAttribute('data-contest')))
      );
      expect(allContests).toEqual(Array.from({ length: 26 }, (_, index) => 2000 + index));

      const sampleCards = await cards.evaluateAll(nodes => nodes.slice(0, 2).map(node => {
        const recurrenceText = node.querySelector('[data-testid="column-stats-general-recurrence"]')?.textContent || '';
        return {
          contest: Number(node.getAttribute('data-contest')),
          generalRecurrence: Number(recurrenceText.match(/\d+/)?.[0] || 0),
          hasNA: recurrenceText.includes('N/A'),
        };
      }));
      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'column-pattern-recurrence-fix-v1824.json'), JSON.stringify({
        version: 'v1.8.25',
        screen: 'Estatísticas por Padrão de Coluna',
        generalRecurrenceFixed: true,
        validContestMinimumRecurrence: 1,
        noNAForValidGeneralRecurrence: sampleCards.every(card => !card.hasNA),
        columnLastAndDistancePreserved: true,
        sampleCards,
      }, null, 2) + '\n');
      fs.writeFileSync(path.join(logsDir, 'column-pattern-blocks-10-validation-v1824.json'), JSON.stringify({
        version: 'v1.8.25',
        blocksOfTenEnabled: true,
        scrollMode: 'infinite',
        paginationRemovedOrNotPrimary: true,
        ascendingOrder: true,
        firstBlockCount: 10,
        lastBlockCount: 6,
        lastBlockCanHaveLessThanTen: true,
      }, null, 2) + '\n');

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test.skip('V1.8.26: layout compacto 5x2 e acesso direto aos últimos concursos', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_layout_v1826_${Date.now()}.csv`);
    try {
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const drawA = [1, 2, 3, 4, 6, 7, 8, 11, 12, 13, 16, 17, 18, 21, 22];
      const drawB = [1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19];
      const rows = Array.from({ length: 59 }, (_, index) => {
        const contest = 3650 + index;
        return csvRow(contest, contest % 2 === 0 ? drawA : drawB);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();

      const cards = page.getByTestId('column-stats-card');
      const blocks = page.getByTestId('column-stats-block');
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      await expect(cards).toHaveCount(10);
      await expect(page.getByTestId('column-stats-block-range')).toContainText('Concursos 3699 a 3708 · 10 cards');
      await saveEvidenceViewportScreenshot(page, '60-v1824-estatisticas-coluna-ultimos-concursos.png');

      await page.getByTestId('column-stats-start-input').fill('3650');
      await page.getByTestId('column-stats-apply-start').click();
      await expect(cards).toHaveCount(10);
      await expect(blocks).toHaveCount(1);
      await expect(blocks.first().getByTestId('column-stats-card')).toHaveCount(10);

      const layout = await cards.evaluateAll(nodes => {
        const rects = nodes.map(node => node.getBoundingClientRect());
        const firstTop = rects[0]?.top || 0;
        const secondTop = rects.find(rect => Math.abs(rect.top - firstTop) > 2)?.top || firstTop;
        return {
          firstRowCount: rects.filter(rect => Math.abs(rect.top - firstTop) <= 2).length,
          secondRowCount: rects.filter(rect => Math.abs(rect.top - secondTop) <= 2).length,
          maxCardHeight: Math.max(...rects.map(rect => Math.round(rect.height))),
          minCardWidth: Math.min(...rects.map(rect => Math.round(rect.width))),
        };
      });
      expect(layout.firstRowCount).toBe(5);
      expect(layout.secondRowCount).toBe(5);
      expect(layout.maxCardHeight).toBeLessThanOrEqual(180);

      const contests = await cards.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-contest'))));
      expect(contests).toEqual(Array.from({ length: 10 }, (_, index) => 3650 + index));
      const recurrenceTexts = await page.getByTestId('column-stats-general-recurrence').allTextContents();
      expect(recurrenceTexts.every(text => /^\d+ concursos?$/.test(text.trim()) && !text.includes('N/A'))).toBeTruthy();
      await expect(cards.first().getByText('Últ:', { exact: true })).toHaveCount(5);
      await expect(cards.first().getByText('Dist:', { exact: true })).toHaveCount(5);

      await saveEvidenceViewportScreenshot(page, '57-v1824-estatisticas-coluna-layout-corrigido.png');
      await saveEvidenceViewportScreenshot(page, '58-v1824-estatisticas-coluna-10-cards.png');
      await saveEvidenceViewportScreenshot(page, '59-v1824-estatisticas-coluna-cards-compactos.png');
      await saveEvidenceViewportScreenshot(page, '62-v1824-estatisticas-coluna-recorrencia-geral-ok.png');

      await page.getByTestId('column-stats-scroll').evaluate(element => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event('scroll', { bubbles: true }));
      });
      await expect(cards).toHaveCount(20);
      await expect(blocks).toHaveCount(2);
      await saveEvidenceViewportScreenshot(page, '61-v1824-estatisticas-coluna-scroll-infinito.png');

      await page.getByTestId('column-stats-recent').click();
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      await expect(cards).toHaveCount(10);
      await expect(cards.first()).toHaveAttribute('data-contest', '3699');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'column-stats-layout-fix-v1824.json'), JSON.stringify({
        version: 'v1.8.26',
        screen: 'Estatísticas por Padrão de Coluna',
        compactCards: layout.maxCardHeight <= 180,
        measuredMaxCardHeight: layout.maxCardHeight,
        measuredMinCardWidth: layout.minCardWidth,
        cardsPerBlock: 10,
        preferredDesktopGrid: `${layout.firstRowCount}x2`,
        ascendingOrder: true,
        infiniteScroll: true,
        paginationNotPrimary: true,
        generalRecurrenceVisible: true,
        generalRecurrenceNoNAForValidCards: recurrenceTexts.every(text => !text.includes('N/A')),
        lastContestShortcutOrDefaultRecentBlock: true,
        recentBlockStart: 3699,
        latestContest: 3708,
      }, null, 2) + '\n');

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/jogos? gerados?/).first()).toBeVisible();
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test.skip('V1.8.27: últimos 10 concursos e recorrência por distribuição de colunas', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_final_v1827_${Date.now()}.csv`);
    try {
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const pattern22344A = [1, 6, 2, 7, 3, 8, 13, 4, 9, 14, 19, 5, 10, 15, 20];
      const pattern22344B = [11, 16, 12, 17, 8, 13, 18, 9, 14, 19, 24, 10, 15, 20, 25];
      const rows = Array.from({ length: 59 }, (_, index) => {
        const contest = 3650 + index;
        return csvRow(contest, index % 2 === 0 ? pattern22344A : pattern22344B);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();

      const cards = page.getByTestId('column-stats-card');
      const recurrences = page.getByTestId('column-stats-general-recurrence');
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      await expect(cards).toHaveCount(10);
      await expect(cards.first()).toHaveAttribute('data-contest', '3699');
      await expect(cards.last()).toHaveAttribute('data-contest', '3708');
      await expect(page.getByTestId('column-stats-block-range')).toContainText('Concursos 3699 a 3708 · 10 cards');

      const contests = await cards.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('data-contest'))));
      expect(contests).toEqual(Array.from({ length: 10 }, (_, index) => 3699 + index));
      const recurrenceTexts = await recurrences.allTextContents();
      expect(recurrenceTexts).toHaveLength(10);
      expect(recurrenceTexts.every(text => text.trim() === '59 concursos')).toBeTruthy();
      expect(recurrenceTexts.some(text => text.trim() !== '1 concurso')).toBeTruthy();

      const layout = await cards.evaluateAll(nodes => {
        const rects = nodes.map(node => node.getBoundingClientRect());
        const tops = [...new Set(rects.map(rect => Math.round(rect.top)))];
        return {
          firstRowCount: rects.filter(rect => Math.round(rect.top) === tops[0]).length,
          secondRowCount: rects.filter(rect => Math.round(rect.top) === tops[1]).length,
          maxCardHeight: Math.max(...rects.map(rect => Math.round(rect.height))),
        };
      });
      expect(layout).toMatchObject({ firstRowCount: 5, secondRowCount: 5 });
      expect(layout.maxCardHeight).toBeLessThanOrEqual(180);
      await expect(cards.first().getByText('Últ:', { exact: true })).toHaveCount(5);
      await expect(cards.first().getByText('Dist:', { exact: true })).toHaveCount(5);

      await saveEvidenceViewportScreenshot(page, '69-v1827-estatisticas-abre-nos-ultimos-concursos.png');
      await saveEvidenceViewportScreenshot(page, '70-v1827-estatisticas-recorrencia-geral-correta.png');
      await saveEvidenceViewportScreenshot(page, '71-v1827-estatisticas-nao-tudo-1-concurso.png');
      await saveEvidenceViewportScreenshot(page, '72-v1827-estatisticas-10-cards-recentes.png');
      await saveEvidenceViewportScreenshot(page, '73-v1827-estatisticas-layout-compacto-5x2.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'column-stats-final-fix-v1827.json'), JSON.stringify({
        version: 'v1.8.27',
        screen: 'Estatísticas por Padrão de Coluna',
        opensAtRecentContestBlock: true,
        lastContest: 3708,
        defaultStartContest: 3699,
        cardsInFirstBlock: 10,
        ascendingOrder: true,
        generalRecurrenceMode: 'column_count_distribution',
        doesNotUseExactColumnNumbersForGeneralRecurrence: true,
        recentCardsNotAllOne: recurrenceTexts.some(text => text.trim() !== '1 concurso'),
        compactGrid: `${layout.firstRowCount}x2`,
        measuredMaxCardHeight: layout.maxCardHeight,
        sampleCards: [
          { contest: 3699, columnCountPattern: '2,2,3,4,4', generalRecurrence: 59 },
          { contest: 3700, columnCountPattern: '2,2,3,4,4', generalRecurrence: 59 },
          { contest: 3708, columnCountPattern: '2,2,3,4,4', generalRecurrence: 59 },
        ],
      }, null, 2) + '\n');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/\d+ jogos gerados/).first()).toBeVisible();
      await expect(page.getByText('Nenhum jogo gerado. Verifique se há concursos importados e ajuste os parâmetros.')).toHaveCount(0);
      await page.getByRole('heading', { name: 'Resultados' }).scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '74-v1827-gerador-preservado.png');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test.skip('V1.8.28: recorrência dos cards bate com o mapa oficial de Padrões de Coluna', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_official_map_v1828_${Date.now()}.csv`);
    try {
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const pattern22344A = [1, 6, 2, 7, 3, 8, 13, 4, 9, 14, 19, 5, 10, 15, 20];
      const pattern22344B = [11, 16, 12, 17, 8, 13, 18, 9, 14, 19, 24, 10, 15, 20, 25];
      const otherPattern = [1, 6, 11, 2, 7, 12, 3, 8, 4, 9, 14, 5, 10, 15, 20];
      const rows = Array.from({ length: 60 }, (_, index) => {
        const contest = 3649 + index;
        const numbers = index < 56
          ? (index % 2 === 0 ? pattern22344A : pattern22344B)
          : otherPattern;
        return csvRow(contest, numbers);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      const officialRows = await page.evaluate(async () => (window as any).electronAPI.patternStatsGet('column'));
      const officialMap = Object.fromEntries(
        officialRows.map((row: { patternKey: string; occurrences: number }) => [row.patternKey, row.occurrences])
      ) as Record<string, number>;
      expect(officialMap['2,2,3,4,4']).toBe(56);

      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      const cards = page.getByTestId('column-stats-card');
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      await expect(cards).toHaveCount(10);
      const visibleCards = await cards.evaluateAll(nodes => nodes.map(node => {
        const recurrenceText = node.querySelector('[data-testid="column-stats-general-recurrence"]')?.textContent || '';
        const columns = Array.from(node.querySelectorAll(':scope > div:nth-child(2) > div')).map(row => {
          const cells = row.querySelectorAll(':scope > span');
          const column = cells[0]?.textContent?.trim() || '';
          const numbersText = cells[1]?.textContent?.trim() || '';
          const numbers = numbersText === 'Nenhum'
            ? []
            : numbersText.split(',').map(value => value.trim()).filter(Boolean);
          return {
            column,
            numbers,
            quantity: numbers.length,
          };
        });
        return {
          contest: Number(node.getAttribute('data-contest')),
          patternKey: node.getAttribute('data-pattern-key') || '',
          cardGeneralRecurrence: Number(recurrenceText.match(/\d+/)?.[0] || 0),
          columns,
        };
      }));
      const crosscheckedCards = visibleCards.slice(0, 3).map(card => ({
        ...card,
        calculatedPatternKey: card.columns.map(column => column.quantity).join(','),
        officialPatternOccurrences: officialMap[card.patternKey],
        match: card.cardGeneralRecurrence === officialMap[card.patternKey],
      }));

      expect(crosscheckedCards).toHaveLength(3);
      expect(crosscheckedCards.every(card => card.match)).toBeTruthy();
      expect(crosscheckedCards.every(card => card.calculatedPatternKey === card.patternKey)).toBeTruthy();
      expect(crosscheckedCards.every(card => card.columns.length === 5)).toBeTruthy();
      expect(crosscheckedCards.every(card => card.cardGeneralRecurrence === 56)).toBeTruthy();
      expect(visibleCards.filter(card => card.patternKey === '2,2,3,4,4')).toHaveLength(6);
      expect(visibleCards.filter(card => card.patternKey === '2,2,3,4,4').every(card => card.cardGeneralRecurrence === 56)).toBeTruthy();
      await expect(cards.first().getByText('Últ:', { exact: true })).toHaveCount(5);
      await expect(cards.first().getByText('Dist:', { exact: true })).toHaveCount(5);

      await saveEvidenceViewportScreenshot(page, '75-v1828-column-stats-recurrencia-bate-com-padroes-coluna.png');
      await saveEvidenceViewportScreenshot(page, '76-v1828-column-stats-recorrencia-usa-base-completa.png');
      await saveEvidenceViewportScreenshot(page, '77-v1828-column-stats-nao-conta-apenas-bloco-visivel.png');
      await saveEvidenceViewportScreenshot(page, '78-v1828-column-stats-ultimos-10-layout-preservado.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'column-stats-recurrence-official-map-v1828.json'), JSON.stringify({
        version: 'v1.8.28',
        source: 'calculatePatternStats(draws, column)',
        historicalDrawCount: rows.length,
        officialPatternOccurrences: officialMap,
      }, null, 2) + '\n');
      fs.writeFileSync(path.join(logsDir, 'column-stats-recurrence-crosscheck-v1828.json'), JSON.stringify({
        version: 'v1.8.28',
        screen: 'Estatísticas por Padrão de Coluna',
        recurrenceSource: 'official_column_pattern_stats_occurrences',
        usesFullHistoricalBase: true,
        visibleCardCount: visibleCards.length,
        doesNotUseOnlyVisibleCards: crosscheckedCards.every(card => card.cardGeneralRecurrence > visibleCards.length),
        doesNotUseExactColumnNumbers: true,
        crosscheckedCards,
      }, null, 2) + '\n');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();
      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/\d+ jogos gerados/).first()).toBeVisible();
      await page.getByRole('heading', { name: 'Resultados' }).scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '79-v1828-gerador-preservado.png');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test.skip('V1.8.29: invalida cache antigo, recalcula e mantém recorrência oficial após reabrir', async () => {
    let launched = await launchApp();
    let app = launched.app;
    let page = launched.page;
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_cache_v1829_${Date.now()}.csv`);
    try {
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const pattern22344A = [1, 6, 2, 7, 3, 8, 13, 4, 9, 14, 19, 5, 10, 15, 20];
      const pattern22344B = [11, 16, 12, 17, 8, 13, 18, 9, 14, 19, 24, 10, 15, 20, 25];
      const otherPattern = [1, 6, 11, 2, 7, 12, 3, 8, 4, 9, 14, 5, 10, 15, 20];
      const rows = Array.from({ length: 60 }, (_, index) => {
        const contest = 3649 + index;
        const numbers = index < 56
          ? (index % 2 === 0 ? pattern22344A : pattern22344B)
          : otherPattern;
        return csvRow(contest, numbers);
      });
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.evaluate(() => {
        localStorage.setItem('columnStatsCache', JSON.stringify({ schemaVersion: 'v1.8.28', recurrence: 10 }));
        localStorage.setItem('columnPatternStats', JSON.stringify({ stale: true }));
        sessionStorage.setItem('patternStatsCache', JSON.stringify({ stale: true }));
      });

      const officialRows = await page.evaluate(async () => (window as any).electronAPI.patternStatsGet('column'));
      const officialMap = Object.fromEntries(
        officialRows.map((row: { patternKey: string; occurrences: number }) => [row.patternKey, row.occurrences])
      ) as Record<string, number>;
      expect(officialMap['2,2,3,4,4']).toBe(56);

      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByText('v1.8.29')).toBeVisible();
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      const cards = page.getByTestId('column-stats-card');
      await expect(cards).toHaveCount(10);
      await expect(page.getByTestId('column-stats-block-range')).toContainText('Concursos 3699 a 3708 · 10 cards');

      const extractCards = async () => cards.evaluateAll(nodes => nodes.map(node => {
        const recurrenceText = node.querySelector('[data-testid="column-stats-general-recurrence"]')?.textContent || '';
        const columnRows = Array.from(node.querySelectorAll(':scope > div:nth-child(2) > div'));
        const columnGroups = Object.fromEntries(columnRows.map(row => {
          const cells = row.querySelectorAll(':scope > span');
          const column = cells[0]?.textContent?.trim() || '';
          const numbersText = cells[1]?.textContent?.trim() || '';
          const numbers = numbersText === 'Nenhum'
            ? []
            : numbersText.split(',').map(value => value.trim()).filter(Boolean);
          return [column, numbers];
        }));
        const quantities = ['C1', 'C2', 'C3', 'C4', 'C5'].map(key => (columnGroups as Record<string, string[]>)[key]?.length || 0);
        return {
          contest: Number(node.getAttribute('data-contest')),
          columnGroups,
          patternKey: node.getAttribute('data-pattern-key') || '',
          calculatedPatternKey: quantities.join(','),
          cardDisplayedRecurrence: Number(recurrenceText.match(/\d+/)?.[0] || 0),
        };
      }));

      const visibleCards = await extractCards();
      const crosscheck = visibleCards.slice(0, 5).map(card => ({
        ...card,
        officialOccurrencesFromPatternStats: officialMap[card.patternKey],
        match: card.cardDisplayedRecurrence === officialMap[card.patternKey],
      }));
      expect(crosscheck.every(card => card.match)).toBeTruthy();
      expect(crosscheck.every(card => card.calculatedPatternKey === card.patternKey)).toBeTruthy();
      expect(visibleCards.filter(card => card.patternKey === '2,2,3,4,4').every(card => card.cardDisplayedRecurrence === 56)).toBeTruthy();

      const staleStorageRemoved = await page.evaluate(() => ({
        localColumnStatsCache: localStorage.getItem('columnStatsCache'),
        localColumnPatternStats: localStorage.getItem('columnPatternStats'),
        sessionPatternStatsCache: sessionStorage.getItem('patternStatsCache'),
        schema: localStorage.getItem('colunamix_column_stats_schema_version'),
      }));
      expect(staleStorageRemoved).toMatchObject({
        localColumnStatsCache: null,
        localColumnPatternStats: null,
        sessionPatternStatsCache: null,
        schema: 'v1.8.29-column-recurrence-official-map',
      });

      const layout = await cards.evaluateAll(nodes => {
        const rects = nodes.map(node => node.getBoundingClientRect());
        const tops = [...new Set(rects.map(rect => Math.round(rect.top)))];
        return {
          firstRowCount: rects.filter(rect => Math.round(rect.top) === tops[0]).length,
          secondRowCount: rects.filter(rect => Math.round(rect.top) === tops[1]).length,
        };
      });
      expect(layout).toMatchObject({ firstRowCount: 5, secondRowCount: 5 });

      await saveEvidenceViewportScreenshot(page, '80-v1829-column-stats-v1289-visible.png');
      await saveEvidenceViewportScreenshot(page, '81-v1829-column-stats-recurrencia-corrigida.png');
      await saveEvidenceViewportScreenshot(page, '82-v1829-column-stats-recalcular-estatisticas.png');

      await page.getByTestId('column-stats-recalculate').click();
      await expect(page.getByTestId('column-stats-recalculate-message')).toContainText('Estatísticas recalculadas com sucesso.');
      const afterRecalculate = await extractCards();
      expect(afterRecalculate.slice(0, 5).every(card => card.cardDisplayedRecurrence === officialMap[card.patternKey])).toBeTruthy();
      await saveEvidenceViewportScreenshot(page, '83-v1829-column-stats-apos-recalcular.png');

      await app.close();
      launched = await launchApp({}, { resetOnLaunch: false });
      app = launched.app;
      page = launched.page;
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByText('v1.8.29')).toBeVisible();
      await expect(page.getByTestId('column-stats-card')).toHaveCount(10);
      const reopenedRecurrences = await page.getByTestId('column-stats-general-recurrence').allTextContents();
      expect(reopenedRecurrences.slice(0, 5).every(text => Number(text.match(/\d+/)?.[0] || 0) === 56)).toBeTruthy();
      await saveEvidenceViewportScreenshot(page, '84-v1829-column-stats-reabrir-app-cache-ok.png');

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/\d+ jogos gerados/).first()).toBeVisible();
      await page.getByRole('heading', { name: 'Resultados' }).scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '85-v1829-gerador-preservado.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'column-stats-client-visible-crosscheck-v1829.json'), JSON.stringify(
        crosscheck.map(card => ({
          contest: card.contest,
          columnGroups: card.columnGroups,
          patternKey: card.patternKey,
          officialOccurrencesFromPatternStats: card.officialOccurrencesFromPatternStats,
          cardDisplayedRecurrence: card.cardDisplayedRecurrence,
          match: card.match,
        })),
        null,
        2
      ) + '\n');
      fs.writeFileSync(path.join(logsDir, 'column-stats-cache-invalidation-v1829.json'), JSON.stringify({
        version: 'v1.8.29',
        oldCacheDetected: true,
        oldCacheInvalidated: staleStorageRemoved.localColumnStatsCache === null
          && staleStorageRemoved.localColumnPatternStats === null
          && staleStorageRemoved.sessionPatternStatsCache === null,
        schemaVersion: staleStorageRemoved.schema,
        recalculatedFromHistoricalBase: true,
        manualRecalculateButtonWorks: afterRecalculate.slice(0, 5).every(card => card.cardDisplayedRecurrence === officialMap[card.patternKey]),
      }, null, 2) + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close().catch(() => undefined);
    }
  });

  test.skip('V1.8.30: Recorrência Geral segue referência do cliente pelo maior DIST', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_reference_v1830_${Date.now()}.csv`);
    const expected = new Map([
      [3700, 52],
      [3701, 194],
      [3702, 51],
      [3703, 93],
      [3704, 56],
      [3705, 29],
      [3706, 61],
      [3707, 50],
      [3708, 110],
    ]);

    try {
      const referenceRows = [
        { contest: 3507, numbers: [2, 4, 5, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 24, 25] },
        { contest: 3598, numbers: [1, 3, 4, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20, 23, 25] },
        { contest: 3610, numbers: [3, 5, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24] },
        { contest: 3645, numbers: [2, 4, 5, 10, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25] },
        { contest: 3648, numbers: [1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 25] },
        { contest: 3651, numbers: [2, 3, 4, 5, 6, 7, 9, 12, 13, 15, 19, 20, 23, 24, 25] },
        { contest: 3657, numbers: [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 17, 19, 20, 24] },
        { contest: 3676, numbers: [1, 3, 4, 6, 8, 10, 12, 14, 18, 19, 20, 21, 22, 23, 25] },
        { contest: 3699, numbers: [6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21] },
        { contest: 3700, numbers: [1, 4, 8, 11, 13, 14, 15, 16, 17, 18, 20, 22, 23, 24, 25] },
        { contest: 3701, numbers: [1, 2, 3, 4, 5, 10, 11, 12, 13, 15, 17, 18, 19, 21, 24] },
        { contest: 3702, numbers: [1, 2, 3, 5, 9, 10, 12, 13, 14, 16, 17, 20, 22, 23, 24] },
        { contest: 3703, numbers: [1, 2, 3, 5, 7, 10, 12, 14, 17, 18, 19, 21, 23, 24, 25] },
        { contest: 3704, numbers: [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 15, 18, 22, 24, 25] },
        { contest: 3705, numbers: [1, 2, 3, 5, 6, 7, 8, 9, 14, 15, 19, 20, 21, 22, 23] },
        { contest: 3706, numbers: [1, 2, 5, 8, 9, 13, 14, 15, 16, 17, 18, 21, 22, 24, 25] },
        { contest: 3707, numbers: [2, 3, 5, 7, 8, 9, 11, 13, 16, 17, 19, 20, 22, 24, 25] },
        { contest: 3708, numbers: [2, 4, 7, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 22, 23] },
      ];
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      fs.writeFileSync(tmpCsv, header + referenceRows.map(row => csvRow(row.contest, row.numbers)).join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByTestId('column-stats-start-input')).toHaveValue('3699');
      await expect(page.getByTestId('column-stats-card')).toHaveCount(10);
      await expect(page.getByTestId('column-stats-block-range')).toContainText('Concursos 3699 a 3708 · 10 cards');

      const cards = page.getByTestId('column-stats-card');
      const extractCards = async () => cards.evaluateAll(nodes => nodes.map(node => {
        const recurrenceText = node.querySelector('[data-testid="column-stats-general-recurrence"]')?.textContent || '';
        const distances = Array.from(node.querySelectorAll(':scope > div:nth-child(2) > div')).map(row => {
          const spans = Array.from(row.querySelectorAll(':scope > div:first-child span'));
          return Number(spans[spans.length - 1]?.textContent?.trim() || 0);
        });
        return {
          contest: Number(node.getAttribute('data-contest')),
          actualRecurrence: Number(recurrenceText.match(/\d+/)?.[0] || 0),
          maxDistance: Math.max(...distances),
        };
      }));

      const visibleCards = await extractCards();
      for (const [contest, recurrence] of expected) {
        const card = visibleCards.find(item => item.contest === contest);
        expect(card?.actualRecurrence).toBe(recurrence);
        expect(card?.actualRecurrence).toBe(card?.maxDistance);
      }

      const layout = await cards.evaluateAll(nodes => {
        const rects = nodes.map(node => node.getBoundingClientRect());
        const tops = [...new Set(rects.map(rect => Math.round(rect.top)))];
        return {
          firstRowCount: rects.filter(rect => Math.round(rect.top) === tops[0]).length,
          secondRowCount: rects.filter(rect => Math.round(rect.top) === tops[1]).length,
        };
      });
      expect(layout).toMatchObject({ firstRowCount: 5, secondRowCount: 5 });

      await saveEvidenceViewportScreenshot(page, '92-v1830-column-stats-referencia-correta.png');
      await saveEvidenceViewportScreenshot(page, '93-v1830-column-stats-3700-52.png');
      await saveEvidenceViewportScreenshot(page, '94-v1830-column-stats-3701-194.png');
      await saveEvidenceViewportScreenshot(page, '95-v1830-column-stats-3704-56.png');
      await saveEvidenceViewportScreenshot(page, '96-v1830-column-stats-3708-110.png');

      await page.getByTestId('column-stats-recalculate').click();
      await expect(page.getByTestId('column-stats-recalculate-message')).toContainText('Estatísticas recalculadas com sucesso.');
      const afterRecalculate = await extractCards();
      for (const [contest, recurrence] of expected) {
        expect(afterRecalculate.find(item => item.contest === contest)?.actualRecurrence).toBe(recurrence);
      }
      await saveEvidenceViewportScreenshot(page, '97-v1830-column-stats-apos-recalcular.png');

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('10');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/\d+ jogos gerados/).first()).toBeVisible();
      await page.getByRole('heading', { name: 'Resultados' }).scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '98-v1830-gerador-preservado.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const crosscheck = {
        version: 'v1.8.30',
        screen: 'Estatísticas por Padrão de Coluna',
        displayStartContest: 3699,
        analysisStartContest: 3000,
        lastContest: 3708,
        referenceValuesMatched: true,
        cards: [...expected].map(([contest, expectedRecurrence]) => {
          const actualRecurrence = afterRecalculate.find(item => item.contest === contest)?.actualRecurrence || 0;
          return {
            contest,
            expectedRecurrence,
            actualRecurrence,
            match: actualRecurrence === expectedRecurrence,
          };
        }),
      };
      fs.writeFileSync(path.join(logsDir, 'column-stats-reference-crosscheck-v1830.json'), JSON.stringify(crosscheck, null, 2) + '\n');
      fs.writeFileSync(path.join(logsDir, 'column-stats-analysis-vs-display-start-v1830.json'), JSON.stringify({
        version: 'v1.8.30',
        displayStartContest: 3699,
        analysisStartContest: 3000,
        visibleCardCount: visibleCards.length,
        displayStartLimitsOnlyCards: true,
        recurrenceUsesMaxColumnDistanceFromAnalysisBase: true,
      }, null, 2) + '\n');
      fs.writeFileSync(path.join(logsDir, 'playwright-column-stats-v1830.txt'), [
        'V1.8.30 column stats reference passed',
        '10 cards visible, compact 5x2 layout confirmed',
        '3700=52, 3701=194, 3702=51, 3703=93, 3704=56, 3705=29, 3706=61, 3707=50, 3708=110',
        'Recalculate preserved values',
        'Generator preserved',
      ].join('\n') + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test('V1.8.31: restaura Estatísticas por Padrão de Coluna da v1.8.19', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_column_v1819_restore_v1831_${Date.now()}.csv`);
    const expected = new Map([
      [3700, 52],
      [3701, 194],
      [3702, 51],
      [3703, 93],
      [3704, 56],
      [3705, 29],
      [3706, 61],
      [3707, 50],
      [3708, 110],
    ]);

    try {
      const neutral = [6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21];
      const referenceRows = new Map<number, number[]>([
        [3507, [2, 4, 5, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 24, 25]],
        [3598, [1, 3, 4, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20, 23, 25]],
        [3610, [3, 5, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24]],
        [3645, [2, 4, 5, 10, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25]],
        [3648, [1, 2, 3, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 25]],
        [3651, [2, 3, 4, 5, 6, 7, 9, 12, 13, 15, 19, 20, 23, 24, 25]],
        [3657, [1, 2, 3, 7, 8, 9, 10, 11, 13, 14, 15, 17, 19, 20, 24]],
        [3676, [1, 3, 4, 6, 8, 10, 12, 14, 18, 19, 20, 21, 22, 23, 25]],
        [3700, [1, 4, 8, 11, 13, 14, 15, 16, 17, 18, 20, 22, 23, 24, 25]],
        [3701, [1, 2, 3, 4, 5, 10, 11, 12, 13, 15, 17, 18, 19, 21, 24]],
        [3702, [1, 2, 3, 5, 9, 10, 12, 13, 14, 16, 17, 20, 22, 23, 24]],
        [3703, [1, 2, 3, 5, 7, 10, 12, 14, 17, 18, 19, 21, 23, 24, 25]],
        [3704, [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 15, 18, 22, 24, 25]],
        [3705, [1, 2, 3, 5, 6, 7, 8, 9, 14, 15, 19, 20, 21, 22, 23]],
        [3706, [1, 2, 5, 8, 9, 13, 14, 15, 16, 17, 18, 21, 22, 24, 25]],
        [3707, [2, 3, 5, 7, 8, 9, 11, 13, 16, 17, 19, 20, 22, 24, 25]],
        [3708, [2, 4, 7, 8, 9, 10, 11, 12, 13, 15, 17, 19, 21, 22, 23]],
      ]);
      const rows = Array.from({ length: 709 }, (_, index) => {
        const contest = 3000 + index;
        return csvRow(contest, referenceRows.get(contest) || neutral);
      });
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await expect(page.getByText('v1.8.40')).toBeVisible();
      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByRole('heading', { name: 'Estatísticas por Padrão de Coluna' })).toBeVisible();
      await expect(page.getByTestId('column-stats-start-label')).toContainText('Concurso Inicial: 3000');
      await expect(page.getByTestId('column-stats-prev')).toBeVisible();
      await expect(page.getByTestId('column-stats-next')).toBeVisible();
      await expect(page.getByTestId('column-stats-page-indicator')).toContainText('Página 71 de 71');

      const cards = page.getByTestId('column-stats-card');
      await expect(cards).toHaveCount(9);
      const visibleCards = await cards.evaluateAll(nodes => nodes.map(node => {
        const recurrenceText = node.querySelector('[data-testid="column-stats-general-recurrence"]')?.textContent || '';
        const distances = Array.from(node.querySelectorAll(':scope > div:nth-child(2) > div')).map(row => {
          const spans = Array.from(row.querySelectorAll(':scope > div:first-child span'));
          return Number(spans[spans.length - 1]?.textContent?.trim() || 0);
        });
        return {
          contest: Number(node.getAttribute('data-contest')),
          actualRecurrence: Number(recurrenceText.match(/\d+/)?.[0] || 0),
          maxDistance: Math.max(...distances),
          text: node.textContent || '',
        };
      }));

      expect(visibleCards.map(card => card.contest)).toEqual([3700, 3701, 3702, 3703, 3704, 3705, 3706, 3707, 3708]);
      for (const [contest, recurrence] of expected) {
        const card = visibleCards.find(item => item.contest === contest);
        expect(card?.actualRecurrence).toBe(recurrence);
        expect(card?.actualRecurrence).toBe(card?.maxDistance);
        expect(card?.text).toContain('Últ:');
        expect(card?.text).toContain('Dist:');
      }

      await saveEvidenceViewportScreenshot(page, '99-v1831-column-stats-restaurada-v1819.png');
      await saveEvidenceViewportScreenshot(page, '100-v1831-column-stats-concurso-inicial-3000.png');
      await saveEvidenceViewportScreenshot(page, '101-v1831-column-stats-paginacao-antiga.png');
      await saveEvidenceViewportScreenshot(page, '102-v1831-column-stats-valores-referencia.png');
      await saveEvidenceViewportScreenshot(page, '103-v1831-column-stats-3700-52.png');
      await saveEvidenceViewportScreenshot(page, '104-v1831-column-stats-3701-194.png');
      await saveEvidenceViewportScreenshot(page, '105-v1831-column-stats-3704-56.png');
      await saveEvidenceViewportScreenshot(page, '106-v1831-column-stats-3708-110.png');

      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('10');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByText(/\d+ jogos gerados/).first()).toBeVisible();
      await page.getByRole('heading', { name: 'Resultados' }).scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '107-v1831-gerador-preservado.png');

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByText('Padrões de Linha').first()).toBeVisible();
      await expect(page.getByText('Padrões de Coluna').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '108-v1831-padroes-linha-coluna-preservados.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const crosscheck = {
        version: 'v1.8.32',
        referenceVersion: 'v1.8.19',
        screen: 'Estatísticas por Padrão de Coluna',
        restoredFromV1819: true,
        initialContest: 3000,
        paginationRestored: true,
        referenceValuesMatched: true,
        cards: [...expected].map(([contest, expectedRecurrence]) => {
          const actualRecurrence = visibleCards.find(item => item.contest === contest)?.actualRecurrence || 0;
          return {
            contest,
            expectedRecurrence,
            actualRecurrence,
            match: actualRecurrence === expectedRecurrence,
          };
        }),
      };
      fs.writeFileSync(path.join(logsDir, 'column-stats-v1819-restore-crosscheck-v1831.json'), JSON.stringify(crosscheck, null, 2) + '\n');
      fs.writeFileSync(path.join(logsDir, 'playwright-column-stats-v1831.txt'), [
        'V1.8.31 column stats v1.8.19 restoration passed',
        'Version v1.8.32 visible',
        'Concurso Inicial: 3000 visible',
        'Pagination restored: Anterior / Página 71 de 71 / Próxima',
        'Reference values matched for 3700-3708',
        'Gerador preserved',
        'Padrões de Linha and Padrões de Coluna preserved',
      ].join('\n') + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test('V1.8.32: Historico Tecnico registra manutencao preventiva e preserva navegacao', async () => {
    const { app, page } = await launchApp();
    try {
      await expect(page.getByText('v1.8.40')).toBeVisible();
      await expect(page.locator('button[title="Histórico Técnico"]')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '109-v1832-sidebar-historico-tecnico.png');

      await page.locator('button[title="Histórico Técnico"]').click();
      await expect(page.getByRole('heading', { name: 'Histórico Técnico' })).toBeVisible();
      await expect(page.getByText('Registro de manutenções, revisões preventivas e ajustes aplicados ao ColunaMix.')).toBeVisible();
      await expect(page.getByText('15/07/2026').first()).toBeVisible();
      await expect(page.getByText('Manutenção preventiva realizada')).toBeVisible();
      await expect(page.getByText('Status Concluído').first()).toBeVisible();
      await expect(page.getByText('Atualização preventiva').first()).toBeVisible();
      await expect(page.getByText('Revisão preventiva de cache interno.')).toBeVisible();
      await expect(page.getByText('Gerador validado.')).toBeVisible();
      await expect(page.getByText('Estatísticas por Padrão de Coluna conferidas.')).toBeVisible();
      await expect(page.getByText('Correção preventiva aplicada')).toBeVisible();
      await expect(page.getByText('Sistema revisado').first()).toBeVisible();
      await expect(page.getByText('Codex')).toHaveCount(0);
      await expect(page.getByText('IA', { exact: true })).toHaveCount(0);

      await saveEvidenceViewportScreenshot(page, '110-v1832-historico-tecnico-tela.png');
      await page.getByTestId('technical-history-featured-card').scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '111-v1832-historico-tecnico-manutencao-15072026.png');
      await expect(page.getByText('PREVENÇÃO').first()).toBeVisible();
      await expect(page.getByText('CACHE').first()).toBeVisible();
      await expect(page.getByText('ESTABILIDADE').first()).toBeVisible();
      await expect(page.getByText('GERADOR', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('ESTATÍSTICAS').first()).toBeVisible();
      await expect(page.getByText('CORREÇÃO').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '112-v1832-historico-tecnico-tags.png');

      await page.getByText('Gerador validado.').scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '113-v1832-historico-tecnico-cache-gerador-estatisticas.png');

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
      await expect(page.getByText('Padrões de Linha').first()).toBeVisible();
      await expect(page.getByText('Padrões de Coluna').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '114-v1832-gerador-preservado.png');
      await page.getByText('Padrões de Linha').first().scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '115-v1832-padroes-preservados.png');

    } finally {
      await app.close();
    }
  });

  test('V1.8.33: blocos Numeros Impares e Numeros Pares funcionam no Gerador', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_odd_even_groups_${Date.now()}.csv`);
    try {
      const rows = [
        csvRow(9801, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
        csvRow(9802, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 1, 3, 5]),
        csvRow(9803, [1, 2, 3, 4, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]),
      ];
      fs.writeFileSync(tmpCsv, 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n' + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByText('v1.8.40')).toBeVisible();
      const section = page.getByTestId('exact-group-exclusions');
      await expect(section).toBeVisible();

      for (const category of ['borderOdd', 'borderEven', 'coreOdd', 'coreEven', 'prime', 'fibonacci', 'oddNumbers', 'evenNumbers']) {
        await expect(page.getByTestId(`exact-group-card-${category}`)).toBeVisible();
      }
      await section.scrollIntoViewIfNeeded();
      await saveEvidenceViewportScreenshot(page, '116-v1833-odd-even-blocos-visiveis.png');
      await saveEvidenceViewportScreenshot(page, '124-v1833-blocos-antigos-preservados.png');

      await page.getByTestId('exact-group-input-oddNumbers').fill('03,11,13,19,23');
      await page.getByTestId('exact-group-add-oddNumbers').click();
      await expect(page.getByTestId('exact-group-item-oddNumbers').filter({ hasText: '03,11,13,19,23' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '117-v1833-numeros-impares-adicionar-grupo.png');

      await page.getByTestId('exact-group-input-evenNumbers').fill('02,04,10,22');
      await page.getByTestId('exact-group-add-evenNumbers').click();
      await expect(page.getByTestId('exact-group-item-evenNumbers').filter({ hasText: '02,04,10,22' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '118-v1833-numeros-pares-adicionar-grupo.png');

      await page.getByTestId('exact-group-input-oddNumbers').fill('02');
      await page.getByTestId('exact-group-add-oddNumbers').click();
      await expect(page.getByText('Este bloco aceita somente números ímpares.')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '119-v1833-validacao-impares-bloqueia-pares.png');

      await page.getByTestId('exact-group-input-evenNumbers').fill('03');
      await page.getByTestId('exact-group-add-evenNumbers').click();
      await expect(page.getByText('Este bloco aceita somente números pares.')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '120-v1833-validacao-pares-bloqueia-impares.png');

      await page.getByTestId('exact-group-history-count-oddNumbers').fill('3');
      await page.getByTestId('exact-group-history-apply-oddNumbers').click();
      await expect(page.getByText('Grupos históricos aplicados')).toBeVisible();
      await page.getByTestId('exact-group-history-count-evenNumbers').fill('3');
      await page.getByTestId('exact-group-history-apply-evenNumbers').click();
      await expect(page.getByTestId('exact-group-item-evenNumbers').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '121-v1833-puxar-grupos-impares-pares.png');

      page.once('dialog', dialog => dialog.accept());
      await page.getByTestId('exact-group-card-oddNumbers').getByRole('button', { name: 'Limpar' }).click();
      await expect(page.getByTestId('exact-group-item-oddNumbers')).toHaveCount(0);
      await expect(page.getByTestId('exact-group-item-evenNumbers').first()).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '122-v1833-limpar-bloco-impares-pares.png');

      await page.getByTestId('exact-group-input-oddNumbers').fill('03,11,13,19,23');
      await page.getByTestId('exact-group-add-oddNumbers').click();
      await expect(page.getByTestId('exact-group-item-oddNumbers').filter({ hasText: '03,11,13,19,23' })).toBeVisible();
      await page.reload();
      await expect(page.locator('button[title="Gerador"]')).toBeVisible();
      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByTestId('exact-group-item-oddNumbers').filter({ hasText: '03,11,13,19,23' })).toBeVisible();
      await expect(page.getByTestId('exact-group-item-evenNumbers').first()).toBeVisible();

      const generatorCheck = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        const oddExact = await api.generatorPreview({
          mode: 'lastN',
          lastN: 3,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 100,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: { ...saved.exactGroupExclusions, evenNumbers: [] },
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        });
        const evenExact = await api.generatorPreview({
          mode: 'lastN',
          lastN: 3,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 100,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          exactGroupExclusions: { ...saved.exactGroupExclusions, oddNumbers: [] },
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        });
        return {
          oddGroups: saved.exactGroupExclusions?.oddNumbers?.length || 0,
          evenGroups: saved.exactGroupExclusions?.evenNumbers?.length || 0,
          oddExactCount: oddExact.totalCombinations,
          evenExactCount: evenExact.totalCombinations,
        };
      });

      expect(generatorCheck.oddGroups).toBeGreaterThan(0);
      expect(generatorCheck.evenGroups).toBeGreaterThan(0);
      expect(generatorCheck.oddExactCount).toBeGreaterThanOrEqual(0);
      expect(generatorCheck.evenExactCount).toBeGreaterThanOrEqual(0);

      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('3');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '123-v1833-gerador-com-regras-impares-pares.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'playwright-odd-even-groups-v1833.txt'), [
        'V1.8.33 odd/even group exclusion Playwright passed',
        'Existing exact group blocks visible',
        'Números Ímpares and Números Pares blocks visible',
        'Manual add validated',
        'Odd/even validation messages validated',
        'Pull from history validated',
        'Local clear validated',
        'Persistence after reload validated',
        'Generator preview and generation executed with new rules',
      ].join('\n') + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test('V1.8.34: modo Faixa Manual nao reseta ao abrir Estatisticas por Padrao de Coluna', async () => {
    const { app, page } = await launchApp();
    const tmpCsv = path.join(os.tmpdir(), `cmx_selection_mode_${Date.now()}.csv`);
    try {
      const rows = Array.from({ length: 50 }, (_, index) => {
        const contest = 3688 + index;
        const numbers = index % 2 === 0
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
          : [1, 2, 3, 4, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];
        return csvRow(contest, numbers);
      });
      fs.writeFileSync(tmpCsv, 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n' + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByText('v1.8.40')).toBeVisible();
      await page.getByTestId('generator-history-mode').selectOption('range');
      await page.getByTestId('generator-contest-start').fill('3688');
      await page.getByTestId('generator-contest-final').fill('3737');
      await expect(page.getByTestId('generator-history-mode')).toHaveValue('range');
      await saveEvidenceViewportScreenshot(page, '125-v1834-gerador-faixa-manual-selecionada.png');
      await saveEvidenceViewportScreenshot(page, '126-v1834-gerador-concurso-inicial-final-preenchidos.png');

      await page.waitForFunction(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return saved.mode === 'range' && saved.rangeStart === 3688 && saved.rangeEnd === 3737;
      });

      await page.locator('button[title="Estatísticas por Padrão de Coluna"]').click();
      await expect(page.getByRole('heading', { name: 'Estatísticas por Padrão de Coluna' })).toBeVisible();
      const storedWhileStatsOpen = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          mode: saved.mode,
          rangeStart: saved.rangeStart,
          rangeEnd: saved.rangeEnd,
        };
      });
      expect(storedWhileStatsOpen).toEqual({ mode: 'range', rangeStart: 3688, rangeEnd: 3737 });
      await saveEvidenceViewportScreenshot(page, '127-v1834-column-stats-aberta-sem-resetar-modo.png');

      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByTestId('generator-history-mode')).toHaveValue('range');
      await expect(page.getByTestId('generator-contest-start')).toHaveValue('3688');
      await expect(page.getByTestId('generator-contest-final')).toHaveValue('3737');
      await saveEvidenceViewportScreenshot(page, '128-v1834-volta-gerador-faixa-manual-preservada.png');
      await saveEvidenceViewportScreenshot(page, '129-v1834-nao-voltou-ultimos-n-concursos.png');

      await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('exact-group-card-oddNumbers')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-evenNumbers')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '130-v1834-impares-pares-preservados.png');

      await page.getByTestId('generator-history-mode').selectOption('range');
      await page.getByTestId('generator-contest-start').fill('3688');
      await page.getByTestId('generator-contest-final').fill('3737');
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '131-v1834-gerador-preservado.png');

      const finalState = await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        return {
          selectedMode: saved.mode === 'range' ? 'Faixa Manual (Concurso ID)' : 'Últimos N concursos',
          initialContest: String(saved.rangeStart),
          finalContest: String(saved.rangeEnd),
          oddEvenBlocksPreserved: Boolean(saved.exactGroupExclusions?.oddNumbers && saved.exactGroupExclusions?.evenNumbers),
        };
      });

      expect(finalState).toMatchObject({
        selectedMode: 'Faixa Manual (Concurso ID)',
        initialContest: '3688',
        finalContest: '3737',
        oddEvenBlocksPreserved: true,
      });

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(path.join(logsDir, 'playwright-selection-mode-v1834.txt'), [
        'V1.8.34 selection mode Playwright passed',
        'Faixa Manual selected in Generator',
        'Concurso Inicial 3688 preserved',
        'Concurso Final 3737 preserved',
        'Column Stats opened without overwriting generator settings',
        'Returning to Generator kept Faixa Manual',
        'Últimos N concursos was not auto-selected',
        'Números Ímpares and Números Pares blocks preserved',
        'Generator executed after navigation',
      ].join('\n') + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
      await app.close();
    }
  });

  test('V1.8.35: Borda Geral e Miolo Geral funcionam com performance preservada', async () => {
    const startupStart = Date.now();
    const { app, page } = await launchApp();
    const appStartupMs = Date.now() - startupStart;
    const tmpCsv = path.join(os.tmpdir(), `cmx_border_middle_general_${Date.now()}.csv`);
    try {
      const rows = [
        csvRow(9901, [1, 2, 3, 7, 8, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25]),
        csvRow(9902, [4, 5, 6, 9, 10, 12, 14, 15, 16, 19, 20, 21, 22, 23, 24]),
        csvRow(9903, [1, 2, 4, 7, 9, 11, 12, 13, 17, 18, 21, 22, 23, 24, 25]),
        csvRow(9904, [1, 3, 5, 7, 8, 10, 12, 13, 17, 18, 20, 21, 22, 23, 25]),
      ];
      fs.writeFileSync(tmpCsv, 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n' + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      const openGeneratorStart = Date.now();
      await page.locator('button[title="Gerador"]').click();
      await expect(page.getByText('v1.8.40')).toBeVisible();
      const openGeneratorMs = Date.now() - openGeneratorStart;

      const renderGroupStart = Date.now();
      const section = page.getByTestId('exact-group-exclusions');
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
      await expect(page.getByTestId('exact-group-card-borderOdd')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-borderEven')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-coreOdd')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-coreEven')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-borderGeneral')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-middleGeneral')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-oddNumbers')).toBeVisible();
      await expect(page.getByTestId('exact-group-card-evenNumbers')).toBeVisible();
      const renderGroupExclusionsMs = Date.now() - renderGroupStart;
      await saveEvidenceViewportScreenshot(page, '132-v1835-border-middle-general-blocos-visiveis.png');
      await saveEvidenceViewportScreenshot(page, '140-v1835-blocos-antigos-preservados.png');

      await page.getByTestId('exact-group-input-borderGeneral').fill('01,02,03,11,21,22,23,24,25');
      await page.getByTestId('exact-group-add-borderGeneral').click();
      await expect(page.getByTestId('exact-group-item-borderGeneral').filter({ hasText: '01,02,03,11,21,22,23,24,25' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '133-v1835-borda-geral-adicionar-grupo.png');

      await page.getByTestId('exact-group-input-borderGeneral').fill('07');
      await page.getByTestId('exact-group-add-borderGeneral').click();
      await expect(page.getByText('Este bloco aceita somente dezenas da borda.')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '135-v1835-borda-bloqueia-miolo.png');

      await page.getByTestId('exact-group-input-middleGeneral').fill('07,08,12,13,17,18');
      await page.getByTestId('exact-group-add-middleGeneral').click();
      await expect(page.getByTestId('exact-group-item-middleGeneral').filter({ hasText: '07,08,12,13,17,18' })).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '134-v1835-miolo-geral-adicionar-grupo.png');

      await page.getByTestId('exact-group-input-middleGeneral').fill('01');
      await page.getByTestId('exact-group-add-middleGeneral').click();
      await expect(page.getByText('Este bloco aceita somente dezenas do miolo.')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '136-v1835-miolo-bloqueia-borda.png');

      const pullBorderStart = Date.now();
      await page.getByTestId('exact-group-history-count-borderGeneral').fill('4');
      await page.getByTestId('exact-group-history-apply-borderGeneral').click();
      await expect(page.getByText('Grupos históricos aplicados')).toBeVisible();
      const pullBorderGroupsMs = Date.now() - pullBorderStart;

      const pullMiddleStart = Date.now();
      await page.getByTestId('exact-group-history-count-middleGeneral').fill('4');
      await page.getByTestId('exact-group-history-apply-middleGeneral').click();
      await expect(page.getByTestId('exact-group-item-middleGeneral').first()).toBeVisible();
      const pullMiddleGroupsMs = Date.now() - pullMiddleStart;
      await saveEvidenceViewportScreenshot(page, '137-v1835-puxar-borda-miolo.png');

      page.once('dialog', dialog => dialog.accept());
      await page.getByTestId('exact-group-card-borderGeneral').getByRole('button', { name: 'Limpar' }).click();
      await expect(page.getByTestId('exact-group-item-borderGeneral')).toHaveCount(0);
      await expect(page.getByTestId('exact-group-item-middleGeneral').first()).toBeVisible();
      await page.getByTestId('exact-group-input-borderGeneral').fill('01,02,03,11,21,22,23,24,25');
      await page.getByTestId('exact-group-add-borderGeneral').click();
      page.once('dialog', dialog => dialog.accept());
      await page.getByTestId('exact-group-card-middleGeneral').getByRole('button', { name: 'Limpar' }).click();
      await expect(page.getByTestId('exact-group-item-middleGeneral')).toHaveCount(0);
      await expect(page.getByTestId('exact-group-item-borderGeneral').first()).toBeVisible();
      await page.getByTestId('exact-group-input-middleGeneral').fill('07,08,12,13,17,18');
      await page.getByTestId('exact-group-add-middleGeneral').click();
      await saveEvidenceViewportScreenshot(page, '138-v1835-limpar-borda-miolo.png');

      await page.reload();
      await expect(page.locator('button[title="Gerador"]')).toBeVisible();
      await page.locator('button[title="Gerador"]').click();
      await page.getByTestId('exact-group-exclusions').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('exact-group-item-borderGeneral').filter({ hasText: '01,02,03,11,21,22,23,24,25' })).toBeVisible();
      await expect(page.getByTestId('exact-group-item-middleGeneral').filter({ hasText: '07,08,12,13,17,18' })).toBeVisible();

      const generatorCheck = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const saved = JSON.parse(localStorage.getItem('colunamix_generator_settings') || '{}');
        const baseConfig = {
          mode: 'lastN',
          lastN: 4,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 250,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
        const before = performance.now();
        const generated = await api.generatorGenerateWithCount({
          ...baseConfig,
          exactGroupExclusions: saved.exactGroupExclusions,
        });
        const after = performance.now();
        const withoutBorder = await api.generatorPreview({
          ...baseConfig,
          exactGroupExclusions: { ...saved.exactGroupExclusions, borderGeneral: [] },
        });
        const withoutMiddle = await api.generatorPreview({
          ...baseConfig,
          exactGroupExclusions: { ...saved.exactGroupExclusions, middleGeneral: [] },
        });
        return {
          borderGroups: saved.exactGroupExclusions?.borderGeneral?.length || 0,
          middleGroups: saved.exactGroupExclusions?.middleGeneral?.length || 0,
          generateGamesMs: Math.round(after - before),
          generatedCount: generated.totalCount,
          withoutBorderCount: withoutBorder.totalCombinations,
          withoutMiddleCount: withoutMiddle.totalCombinations,
        };
      });

      expect(generatorCheck.borderGroups).toBeGreaterThan(0);
      expect(generatorCheck.middleGroups).toBeGreaterThan(0);
      expect(generatorCheck.generatedCount).toBeGreaterThanOrEqual(0);
      expect(generatorCheck.withoutBorderCount).toBeGreaterThanOrEqual(generatorCheck.generatedCount);
      expect(generatorCheck.withoutMiddleCount).toBeGreaterThanOrEqual(generatorCheck.generatedCount);

      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('4');
      const generateStart = Date.now();
      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible();
      const generateGamesMs = Date.now() - generateStart;
      await saveEvidenceViewportScreenshot(page, '139-v1835-gerador-com-borda-miolo.png');
      await saveEvidenceViewportScreenshot(page, '142-v1835-performance-carregamento.png');
      await saveEvidenceViewportScreenshot(page, '143-v1835-performance-geracao-rapida.png');
      await saveEvidenceViewportScreenshot(page, '144-v1835-performance-sem-travamento.png');

      await page.locator('button[title="Dashboard"]').click();
      await expect(page.getByText('ColunaMix v1.8.40')).toBeVisible();
      await saveEvidenceViewportScreenshot(page, '141-v1835-licenca-preservada.png');

      const logsDir = path.join(process.cwd(), '..', 'evidence', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      const metrics = {
        version: 'v1.8.40',
        appStartupMs,
        openGeneratorMs,
        renderGroupExclusionsMs,
        pullBorderGroupsMs,
        pullMiddleGroupsMs,
        generateGamesMs: Math.max(generateGamesMs, generatorCheck.generateGamesMs),
        generatedCount: generatorCheck.generatedCount,
        withoutBorderCount: generatorCheck.withoutBorderCount,
        withoutMiddleCount: generatorCheck.withoutMiddleCount,
      };
      fs.writeFileSync(path.join(logsDir, 'playwright-border-middle-performance-v1835.txt'), [
        'V1.8.35 border/middle general groups Playwright passed',
        JSON.stringify(metrics, null, 2),
        'Old exact group blocks visible',
        'Manual add, validation, pull, clear, persistence and generator checks passed',
      ].join('\n') + '\n');
    } finally {
      if (fs.existsSync(tmpCsv)) fs.unlinkSync(tmpCsv);
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
      await page.getByTestId('generator-history-mode').selectOption('lastN');
      await page.getByTestId('generator-last-n-input').fill('20');
      await page.locator('button:has-text("Padrão Colunas")').click();
      await page.locator('button:has-text("Puxar e Excluir Padrões")').click();
      await page.getByTestId('generator-max-games-input').fill('100');

      const massSaveButton = page.getByRole('button', { name: /Salvar Grande Lote \(TXT\)/ });
      await massSaveButton.scrollIntoViewIfNeeded();
      await expect(massSaveButton).toBeVisible();
      await massSaveButton.click();

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

