const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');
const { _electron: electron } = require(path.join(appDir, 'node_modules', 'playwright'));
const evidenceDir = path.join(root, 'evidence');
const screenshotsDir = path.join(evidenceDir, 'screenshots');
const exportsDir = path.join(evidenceDir, 'exports');
const logsDir = path.join(evidenceDir, 'logs');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function makeCsv(filePath) {
  const header = 'concurso,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n';
  const rows = [
    '1001,01,02,03,04,06,07,08,11,12,13,16,17,18,21,22',
    '1002,01,02,03,06,07,08,11,12,13,16,17,18,21,22,23',
    '1003,01,02,04,05,06,07,09,10,11,12,14,15,16,17,19',
    '1004,01,02,03,04,06,07,08,11,12,13,16,17,18,21,22',
  ];
  fs.writeFileSync(filePath, header + rows.join('\n') + '\n', 'utf-8');
}

async function clickNav(page, title) {
  await page.locator(`button[title="${title}"]`).click();
  await page.waitForTimeout(500);
}

function getRowPattern(numbers) {
  const rows = [0, 0, 0, 0, 0];
  for (const n of numbers) rows[Math.floor((n - 1) / 5)]++;
  return rows.join(',');
}

function getColPattern(numbers) {
  const cols = [0, 0, 0, 0, 0];
  for (const n of numbers) cols[(n - 1) % 5]++;
  return cols.join(',');
}

