# Causa raiz - v1.8.30

Tela: Estatisticas por Padrao de Coluna

## Causa raiz

A v1.8.29 calculava a Recorrencia Geral dos cards usando o mapa oficial de ocorrencias de Padroes de Coluna, isto e, a quantidade de vezes que a distribuicao de quantidades por coluna (`patternKey`, como `2,2,3,4,4`) aparecia na base historica.

Essa regra gerava valores como `9`, `4`, `28` e `6` quando o campo Concurso inicial ou a base visivel ficavam restritos aos ultimos concursos, e tambem gerava valores agregados por distribuicao que nao correspondiam ao print antigo do cliente.

## Regra correta restaurada

A implementacao antiga exibida na referencia do cliente calculava a Recorrencia Geral como o maior `DIST` entre C1, C2, C3, C4 e C5 dentro do card.

Exemplos da referencia:

- `#3700`: maior `DIST` do card = `52`, portanto Recorrencia Geral = `52 concursos`.
- `#3701`: maior `DIST` do card = `194`, portanto Recorrencia Geral = `194 concursos`.
- `#3704`: maior `DIST` do card = `56`, portanto Recorrencia Geral = `56 concursos`.
- `#3708`: maior `DIST` do card = `110`, portanto Recorrencia Geral = `110 concursos`.

## Separacao de conceitos

- `displayStartContest`: controla quais cards aparecem na tela. No fluxo validado, abre em `3699` para mostrar os ultimos 10 cards ate `3708`.
- `analysisStartContest`: controla a base usada para calcular `ULT`, `DIST` e Recorrencia Geral. Foi fixado em `3000`, conforme referencia antiga.

Assim, abrir nos ultimos concursos nao limita a base de analise da Recorrencia Geral.

## Validacao

Arquivo de crosscheck: `evidence/logs/column-stats-reference-crosscheck-v1830.json`.

Valores validados:

- `3700 -> 52`
- `3701 -> 194`
- `3702 -> 51`
- `3703 -> 93`
- `3704 -> 56`
- `3705 -> 29`
- `3706 -> 61`
- `3707 -> 50`
- `3708 -> 110`

Build, unitarios e E2E passaram com a regra restaurada.
