# Auditoria Tecnica - Escopo Final Anderson v1.8.39

## Versao

- Versao publicada atualmente: v1.8.38.
- Nova versao: v1.8.39.
- Branch de producao: main.

## Painel de Padroes

- Renderizacao: `app/src/renderer/components/Generator.tsx`, componente `GeneratorPatternTable`, dentro da secao `Painel de Padrões`.
- Busca atual: `filterPatternsBySearch` em `app/src/shared/patternStats.ts`.
- Semantica atual: preserva busca textual direta, busca compacta sem virgulas e busca por variacao/multiconjunto quando o padrao digitado tem o mesmo tamanho.
- Nova busca por sequencia: sera adicionada como segundo campo independente em `GeneratorPatternTable`, com estado separado para Linha e Coluna.
- Dataset final filtrado: `rowPatternPanelRows` e `columnPatternPanelRows`, derivados por `filterPatternStatsRows` a partir das linhas completas carregadas de `patternStatsGet`.
- Paginacao/virtualizacao do Painel do Gerador: nao ha paginacao nem virtualizacao dos padroes; ha scroll em tabela. Acoes em massa devem usar `rows` filtrado completo recebido pelo componente, nao DOM/viewport.

## Acoes U/X e Massa

- U individual: `applyPatternFromPanel(row, 'include', kind)`.
- X individual: `applyPatternFromPanel(row, 'exclude', kind)`.
- Semantica compartilhada: `applyPatternRuleAction` em `app/src/shared/patternRules.ts`.
- Deduplicacao: `applyPatternRuleAction` compara `type` e `pattern.join(',')`; acoes em massa devem iterar em memoria sobre todos os filtrados e aplicar a mesma regra em acumuladores.
- Separacao Linha/Coluna: `PatternExclusion.type` usa `row` ou `column`; o `kind` do painel sera propagado para cada regra em massa.
- Garantia de todos os filtrados: as acoes receberao o array filtrado completo (`rows`) do componente, e nao os itens renderizados.

## Quadros de Exclusao por Grupo

- Local: `app/src/shared/exactGroupExclusions.ts` define `EXACT_GROUP_CATEGORIES`; `Generator.tsx` renderiza `EXACT_GROUP_CATEGORIES.map`.
- Ordem atual: borderOdd, borderEven, coreOdd, coreEven, borderGeneral, middleGeneral, prime, fibonacci, oddNumbers, evenNumbers.
- Ordem final solicitada: borderGeneral, middleGeneral, oddNumbers, evenNumbers, borderOdd, borderEven, coreOdd, coreEven, prime, fibonacci.
- Estados por quadro: `exactGroupExclusions`, `exactGroupInputs`, `exactGroupErrors`, `exactGroupHistoryCounts`.
- Handlers por quadro: `updateExactGroupInput`, `addExactGroup`, `removeExactGroup`, `clearExactGroups`, `applyExactGroupHistory`, `updateExactGroupHistoryCount`. Eles recebem a categoria e nao devem ser trocados.

## Limpeza Segura das Caixas

- Persistencia real: `colunamix_generator_settings`, via `GENERATOR_SETTINGS_STORAGE_KEY` e estados do Gerador.
- Configuracoes que podem ser resetadas nas caixas: `exactGroupInputs`, `exactGroupErrors`, `exactGroupHistoryCounts`.
- Numeros que precisam permanecer: `exactGroupExclusions` das 10 categorias, `rangeStart`, `rangeEnd`, `maxJogos`, alem do conteudo numerico cadastrado nas caixas.
- Reset cirurgico: criar uma acao com confirmacao que limpe somente inputs temporarios, erros e contadores auxiliares dos 10 quadros; nao chamar `localStorage.clear`, nao resetar `exactGroupExclusions`, nao resetar o Gerador.

## Arquivos Previstos

- `app/src/shared/patternStats.ts`
- `app/src/shared/patternRules.ts`
- `app/src/shared/exactGroupExclusions.ts`
- `app/src/shared/generatorSettings.ts`
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/package.json`
- `app/package-lock.json`
- testes unitarios e E2E em `app/tests`
- documentacao/evidencias em `docs/`, `PATCHES-APPLIED.md`, `TEST-REPORT.md` e `evidence/`

## Riscos e Validacao

- Risco: mudar a busca antiga ao adicionar a busca por sequencia. Mitigacao: adicionar funcao nova e compor filtros cumulativamente.
- Risco: massa Linha/Coluna cruzar listas. Mitigacao: testes explicitos de `type`.
- Risco: limpar numeros das caixas. Mitigacao: helper dedicado e teste que compara antes/depois.
- Risco: usar somente viewport. Mitigacao: teste com dataset 392/20 e acao em array completo.
- Validacao prevista: unitarios, E2E/Playwright no app fonte, build, dist, teste no executavel final, SHA256, diff check, commit, push, tag e release.
