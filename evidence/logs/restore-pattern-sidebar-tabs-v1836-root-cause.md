## Causa raiz - primeira execução E2E v1.8.36

### Falha

A primeira execução de `npm run test:e2e` falhou no teste `ABERTURA DO APP: carrega UI e navegação principal funciona`.

### Causa raiz

O teste passou a clicar nos acessos restaurados `Padrões de Linha` e `Padrões de Coluna` antes de importar concursos. Nesse estado sem dados, `PatternStatsPage.tsx` retorna a mensagem `Importe concursos para visualizar os padrões.` e não renderiza o heading da tela.

### Correção aplicada

O teste de abertura foi ajustado para validar o comportamento correto do estado sem dados. A validação com headings e tabelas preenchidas permanece no teste dedicado `V1.8.36: restaura acessos laterais de Padrões de Linha e Padrões de Coluna`, que importa uma base temporária antes de abrir as telas.
