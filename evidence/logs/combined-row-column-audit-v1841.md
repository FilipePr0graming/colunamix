# Auditoria v1.8.41 - Filtro combinado Linha + Coluna

- Versão anterior real identificada: `v1.8.40`.
- Nova versão definida por incremento de patch: `v1.8.41`.
- Release pública anterior validada pela API do GitHub: `v1.8.40`, com asset `ColunaMix-v1.8.40.exe`.
- Último executável local anterior encontrado: `app/release/ColunaMix-v1.8.40.exe`.

## Arquitetura

- Regra oficial de Linha reutilizada de `app/src/shared/columns.ts`: `getRowPattern` e `getRowPatternArray`.
- Regra oficial de Coluna reutilizada de `app/src/shared/columns.ts`: `getColPattern` e `getColPatternArray`.
- Novo módulo compartilhado: `app/src/shared/combinedPatternExclusions.ts`.
- Chave estável: `rowPattern + "|" + columnPattern`.
- Persistência: mesma chave local do Gerador, `colunamix_generator_settings`, no campo `combinedPatternExclusions`.
- Histórico: mesmo caminho IPC do Gerador, usando `resolveHistoryDraws` e a base oficial retornada por `getDraws`.
- Gerador: `ChunkedGenerator` monta `Set<string>` uma vez no construtor e compara a chave combinada já calculada no candidato.

## Causa raiz de falhas durante validação

- O primeiro teste unitário dedicado falhou porque `parseCombinedPatternInput` passava entrada compacta como `33333` direto para `validatePattern`, que espera cinco valores separados por vírgula. Correção: normalizar com `formatCombinedPatternInputText` antes de validar.
- O primeiro E2E dedicado falhou porque o teste semeava 2 concursos, mas deixava o Gerador em `Últimos 20 concursos`, causando erro de histórico insuficiente antes da geração. Correção: preencher `Últimos N` com `2` no fluxo E2E.
- A tentativa de controlar o `.exe` portátil por `electron.launch` excedeu timeout, pois o executável portátil não expõe o processo Electron diretamente para controle do Playwright. A validação UI empacotada foi feita com `app/release/win-unpacked/ColunaMix.exe`, gerado pelo mesmo `npm run dist`, e o `.exe` portátil foi validado por smoke via `Start-Process`.

## Escopo preservado

- Filtros individuais de Linha e Coluna preservados.
- Painel de Padrões, botões U/X, Usar Todos e Excluir Todos preservados.
- Recorrência Geral e Estatísticas por Padrão de Coluna preservadas.
- Backend, banco, Prisma, admin, health checks e deploy não foram alterados.
