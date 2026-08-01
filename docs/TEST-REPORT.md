# TEST REPORT

## Validação v1.8.37 - Painel de Padrões e Limpeza Segura

- Painel de Padrões validado no Gerador.
- Padrões de Linha validado.
- Padrões de Coluna validado.
- U/X validado para linha e coluna.
- Linha/coluna validadas sem inversão de destino.
- Limpar Configurações validado com modal de confirmação.
- Números preservados após limpar.
- Concurso Inicial, Concurso Final, quantidade de dezenas e Volume de Apostas preservados.
- Regras temporárias limpas.
- Ordem dos quadros preservada.
- Build aprovado.
- Unitários aprovados, `79 passed`.
- E2E aprovado, `21 passed`, `7 skipped` históricos/obsoletos.
- Playwright dedicado aprovado, `1 passed`.
- Prints `151` a `160` gerados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.37.exe`.
- SHA256: `BB23A9B84A89CDD6B7E85AE059FD23F5493438AC1A970CA7AD8D7B1B7A8C2BB0`.

## Validação v1.8.36 - Acessos Padrões de Linha/Coluna

- Sidebar validada.
- Padrões de Linha validado.
- Padrões de Coluna validado.
- U/X validados.
- Gerador validado.
- Ordem dos quadros de exclusão não foi alterada.
- Não foi implementado botão em massa.
- Build/testes/Playwright executados.
- Build aprovado.
- Unitários aprovados, `79 passed`.
- E2E aprovado, `20 passed`, `7 skipped` históricos/obsoletos.
- Playwright dedicado aprovado, `1 passed`.
- Prints `145` a `150` gerados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.36.exe`.
- SHA256: `984858294F84CDB4B6A032CF31ABD65714DA28923BA1444EDA90F8A3C88991BA`.
- Commit/push concluídos: `bcba371`.
- Tag enviada: `v1.8.36`.
- Release bloqueada sem `gh` e sem token GitHub no ambiente.

## Validação v1.8.35 - Borda/Miolo Geral + Performance

- Borda Geral e Miolo Geral visíveis no Gerador.
- Adição manual, validação, puxar histórico, limpar, persistência e geração validados.
- Comparação exata por subconjunto e cache validados em unitários.
- Tempos: abertura Electron `15950 ms`, abrir Gerador `393 ms`, renderizar exclusões `525 ms`, puxar Borda `404 ms`, puxar Miolo `339 ms`, gerar `388 ms`.
- Build aprovado.
- Unitários aprovados, `79 passed`.
- E2E aprovado, `19 passed`, `7 skipped` históricos/obsoletos.
- Playwright dedicado aprovado.
- Prints `132` a `144` gerados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.35.exe`.
- SHA256: `66948B8A7350AD52C7D50EDE0BEF22907CE5E35AB2D4E0E548B3CAB6FA03BB97`.
- Release bloqueada por falta de `gh` e token GitHub no ambiente.

## Validação v1.8.34 - Modo de seleção preservado

- `Faixa Manual (Concurso ID)` validada com concursos `3688` a `3737`.
- Navegação para Estatísticas por Padrão de Coluna validada sem reset.
- Retorno ao Gerador validado preservando modo e campos.
- `Últimos N concursos` não foi selecionado automaticamente.
- Blocos Ímpares/Pares preservados.
- Build aprovado.
- Unitários aprovados, `74 passed`.
- E2E aprovado, `18 passed`, `7 skipped` históricos/obsoletos.
- Playwright dedicado aprovado, `1 passed`.
- Prints `125` a `131` gerados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.34.exe`.
- SHA256: `E6B84725F53F0B82C598191490D21C2063555BAD76AB6B3B051B535DC2CC8944`.
- Release: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.34
- Download: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.34/ColunaMix-v1.8.34.exe

## Validação v1.8.33 - Blocos Ímpares e Pares

- Validações unitárias para listas ímpares/pares, entrada inválida, duplicidade, ordenação e persistência.
- Regressão `odd-even-group-exclusions-v1833.test.ts` criada.
- Playwright dedicado aprovado para blocos visíveis, adicionar, validar, puxar, limpar, persistir e gerar.
- Build aprovado.
- Unitários aprovados, `67 passed`.
- E2E aprovado, `17 passed`, `7 skipped` históricos/obsoletos.
- Playwright dedicado aprovado, `1 passed`.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.33.exe`.
- SHA256: `320F49777AE15A3F6EEEB944E60441F9FB122E69371ACEA4607E1A362E3EF05B`.
- Release: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.33
- Download: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.33/ColunaMix-v1.8.33.exe

## Validação v1.8.32 - Histórico Técnico

- Sidebar validado.
- Tela Histórico Técnico validada.
- Data `15/07/2026` validada.
- Tags validadas.
- Gerador validado.
- Padrões preservados.
- Build/testes/Playwright executados.
- Prints e logs gerados.
- SHA256 do executável: `B89DD2705DFF972DF9538C2BB8B0C1A49157EA2D398E152B7AACC86F58A42ECF`.

## Data

2026-06-15

## Ambiente

- Projeto: `eufilipesouza-site`
- Node/npm conforme ambiente local.

## Comandos Executados

- A preencher durante validacao.

## Resultado lint

- Pendente.

## Resultado build

- Pendente.

## Resultado Playwright

- Pendente.

## Rotas Testadas

- Pendente.

## Screenshots Geradas

- Pendente.

## Falhas Encontradas

- Pendente.

## Correcoes Aplicadas

- Pendente.

## Status Final

- Pendente.
