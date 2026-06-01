# PATCHES APPLIED - ColunaMix

## Resumo

Foi implementado o módulo profissional de análise estatística por padrões de linha e padrões de coluna, substituindo o antigo Modo Inteligente no fluxo principal da aplicação.

Também foi gerado o executável final Windows `.exe` para distribuição ao cliente. A publicação automática no GitHub Releases não foi realizada porque o GitHub CLI (`gh`) não está instalado neste ambiente; as instruções manuais foram criadas em `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`.

## Funcionalidades implementadas

- Remoção/substituição do Modo Inteligente
- Aba Padrões de Linha
- Aba Padrões de Coluna
- Cálculo de ocorrências
- Cálculo de último concurso
- Cálculo de atraso
- Cálculo de percentual
- Campo Analisar até concurso X
- Ordenação crescente
- Ordenação decrescente
- Ordenação por mais frequentes
- Ordenação por menos frequentes
- Filtros avançados:
  - somente atrasados
  - mínimo de ocorrências
  - percentual mínimo
- Exportação CSV
- Exportação TXT
- Exportação Excel/XLS
- Cache/memoização no cálculo de padrões
- Geração do executável Windows `.exe`
- Preservação do gerador
- Preservação da licença/trial
- Preservação da importação CSV/base histórica
- Preservação das exclusões
- Preservação das dezenas fixas

## Arquivos alterados

- `app/package.json`
- `app/package-lock.json`
- `app/src/main/ipc-handlers.ts`
- `app/src/preload/index.ts`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/components/PatternStatsPage.tsx`
- `app/src/shared/patternStats.ts`
- `app/src/shared/types.ts`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `app/tests/unit/patternStats.spec.ts`
- `PATCHES-APPLIED.md`
- `TEST-REPORT.md`
- `scripts/generate-evidence.js`

Arquivos removidos por substituição do módulo antigo:

- `app/src/core/smart-mode/analyzer.ts`
- `app/src/core/smart-mode/memory.ts`
- `app/src/core/smart-mode/scoring.ts`
- `app/src/core/smart-mode/suggestions.ts`
- `app/src/core/smart-mode/types.ts`

## Executável gerado

- Versão: `v1.8.21`
- Nome do arquivo: `ColunaMix-v1.8.21.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.21.exe`
- Tamanho: `74267701` bytes
- SHA256: `6ac796ee85bbfb5689c22c9b02c40eb915e82e00c344a3c7f4a3099986d00d12`
- Comando usado: `npm run dist`
- Log do build do `.exe`: `evidence/logs/npm-run-dist.txt`
- Dados do executável: `evidence/logs/exe-build-info.json`

## Status da publicação no GitHub Release

- Release pretendida: `v1.8.21`
- Asset obrigatório: `ColunaMix-v1.8.21.exe`
- Publicação automática via GitHub Actions: realizada
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.21
- Asset publicado: `ColunaMix-v1.8.21.exe`
- Observação: o GitHub CLI (`gh`) não está instalado localmente; a publicação foi feita pelo workflow do repositório acionado pela tag `v1.8.21`.
- Instruções manuais mantidas como fallback em: `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`
- Página de releases: https://github.com/FilipePr0graming/colunamix/releases

## Evidências

Prints:

- `evidence/screenshots/01-padroes-linha.png`
- `evidence/screenshots/02-padroes-coluna.png`
- `evidence/screenshots/03-filtro-analisar-ate-concurso.png`
- `evidence/screenshots/04-botao-mais-frequentes.png`
- `evidence/screenshots/05-botao-menos-frequentes.png`
- `evidence/screenshots/06-ordenacao-crescente.png`
- `evidence/screenshots/07-ordenacao-decrescente.png`
- `evidence/screenshots/08-gerador-10-jogos.png`

Logs:

- `evidence/logs/npm-run-build.txt`
- `evidence/logs/npm-run-test-unit.txt`
- `evidence/logs/npm-run-test-e2e.txt`
- `evidence/logs/npm-run-dist.txt`
- `evidence/logs/real-base-pattern-example.json`
- `evidence/logs/license-validation.json`
- `evidence/logs/generator-10-games.json`
- `evidence/logs/exe-build-info.json`

Exportações:

- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215525.csv`
- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215532.txt`
- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215537.xls`

## Compatibilidade preservada

Preservados explicitamente:

- Gerador
- Licença
- Trial
- CSV
- Importação
- Exportação
- Exclusões dinâmicas
- Exclusão por dezenas
- Exclusão por grupo
- Dezenas fixas
- Base histórica

## Ajuste pós-feedback do cliente - padrões dentro do Gerador

Cliente Anderson solicitou que os padrões de linha e coluna ficassem dentro da tela do Gerador, no mesmo local onde ficava o antigo Modo Inteligente / Radar Histórico Avançado, para visualizar e aplicar os padrões sem sair do fluxo principal.

Alterações aplicadas:

- Painel `Padrões Inteligentes` inserido dentro do Gerador no local do antigo Radar Histórico Avançado.
- Padrões de Linha e Padrões de Coluna disponíveis no próprio Gerador com alternância interna.
- Ações de 1 clique adicionadas:
  - `Usar`: envia o padrão para o painel de usar somente.
  - `Excluir`: envia o padrão para o painel de excluir padrões.
- Conflitos tratados automaticamente: ao usar um padrão que estava em excluir, ele é movido para usar; ao excluir um padrão que estava em usar, ele é movido para excluir.
- O gerador passou a consumir diretamente os padrões selecionados no painel integrado.
- As abas separadas `Padrões de Linha` e `Padrões de Coluna` foram preservadas.
- Gerador, licença, trial, importação, exportação, exclusões, exclusão por grupo e dezenas fixas foram preservados.
- Nova versão preparada: `v1.8.21`.
- Novo executável gerado: `app/release/ColunaMix-v1.8.21.exe`.
- SHA256: `6ac796ee85bbfb5689c22c9b02c40eb915e82e00c344a3c7f4a3099986d00d12`.

Novos arquivos principais:

- `app/src/shared/patternRules.ts`
- `app/tests/unit/patternRules.spec.ts`
- `RELEASE-NOTES.md`

Novas evidências:

- `evidence/screenshots/09-gerador-padroes-integrados.png`
- `evidence/screenshots/10-gerador-padroes-linha.png`
- `evidence/screenshots/11-gerador-padroes-coluna.png`
- `evidence/screenshots/12-padrao-adicionado-usar-somente.png`
- `evidence/screenshots/13-padrao-adicionado-excluir.png`
- `evidence/screenshots/14-gerador-com-padroes-aplicados.png`
- `evidence/logs/npm-run-build-after-generator-patterns.txt`
- `evidence/logs/npm-run-test-unit-after-generator-patterns.txt`
- `evidence/logs/npm-run-test-e2e-after-generator-patterns.txt`
- `evidence/logs/generator-pattern-include-exclude-validation.json`
- `evidence/logs/exe-build-info-v1.8.21.json`

## Status final

Entrega validada com build, testes unitários, testes E2E, prints, logs, exportações, exemplos reais de cálculo e executável Windows `.exe` gerado para distribuição.