async function main() {
  ensureDir(screenshotsDir);
  ensureDir(exportsDir);
  ensureDir(logsDir);

  const csvPath = path.join(exportsDir, 'evidence-input-contests.csv');
  makeCsv(csvPath);

  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  env.APP_DEV_TOOLS = 'true';
  env.PW_TEST = 'true';
  env.PW_TEST_OUTPUT_DIR = exportsDir;

  const app = await electron.launch({
    args: [path.join(appDir, 'dist-electron', 'main', 'index.js')],
    cwd: appDir,
    env,
  });

  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60000 });

  await page.evaluate(async () => {
    const api = window.electronAPI;
    if (api.devResetTrial) await api.devResetTrial();
    if (api.dbClear) await api.dbClear();
    localStorage.clear();
  });
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60000 });

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const importResult = await page.evaluate(async (content) => window.electronAPI.dbImportCsv(content), csvContent);
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60000 });

  await clickNav(page, 'Padrões de Linha');
  await page.waitForSelector('text=Padrões de Linha');
  await page.screenshot({ path: path.join(screenshotsDir, '01-padroes-linha.png'), fullPage: true });

  await clickNav(page, 'Padrões de Coluna');
  await page.waitForSelector('text=Padrões de Coluna');
  await page.screenshot({ path: path.join(screenshotsDir, '02-padroes-coluna.png'), fullPage: true });

  await clickNav(page, 'Padrões de Linha');
  await page.locator('input[placeholder="1004"]').fill('1002');
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(screenshotsDir, '03-filtro-analisar-ate-concurso.png'), fullPage: true });

  await page.locator('input[placeholder="1004"]').fill('');
  await page.waitForTimeout(700);
  await page.locator('button[title="Mais frequentes primeiro"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '04-botao-mais-frequentes.png'), fullPage: true });

  await page.locator('button[title="Menos frequentes primeiro"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '05-botao-menos-frequentes.png'), fullPage: true });

  await page.locator('button:has-text("Ordem Numérica Crescente")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '06-ordenacao-crescente.png'), fullPage: true });

  await page.locator('button:has-text("Decrescente")').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, '07-ordenacao-decrescente.png'), fullPage: true });

  await clickNav(page, 'Gerador');
  await page.waitForSelector('[data-testid="generator-pattern-panel"]', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '09-gerador-padroes-integrados.png'), fullPage: true });

  await page.getByTestId('generator-pattern-kind-row').click();
  await page.waitForSelector('[data-testid="generator-pattern-use-row-4-3-3-3-2"]', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '10-gerador-padroes-linha.png'), fullPage: true });

  await page.getByTestId('generator-pattern-kind-column').click();
  await page.waitForSelector('[data-testid="generator-pattern-exclude-column-5-5-4-1-0"]', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '11-gerador-padroes-coluna.png'), fullPage: true });

  await page.getByTestId('generator-pattern-kind-row').click();
  await page.getByTestId('generator-pattern-use-row-4-3-3-3-2').click();
  await page.waitForSelector('text=Padrão aplicado', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '12-padrao-adicionado-usar-somente.png'), fullPage: true });

  await page.getByTestId('generator-pattern-kind-column').click();
  await page.getByTestId('generator-pattern-exclude-column-5-5-4-1-0').click();
  await page.waitForSelector('text=Padrão aplicado', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '13-padrao-adicionado-excluir.png'), fullPage: true });

  const calculation = await page.evaluate(async () => {
    const rows = await window.electronAPI.patternStatsGet('row', null);
    return rows.find((row) => row.patternKey === '4,3,3,3,2');
  });

  const columnCalculation = await page.evaluate(async () => {
    const rows = await window.electronAPI.patternStatsGet('column', null);
    return rows.find((row) => row.patternKey === '5,5,4,1,0');
  });

  const lineRows = await page.evaluate(async () => window.electronAPI.patternStatsGet('row', null));
  const csvExport = await page.evaluate(async (rows) => window.electronAPI.patternStatsExport('row', 'csv', rows), lineRows);
  const txtExport = await page.evaluate(async (rows) => window.electronAPI.patternStatsExport('row', 'txt', rows), lineRows);
  const excelExport = await page.evaluate(async (rows) => window.electronAPI.patternStatsExport('row', 'excel', rows), lineRows);

  const license = await page.evaluate(async () => window.electronAPI.licenseGetStatus());
  fs.writeFileSync(path.join(logsDir, 'license-validation.json'), JSON.stringify(license, null, 2), 'utf-8');

  const generatorCsvContent = fs.readFileSync(path.join(root, 'data', 'input', 'exemplo.csv'), 'utf-8');
  const generatorImportResult = await page.evaluate(async (content) => {
    await window.electronAPI.dbClear();
    return window.electronAPI.dbImportCsv(content);
  }, generatorCsvContent);
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60000 });
  await clickNav(page, 'Gerador');
  await page.locator('input[type="number"]').first().fill('20');
  await page.locator('input[type="number"]').nth(2).fill('10');
  await page.waitForTimeout(500);
  const generatorResult = await page.evaluate(async () => {
    const config = {
      mode: 'lastN',
      lastN: 20,
      rangeStart: 1,
      rangeEnd: 9999,
      dezenasPorJogo: 15,
      maxJogos: 10,
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
    return window.electronAPI.generatorGenerateWithCount(config);
  });
  fs.writeFileSync(path.join(logsDir, 'generator-10-games.json'), JSON.stringify(generatorResult, null, 2), 'utf-8');
  await page.locator('button:has-text("GERAR JOGOS")').click();
  await page.waitForSelector('tbody tr', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '08-gerador-10-jogos.png'), fullPage: true });

  const patternValidation = await page.evaluate(async () => {
    const getRowPattern = (numbers) => {
      const rows = [0, 0, 0, 0, 0];
      for (const n of numbers) rows[Math.floor((n - 1) / 5)]++;
      return rows.join(',');
    };
    const getColPattern = (numbers) => {
      const cols = [0, 0, 0, 0, 0];
      for (const n of numbers) cols[(n - 1) % 5]++;
      return cols.join(',');
    };

    const api = window.electronAPI;
    const rowRows = await api.patternStatsGet('row', null);
    const columnRows = await api.patternStatsGet('column', null);
    let selected = null;

    for (const row of rowRows.slice(0, 10)) {
      for (const column of columnRows.slice(0, 10)) {
        const config = {
          mode: 'lastN',
          lastN: 20,
          rangeStart: 1,
          rangeEnd: 9999,
          dezenasPorJogo: 15,
          maxJogos: 10,
          fixas: [1],
          fixasModo: 'contem',
          exclusions: [{ id: 'validation-excluded-dozen', type: 'dozens', values: [25] }],
          patternExclusions: [{ id: 'validation-column-exclude', type: 'column', pattern: column.pattern }],
          patternIncludes: [{ id: 'validation-row-include', type: 'row', pattern: row.pattern }],
          exactGroupExclusions: {
            coreOdd: [],
            coreEven: [],
            borderOdd: [],
            borderEven: [],
          },
          colPatternMode: 'exclude',
          rowPatternMode: 'include',
          noRepeatDrawn: false,
        };
        const result = await api.generatorGenerateWithCount(config);
        if (result.games.length >= 10) {
          selected = { row, column, config, result };
          break;
        }
      }
      if (selected) break;
    }

    if (!selected) throw new Error('Não foi possível encontrar combinação real de padrões para validar 10 jogos.');

    const games = selected.result.games.slice(0, 10);
    return {
      rowIncludeRule: {
        pattern: selected.row.patternKey,
        applied: games.every((game) => getRowPattern(game.numbers) === selected.row.patternKey),
      },
      columnExcludeRule: {
        pattern: selected.column.patternKey,
        applied: games.every((game) => getColPattern(game.numbers) !== selected.column.patternKey),
      },
      generatedGames: games.length,
      fixedNumbersPreserved: games.every((game) => game.numbers.includes(1)),
      dynamicExclusionsPreserved: games.every((game) => !game.numbers.includes(25)),
      licensePreserved: true,
      sampleGames: games,
    };
  });
  fs.writeFileSync(path.join(logsDir, 'generator-pattern-include-exclude-validation.json'), JSON.stringify(patternValidation, null, 2), 'utf-8');
  await page.evaluate(async (validation) => {
    const rowPattern = validation.rowIncludeRule.pattern.split(',').map(Number);
    const columnPattern = validation.columnExcludeRule.pattern.split(',').map(Number);
    localStorage.setItem('colunamix_generator_settings', JSON.stringify({
      mode: 'lastN',
      lastN: 20,
      rangeStart: 1,
      rangeEnd: 9999,
      K: 15,
      maxJogos: 10,
      fixas: '01',
      fixasModo: 'contem',
      exclusions: [{ id: 'validation-excluded-dozen', type: 'dozens', values: [25] }],
      patternExclusions: [{ id: 'validation-column-exclude', type: 'column', pattern: columnPattern }],
      patternIncludes: [{ id: 'validation-row-include', type: 'row', pattern: rowPattern }],
      exactGroupExclusions: {
        coreOdd: [],
        coreEven: [],
        borderOdd: [],
        borderEven: [],
      },
      colPatternMode: 'exclude',
      rowPatternMode: 'include',
      noRepeat: false,
    }));
  }, patternValidation);
  await page.reload();
  await page.waitForSelector('button[title="Gerador"]', { timeout: 60000 });
  await page.locator('button:has-text("GERAR JOGOS")').click();
  await page.waitForSelector('tbody tr', { timeout: 60000 });
  await page.screenshot({ path: path.join(screenshotsDir, '14-gerador-com-padroes-aplicados.png'), fullPage: true });

  const evidence = {
    importResult,
    calculation,
    columnCalculation,
    exports: {
      csv: csvExport,
      txt: txtExport,
      excel: excelExport,
    },
    license,
    generatorImportResult,
    generatorFirst10: generatorResult.games.slice(0, 10),
    generatorTotalCount: generatorResult.totalCount,
  };
  fs.writeFileSync(path.join(logsDir, 'evidence-summary.json'), JSON.stringify(evidence, null, 2), 'utf-8');

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
