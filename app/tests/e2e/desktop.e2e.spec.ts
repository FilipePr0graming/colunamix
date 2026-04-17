import path from 'path';
import { test, expect } from '@playwright/test';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const mainPath = path.join(process.cwd(), 'dist-electron', 'main', 'index.js');
  const app = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      APP_DEV_TOOLS: 'true',
      PW_TEST: 'true',
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
      await expect(page.locator('text=jogos gerados')).toBeVisible();

      await page.locator('text=Limpar Resultados').click();
      await expect(page.locator('text=jogos gerados')).toHaveCount(0);
    } finally {
      await app.close();
    }
  });
});
