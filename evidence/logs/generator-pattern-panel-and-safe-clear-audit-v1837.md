## Auditoria v1.8.37 - Painel de Padrões no Gerador e Limpeza Segura

### 1. Onde existia o Painel de Padrões dentro do Gerador?
Na própria tela `Gerador`, depois da seção `05. Padrões de Distribuição`, no bloco renderizado com `data-testid="generator-pattern-panel"` e título `Painel de Padrões`.

### 2. Em qual versão/commit ele estava funcionando?
O painel foi confirmado na tag `v1.8.23`, commit `8d47027`, e permanece presente no estado atual baseado em `v1.8.36`, commit `04e3470`.

### 3. Qual componente renderizava o painel?
O painel é renderizado em `app/src/renderer/components/Generator.tsx`, usando o componente interno `GeneratorPatternTable` para `Padrões de Linha` e `Padrões de Coluna`.

### 4. Por que ele não aparece na versão atual?
A renderização já existe no código atual. A provável confusão da entrega anterior foi restaurar também os acessos laterais sem evidenciar o painel dentro do Gerador. A v1.8.37 deve reforçar a validação visual e manter o painel dentro do Gerador.

### 5. Como restaurar sem mexer na ordem dos quadros de exclusão?
Não alterar `EXACT_GROUP_CATEGORIES`, `EXACT_GROUP_LABELS`, nem o bloco `04. Exclusão por Grupo de Dezenas`. O trabalho fica restrito ao cabeçalho do Gerador, estados temporários e testes.

### 6. Como funcionam os botões U/X?
No `GeneratorPatternTable`, o botão `U` chama `onApplyPattern(row, 'include', kind)` e o botão `X` chama `onApplyPattern(row, 'exclude', kind)`. O callback final é `applyPatternFromPanel`, que usa `applyPatternRuleAction`.

### 7. Como garantir que Linha vai para Linha e Coluna vai para Coluna?
O `kind` recebido pelo botão é passado diretamente ao item persistido (`type: kind`). Os testes devem validar `patternIncludes` e `patternExclusions` no `localStorage`, garantindo que `row` não vira `column` e `column` não vira `row`.

### 8. Onde ficam as configurações que podem ser limpas?
No estado local do `Generator.tsx` e na persistência `colunamix_generator_settings`: `exclusions`, `patternIncludes`, `patternExclusions`, `exactGroupExclusions`, buscas/minimos/sorts do painel, mensagens, resultados e flags temporárias.

### 9. Quais campos devem ser preservados?
`fixas`, `fixasModo`, `mode`, `lastN`, `rangeStart`, `rangeEnd`, `K`, `maxJogos`, `patternPanelEnabled`, base histórica importada, licença/trial e recursos de importação/exportação.

### 10. Quais campos podem ser limpos?
`exclusions`, `patternIncludes`, `patternExclusions`, grupos exatos temporários já adicionados, erros desses grupos, filtros de busca/minimo/analisar até concurso do painel, resultados gerados, progresso, alertas, mensagens temporárias, `noRepeat` e visualização de matriz de filtros.

### 11. Como evitar apagar dezenas fixas/números digitados?
A função de limpeza segura não deve chamar `setFixas`, `setFixasModo`, `setMode`, `setLastN`, `setRangeStart`, `setRangeEnd`, `setK` nem `setMaxJogos`.

### 12. Quais arquivos serão alterados?
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/package.json`
- `app/package-lock.json`
- `app/tests/e2e/generator-pattern-panel-safe-clear-v1837.spec.ts`
- `docs/PATCHES-APPLIED.md`
- `docs/TEST-REPORT.md`
- evidências em `evidence/logs/` e `evidence/screenshots/`
