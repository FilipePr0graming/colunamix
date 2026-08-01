## Restauração v1.8.36 - Acessos Padrões de Linha/Coluna

### O que estava presente na v1.8.23

- A sidebar tinha acessos laterais separados para `Padrões de Linha` e `Padrões de Coluna`.
- Esses acessos renderizavam `PatternStatsPage.tsx` com `kind="row"` e `kind="column"`.
- O Painel de Padrões dentro do Gerador já tinha botões individuais `U` e `X`.

### O que estava ausente na versão atual

- Na v1.8.35, os acessos laterais `Padrões de Linha` e `Padrões de Coluna` não estavam mais conectados em `App.tsx`.
- O componente `PatternStatsPage.tsx` ainda existia, mas não era alcançável pela navegação principal.

### Arquivos alterados

- `app/src/renderer/App.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `app/package.json`
- `app/package-lock.json`
- `PATCHES-APPLIED.md`
- `TEST-REPORT.md`
- `docs/PATCHES-APPLIED.md`
- `docs/TEST-REPORT.md`

### Confirmações

- `Padrões de Linha` restaurado na sidebar.
- `Padrões de Coluna` restaurado na sidebar.
- `Padrões de Linha` abre a tela de análise de padrões de linha.
- `Padrões de Coluna` abre a tela de análise de padrões de coluna.
- Não foi implementado botão `adicionar todos`.
- Não foi implementada ação em massa de padrões filtrados.
- A ordem dos quadros de exclusão não foi alterada.
- Botões individuais `U` e `X` continuam aparecendo no Painel de Padrões do Gerador.
- Botão `Puxar e Excluir Padrões` continua aparecendo.
- Gerador continua abrindo e gerando jogos.

### Validação

- Build: aprovado, `evidence/logs/npm-run-build-v1836.txt`.
- Unitários: aprovado, `79 passed`, `evidence/logs/npm-run-test-unit-v1836.txt`.
- Playwright dedicado: aprovado, `1 passed`, `evidence/logs/playwright-restore-pattern-sidebar-tabs-v1836.txt`.
- E2E completo: aprovado, `20 passed`, `7 skipped`, `evidence/logs/npm-run-test-e2e-v1836.txt`.
- Primeira execução E2E teve falha de asserção em estado sem dados; causa raiz registrada em `evidence/logs/restore-pattern-sidebar-tabs-v1836-root-cause.md` e execução final aprovada.

### Prints

- `evidence/screenshots/145-v1836-sidebar-padroes-linha-restaurado.png`
- `evidence/screenshots/146-v1836-sidebar-padroes-coluna-restaurado.png`
- `evidence/screenshots/147-v1836-tela-padroes-linha-aberta.png`
- `evidence/screenshots/148-v1836-tela-padroes-coluna-aberta.png`
- `evidence/screenshots/149-v1836-botoes-u-x-preservados.png`
- `evidence/screenshots/150-v1836-gerador-preservado.png`

### Executável

- Arquivo: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.36.exe`
- SHA256: `984858294F84CDB4B6A032CF31ABD65714DA28923BA1444EDA90F8A3C88991BA`
- Metadados: `evidence/logs/exe-build-info-v1.8.36.json`

### Publicação

- Commit: `bcba371`
- Push: `origin/main` atualizado.
- Tag: `v1.8.36` enviada para `origin`.
- Release: bloqueada neste ambiente. `gh` não está instalado, `GITHUB_TOKEN/GH_TOKEN` não estão disponíveis e a API pública retornou `404` para `releases/tags/v1.8.36`.

### Risco técnico

Baixo. A alteração restaura navegação/layout e reaproveita `PatternStatsPage.tsx` existente. Não houve alteração na regra do Gerador, em U/X, em `Puxar e Excluir Padrões`, em Borda/Miolo Geral, em Ímpares/Pares, em Primos/Fibonacci ou na ordem dos quadros de exclusão.
