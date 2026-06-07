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

## Atualização v1.8.22 - Busca por variações de padrões

Implementada a busca por variações/permutação de padrões solicitada pelo cliente Anderson.

Alterações aplicadas:

- A busca não compara apenas texto exato.
- O sistema cria uma chave canônica ordenando numericamente os valores do padrão.
- Padrões com a mesma composição aparecem mesmo em ordens diferentes.
- Repetições são respeitadas na comparação por multiconjunto.
- Funciona para Padrões de Linha.
- Funciona para Padrões de Coluna.
- Funciona no painel integrado ao Gerador.
- Campo `Busca` adicionado ao painel de padrões dentro do Gerador.
- Entradas inválidas não travam a tela.
- Formatos com vírgula, espaço e compacto foram validados.
- Gerador, licença, trial, importação, exportação, exclusões e dezenas fixas foram preservados.

Arquivos alterados nesta atualização:

- `app/package.json`
- `app/package-lock.json`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/components/PatternStatsPage.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/src/shared/patternStats.ts`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `app/tests/unit/patternStats.spec.ts`
- `RELEASE-NOTES.md`
- `TEST-REPORT.md`
- `PATCHES-APPLIED.md`
- `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`

Novas evidências:

- `evidence/screenshots/15-busca-variacoes-linha.png`
- `evidence/screenshots/16-busca-variacoes-coluna.png`
- `evidence/screenshots/17-busca-variacoes-gerador.png`
- `evidence/screenshots/18-busca-variacoes-usar-padrao.png`
- `evidence/screenshots/19-busca-variacoes-excluir-padrao.png`
- `evidence/logs/npm-run-build-after-variation-search.txt`
- `evidence/logs/npm-run-test-unit-after-variation-search.txt`
- `evidence/logs/npm-run-test-e2e-after-variation-search.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.22.txt`
- `evidence/logs/npm-run-dist-v1.8.22.txt`
- `evidence/logs/pattern-variation-search-validation.json`
- `evidence/logs/exe-build-info-v1.8.22.json`

Executável v1.8.22:

- Versão: `v1.8.22`
- Nome do arquivo: `ColunaMix-v1.8.22.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.22.exe`
- Tamanho: `74268761` bytes
- SHA256: `54bd9998147bd48f519091cb17d0a9f4c4f58bbe86dea6ea7686049dda414e4e`
- Comando usado: `npm run dist`
- Log do build do `.exe`: `evidence/logs/npm-run-dist-v1.8.22.txt`
- Dados do executável: `evidence/logs/exe-build-info-v1.8.22.json`

Status da publicação GitHub v1.8.22:

- Release alvo: `v1.8.22`
- Asset obrigatório: `ColunaMix-v1.8.22.exe`
- Publicação automática via GitHub Actions: realizada.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.22
- Asset publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.22/ColunaMix-v1.8.22.exe
- Tamanho do asset publicado: `74245581` bytes
- SHA256 do asset publicado: `26d954510fd5bd63a8390fe92dae40f62cf9e9de0ac3757c81a4ca22f69fd712`
- Workflow: https://github.com/FilipePr0graming/colunamix/actions/runs/27078235275
- Dados da publicação: `evidence/logs/github-release-v1.8.22.json`

## Status final

Entrega validada com build, testes unitários, testes E2E local, testes E2E no executável empacotado, prints, logs, exportações, exemplos reais de cálculo e executável Windows `.exe` v1.8.22 gerado para distribuição.

## Correção v1.8.23 - Painel de padrões conforme PDF do cliente

Cliente Anderson testou a v1.8.22 e informou que o layout ainda estava incorreto, permanecendo em cards dentro do Gerador.

Alterações aplicadas:

- Painel anterior em cards foi removido/substituído.
- Novo painel foi colocado no Gerador, no local do antigo Modo Inteligente/Radar Histórico.
- Padrões de Linha e Padrões de Coluna agora aparecem lado a lado.
- Implementada tabela compacta com scroll interno em cada painel.
- Removida limitação visual de poucos padrões.
- Implementados filtros por painel:
  - analisar até concurso
  - mínimo de ocorrências
  - busca
- Implementada busca por variações usando chave canônica ordenada, preservando repetições.
- Implementados botões:
  - `<` decrescente
  - `>` crescente
  - `+` maiores ocorrências
  - `-` menores ocorrências
- Botão azul adiciona em usar somente.
- Botão vermelho adiciona em excluir padrões.
- Conflito usar/excluir resolve movendo o padrão entre listas sem duplicar.
- Toggle liga/desliga implementado para não carregar a análise pesada quando desligado.
- Gerador validado com padrão de linha/coluna em usar e excluir.
- Licença/trial preservados.
- Importação/exportação preservadas.
- Exclusões/dezenas fixas preservadas.
- Novo executável v1.8.23 gerado.

Arquivos alterados nesta correção:

- `app/package.json`
- `app/package-lock.json`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/src/shared/patternStats.ts`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `app/tests/unit/patternStats.spec.ts`
- `PATCHES-APPLIED.md`
- `TEST-REPORT.md`
- `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`

Novas evidências:

- `evidence/screenshots/20-gerador-painel-padroes-corrigido-v1823.png`
- `evidence/screenshots/21-padroes-linha-coluna-lado-a-lado-v1823.png`
- `evidence/screenshots/22-busca-variacoes-linha-v1823.png`
- `evidence/screenshots/23-busca-variacoes-coluna-v1823.png`
- `evidence/screenshots/24-botao-azul-usar-padrao-v1823.png`
- `evidence/screenshots/25-botao-vermelho-excluir-padrao-v1823.png`
- `evidence/screenshots/26-toggle-painel-padroes-desligado-v1823.png`
- `evidence/screenshots/27-gerador-jogos-com-padroes-v1823.png`
- `evidence/logs/npm-run-build-v1823.txt`
- `evidence/logs/npm-run-test-unit-v1823.txt`
- `evidence/logs/npm-run-test-e2e-v1823.txt`
- `evidence/logs/npm-run-dist-v1.8.23.txt`
- `evidence/logs/pattern-panel-correction-v1823.json`
- `evidence/logs/pattern-variation-search-v1823.json`
- `evidence/logs/generator-pattern-rules-v1823.json`
- `evidence/logs/exe-build-info-v1.8.23.json`

Executável v1.8.23:

- Versão: `v1.8.23`
- Nome do arquivo: `ColunaMix-v1.8.23.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.23.exe`
- Tamanho: `74269394` bytes
- SHA256: `041280a2434afeae2ef6ea713287feadcb21ac4e41d9ae963ccbb45450e32dad`
- Comando usado: `npm run dist`

Status da publicação GitHub v1.8.23:

- Release alvo: `v1.8.23`
- Asset obrigatório: `ColunaMix-v1.8.23.exe`
- Publicação automática não realizada neste ambiente porque `gh` não está instalado.
- Instruções manuais criadas em `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`.

