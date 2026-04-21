import path from 'path';
import fs from 'fs';
import os from 'os';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

async function launchApp(extraEnv: Record<string, string> = {}): Promise<{ app: ElectronApplication; page: Page }> {
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
      ...process.env,
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
      await expect(page.locator('text=Resultados')).toBeVisible();

      await page.locator('button[title="Dashboard"]').click();
      await expect(page.locator('text=Status do Sistema')).toBeVisible();

      await page.locator('button[title="Estatísticas"]').click();
      await expect(
        page.locator('text=Estatísticas por Padrão de Coluna')
      ).toBeVisible();
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
      expect(result.patterns.some((item: { pattern: number[] }) => item.pattern.join(',') === '4,3,3,3,2')).toBeTruthy();
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

      await page.locator('button:has-text("Padrão Colunas")').click();
      await page.locator('button:has-text("Usar Somente")').click();
      await page.locator('input[placeholder="Ex: 43332"]').fill('33333');
      await page.locator('button:has-text("ADICIONAR")').click();

      await page.locator('button:has-text("Modo Excluir")').click();
      await page.locator('button:has-text("Puxar e Excluir Padrões")').click();

      await page.locator('button:has-text("GERAR JOGOS")').click();
      await expect(page.locator('text=Nenhum jogo gerado')).toBeVisible();
    } finally {
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
