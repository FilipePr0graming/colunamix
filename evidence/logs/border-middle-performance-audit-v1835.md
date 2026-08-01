# Auditoria v1.8.35 - Borda/Miolo Geral + Performance

1. Os blocos atuais ficam em `app/src/renderer/components/Generator.tsx`, seção `04. Exclusão por Grupo de Dezenas`, renderizados a partir de `EXACT_GROUP_CATEGORIES`.
2. Os grupos são armazenados em `exactGroupExclusions` no estado do Gerador e persistidos no `localStorage` pela chave `colunamix_generator_settings`.
3. O gerador aplica os grupos via `ChunkedGenerator`, com `buildExactGroupExclusionKeySets` e comparação por chave ordenada.
4. O botão Puxar chama `generatorApplyExactGroupHistory`, que seleciona concursos e usa `collectExactGroupsFromDraws`.
5. A persistência é carregada por `parsePersistedGeneratorSettings` e normalizada com `normalizeExactGroupExclusions`.
6. Borda Geral e Miolo Geral entram após Miolo Pares e antes de Primos.
7. Arquivos alterados: tipos compartilhados, exclusões exatas, gerador, painel do Gerador, testes unitários, E2E, versão e documentação.
8. Gargalos maiores: recalcular subconjuntos por categoria em cada jogo, prévia frequente e renderização de muitos resultados.
9. Cálculos repetidos: chaves de Borda/Miolo/ímpares/pares/primos/Fibonacci para o mesmo jogo.
10. Cacheável: conjuntos permitidos, chaves de grupos cadastrados e chaves por categoria durante a avaliação do jogo.
11. Memoizável: totais derivados no React e configurações de comparação no gerador.
12. Carregamento rápido sem perder precisão: manter validações puras, comparar por `Set` e evitar recomputar chaves.
13. Comparação exata garantida por extração do subconjunto (`borderGeneral`/`middleGeneral`) e chave ordenada `01-02-...`.
14. Estratégia de teste: unitários para validação/normalização/histórico/cache e Playwright para UI/persistência/geração.
15. Benchmark antes/depois: usar build/Playwright v1835 e registrar tempos em `performance-before-after-v1835.json`.

## Causa raiz

O sistema já possuía exclusões por subconjuntos especializados, mas não havia categorias gerais para a composição completa da Borda e do Miolo. No caminho quente, cada categoria também podia recalcular seu subconjunto do mesmo jogo.

## Estratégia aplicada

Foram adicionadas as categorias `borderGeneral` e `middleGeneral`, mensagens específicas e extração exata por subconjunto. O gerador agora reutiliza um cache local de chaves durante a avaliação de cada jogo, preservando a precisão e reduzindo recálculo por categoria.
