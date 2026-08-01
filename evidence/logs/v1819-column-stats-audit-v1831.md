# Auditoria v1.8.19 - Estatisticas por Padrao de Coluna

Versao auditada: `v1.8.19`

Tag local encontrada: `v1.8.19` (`f3a8023`)

## Arquivos auditados

- `app/src/renderer/components/ColumnStats.tsx`
- `app/src/main/ipc-handlers.ts`
- `app/src/shared/types.ts`

## Componente da tela

Na v1.8.19 a tela era renderizada por `ColumnStats.tsx`.

Comportamento visual:

- Titulo: `Estatisticas por Padrao de Coluna`.
- Texto fixo no topo: `Concurso Inicial: 3000`.
- Paginacao antiga: botao `Anterior`, indicador `Pagina X de Y`, botao `Proxima`.
- `pageSize = 10`.
- Ao carregar, chamava `window.electronAPI.dbGetStats(3000)`.
- Depois do carregamento, ia direto para a ultima pagina:
  `setPage(Math.max(0, Math.ceil(res.length / pageSize) - 1))`.
- Cards em grade `grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4`.
- Cards com `#concurso`, `Recorrencia Geral`, `C1` a `C5`, `ULT`, `DIST` e dezenas da coluna.

## Calculo da Recorrencia Geral

Na v1.8.19, a Recorrencia Geral exibida nao era um campo calculado pelo backend.

Ela era renderizada diretamente no componente:

`entry.patterns.reduce((max, p) => Math.max(max, p.colDistance), 0)`

Ou seja: Recorrencia Geral = maior `DIST` entre C1, C2, C3, C4 e C5 do card.

Essa regra gera os valores da referencia do cliente quando a base de analise parte do concurso `3000`:

- `#3700 = 52 concursos`
- `#3701 = 194 concursos`
- `#3702 = 51 concursos`
- `#3703 = 93 concursos`
- `#3704 = 56 concursos`
- `#3705 = 29 concursos`
- `#3706 = 61 concursos`
- `#3707 = 50 concursos`
- `#3708 = 110 concursos`

## Backend da v1.8.19

O handler `db:get-stats` buscava concursos a partir do `startContest` informado, filtrava `contest >= startContest`, ordenava crescente e, para cada coluna, procurava a ocorrencia anterior do mesmo conjunto exato de dezenas da coluna dentro da mesma base filtrada.

## Diferenca para a tela atual

Versoes posteriores trocaram a experiencia para ultimos concursos, blocos/infinite scroll, campo editavel e botao de recalculo. A v1.8.30 ja havia restaurado a regra de Recorrencia Geral, mas ainda mantinha a experiencia visual moderna.

## Restauracao v1.8.31

Para a v1.8.31, a tela especifica `Estatisticas por Padrao de Coluna` foi restaurada para o modelo da v1.8.19:

- `Concurso Inicial: 3000`.
- Paginacao antiga.
- Ultima pagina aberta automaticamente.
- Recorrencia Geral pelo maior `DIST`.
- Cards antigos em grade.

Os modulos novos de Padroes de Linha/Coluna, Gerador, licenca e demais funcoes permanecem preservados.
