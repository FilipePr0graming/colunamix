# Auditoria v1.8.33 - Exclusao por grupos de Numeros Impares e Numeros Pares

1. Onde ficam os blocos atuais de exclusao por grupo?

Os blocos ficam em `app/src/renderer/components/Generator.tsx`, na secao `data-testid="exact-group-exclusions"`. A tela renderiza um card para cada item de `EXACT_GROUP_CATEGORIES`, usando labels, placeholders, estados de input, erros e contadores por categoria.

2. Como Borda/Miolo/Primos/Fibonacci sao armazenados?

As categorias sao tipadas em `app/src/shared/types.ts` por `ExactGroupCategory` e armazenadas em `ExactGroupExclusions` como arrays de grupos numericos. O estado local do Gerador usa `createDefaultExactGroupExclusions()` e persiste `exactGroupExclusions` em `localStorage` dentro da chave `colunamix_generator_settings`.

3. Como o botao Puxar funciona nos blocos atuais?

O botao chama `applyExactGroupHistory(category)` no renderer, que invoca `window.electronAPI.generatorApplyExactGroupHistory`. O preload encaminha para o IPC `generator:apply-exact-group-history`, registrado em `app/src/main/ipc-handlers.ts`. O IPC resolve o historico e chama `collectExactGroupsFromDraws(history.draws, category)`.

4. Como os grupos sao integrados ao Gerador?

O renderer envia `exactGroupExclusions` dentro de `GeneratorConfig`. O gerador compartilhado em `app/src/shared/generator.ts` cria conjuntos de chaves com `buildExactGroupExclusionKeySets` e descarta jogos via `shouldExcludeByExactGroupWithKeySets`, comparando o subconjunto exato da categoria.

5. Como os grupos sao persistidos?

A persistencia principal fica em `localStorage`, na chave `colunamix_generator_settings`. Exportacao/importacao de configuracao tambem transporta `exactGroupExclusions`. Ao carregar, o estado e normalizado por `normalizeExactGroupExclusions`.

6. Onde adicionar Numeros Impares e Numeros Pares?

Adicionar as categorias em `app/src/shared/types.ts`, `app/src/shared/exactGroupExclusions.ts` e nos mapas do renderer em `app/src/renderer/components/Generator.tsx`. Como a UI ja itera `EXACT_GROUP_CATEGORIES`, os novos cards aparecem automaticamente na ordem definida.

7. Quais arquivos precisam ser alterados?

- `app/src/shared/types.ts`
- `app/src/shared/exactGroupExclusions.ts`
- `app/src/renderer/components/Generator.tsx`
- `app/package.json`
- `app/package-lock.json`
- `app/tests/unit/exactGroupExclusions.spec.ts`
- `app/tests/unit/odd-even-group-exclusions-v1833.test.ts`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `PATCHES-APPLIED.md`
- `TEST-REPORT.md`

8. Quais riscos existem para nao quebrar o Gerador?

O risco principal e alterar a semantica das categorias antigas ou comparar o jogo inteiro em vez do subconjunto da categoria. A mitigacao e manter a arquitetura existente, apenas acrescentando `oddNumbers` e `evenNumbers`, com validacao por conjunto permitido e comparacao por chave exata no mesmo fluxo usado por Borda/Miolo/Primos/Fibonacci.
