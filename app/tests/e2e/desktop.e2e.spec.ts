import path from 'path';
import fs from 'fs';
import os from 'os';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

async function launchApp(extraEnv: Record<string, string> = {}): Promise<{ app: ElectronApplication; page: Page }> {
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;

  const releaseDir = path.join(process.cwd(), 'release');
  const unpackedExe = path.join(releaseDir, 'win-unpacked', 'ColunaMix.exe');
  const releaseExe = fs.existsSync(unpackedExe)
    ? unpackedExe
    : (fs.existsSync(releaseDir)
        ? fs.readdirSync(releaseDir).find((name) => /^ColunaMix-v.+\.exe$/i.test(name))
        : null);
  const packagedPath = process.env.PW_TEST_USE_PACKAGED === 'true' && releaseExe
    ? path.resolve(releaseExe)
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

      await page.locator('button[title="Estatísticas"]').click();
      await expect(
        page.locator('text=Importe concursos para visualizar as estatísticas.').or(page.locator('text=Estatísticas por Padrão de Coluna'))
      ).toBeVisible();
    } finally {
      await app.close();
    }
  });

  test('RADAR HISTÓRICO AVANÇADO: mostra card bloqueado e modal informativo sem links externos', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Gerador"]').click();

      const card = page.getByTestId('locked-radar-card');
      await expect(card).toBeVisible();
      await expect(card).toContainText('Radar Histórico Avançado');
      await expect(card).toContainText('Módulo avançado');
      await expect(card).toContainText('Cruze configurações personalizadas com o histórico de concursos');

      const beforeUrl = page.url();
      await page.getByTestId('locked-radar-details').click();

      const modal = page.getByTestId('locked-radar-modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('heading', { name: 'Radar Histórico Avançado' })).toBeVisible();
      await expect(modal).toContainText('Este módulo permitirá cruzar configurações personalizadas com o histórico de concursos');
      await expect(modal).toContainText('Buscar concursos por configuração personalizada');
      await expect(modal).toContainText('Filtrar por pares e ímpares');
      await expect(modal).toContainText('Filtrar por dezenas na borda');
      await expect(modal).toContainText('Filtrar por números primos');
      await expect(modal).toContainText('Analisar sequências entre dezenas');
      await expect(modal).toContainText('Mostrar atraso atual');
      await expect(modal).toContainText('Módulo avançado disponível para desenvolvimento futuro.');

      const externalTargets = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="locked-radar-modal"]');
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

      await page.getByTestId('locked-radar-contact').click();
      await expect(page.getByTestId('locked-radar-contact-message')).toHaveText(
        'Para ativar este módulo, entre em contato com o desenvolvedor responsável pelo sistema.'
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

  test('MODO INTELIGENTE: ativa, mostra sugestões, gera jogos e exibe score', async () => {
    const { app, page } = await launchApp();
    try {
      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), '..', 'data', 'input', 'exemplo.csv'));
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await page.locator('[data-testid="smart-mode-toggle"] input').check({ force: true });

      await expect(page.locator('text=Padrões recomendados')).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('text=Score médio esperado').first()).toBeVisible();

      await page.locator('button:has-text("Gerar Inteligente")').click();
      await expect(page.locator('text=Modo Inteligente aplicado')).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('text=Score:').first()).toBeVisible();
      await expect(page.locator('text=Erro na Geração')).toHaveCount(0);
    } finally {
      await app.close();
    }
  });

  test('MODO INTELIGENTE - POUCOS DADOS: mantém sugestões conservadoras e não trava UI', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_smart_few_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const rows = [
        '7001,01,02,03,06,07,08,11,12,13,16,17,18,21,22,23',
        '7002,01,02,04,06,07,09,11,12,14,16,17,19,21,22,24',
        '7003,02,03,05,07,08,10,12,13,15,17,18,20,22,23,25',
      ];
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      await page.locator('button[title="Gerador"]').click();
      await page.locator('input[type="number"]').first().fill('3');
      await page.locator('[data-testid="smart-mode-toggle"] input').check({ force: true });
      await expect(page.locator('text=Base pequena')).toBeVisible({ timeout: 20_000 });
      await page.locator('button:has-text("Gerar Inteligente")').click();

      await expect(
        page.locator('text=Modo Inteligente aplicado').or(page.locator('text=Nenhum jogo gerado pelo Modo Inteligente'))
      ).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('button:has-text("GERAR JOGOS")')).toBeEnabled();
    } finally {
      await app.close();
    }
  });

  test('MODO INTELIGENTE - HISTÓRICO GRANDE: análise e geração retornam scores consistentes', async () => {
    const { app, page } = await launchApp();
    try {
      const tmpCsv = path.join(os.tmpdir(), `cmx_smart_large_${Date.now()}.csv`);
      const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
      const patterns = [
        '01,02,03,06,07,08,11,12,13,16,17,18,21,22,23',
        '01,02,04,06,07,09,11,12,14,16,17,19,21,22,24',
        '02,03,05,07,08,10,12,13,15,17,18,20,22,23,25',
        '01,03,04,06,08,09,11,13,14,16,18,19,21,23,24',
      ];
      const rows: string[] = [];
      for (let i = 0; i < 180; i++) rows.push(`${8000 + i},${patterns[i % patterns.length]}`);
      fs.writeFileSync(tmpCsv, header + rows.join('\n') + '\n', 'utf-8');

      await page.locator('button[title="Dados"]').click();
      await page.locator('input[type="file"]').setInputFiles(tmpCsv);
      await expect(page.locator('text=importado')).toBeVisible();

      const result = await page.evaluate(async () => {
        const api = (window as any).electronAPI;
        const config = {
          mode: 'lastN',
          lastN: 80,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 25,
          fixas: [],
          fixasModo: 'contem',
          exclusions: [],
          patternExclusions: [],
          patternIncludes: [],
          colPatternMode: 'exclude',
          rowPatternMode: 'exclude',
          noRepeatDrawn: false,
        };
        return await api.smartModeGenerate(config, 120);
      });

      expect(result.analysis.drawsAnalyzed).toBe(120);
      expect(result.suggestions.recommendedPatterns.length).toBeGreaterThan(0);
      expect(result.suggestions.expectedAverageScore).toBeGreaterThan(0);
      expect(result.games.length).toBeGreaterThan(0);
      expect(result.games.every((game: { score: number }) => game.score >= 0 && game.score <= 100)).toBeTruthy();
    } finally {
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
