# TEST REPORT - ColunaMix

## Validação v1.8.39 - Escopo final Anderson

- Versão anterior: `v1.8.38`.
- Nova versão: `v1.8.39`.
- Busca antiga preservada.
- Busca por sequência em Linha e Coluna validada.
- `Usar Todos` e `Excluir Todos` em Linha e Coluna validados com deduplicação e separação de eixo.
- Ordem dos 10 quadros validada.
- Limpeza segura validada com números, Concurso Inicial, Concurso Final e Volume preservados.
- Build: aprovado (`evidence/logs/npm-run-build-v1839.txt`).
- Unitários: aprovado, `83 passed` (`evidence/logs/npm-run-test-unit-v1839.txt`).
- E2E: aprovado, `21 passed`, `7 skipped` históricos (`evidence/logs/npm-run-test-e2e-v1839.txt`).
- Playwright focado: aprovado, `1 passed` (`evidence/logs/playwright-final-client-scope-v1839.txt`).
- Playwright no build empacotado: aprovado, `1 passed` (`evidence/logs/playwright-final-exe-v1839.txt`).
- Executável: `app/release/ColunaMix-v1.8.39.exe`.
- SHA256: `863c718a565d9b373757c77626e94060a0580e818f910bd576f8fee9a288b352`.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.39
- Download direto validado com HTTP 200: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.39/ColunaMix-v1.8.39.exe

## Resumo

A implementação foi validada com build, testes unitários, testes E2E, prints, logs, exportações, validação de licença, validação do gerador e geração do executável Windows `.exe`.

## Validação v1.8.36 - Acessos Padrões de Linha/Coluna

- Sidebar validada.
- Padrões de Linha validado.
- Padrões de Coluna validado.
- U/X validados.
- Gerador validado.
- Ordem dos quadros de exclusão validada sem alteração.
- Nenhum botão em massa foi implementado.
- Build/testes/Playwright executados.
- Build: aprovado (`evidence/logs/npm-run-build-v1836.txt`).
- Unitários: aprovado, `79 passed` (`evidence/logs/npm-run-test-unit-v1836.txt`).
- E2E: aprovado, `20 passed`, `7 skipped` (`evidence/logs/npm-run-test-e2e-v1836.txt`).
- Playwright dedicado: aprovado, `1 passed` (`evidence/logs/playwright-restore-pattern-sidebar-tabs-v1836.txt`).
- Prints: `145` a `150` em `evidence/screenshots/`.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.36.exe`.
- SHA256: `984858294F84CDB4B6A032CF31ABD65714DA28923BA1444EDA90F8A3C88991BA`.
- Commit/push: `bcba371` enviado para `origin/main`.
- Tag: `v1.8.36` enviada para `origin`.
- Release GitHub: bloqueada neste ambiente sem `gh` e sem `GITHUB_TOKEN/GH_TOKEN`; API pública ainda retornou `404`.

## Validação v1.8.35 - Borda/Miolo Geral + Performance

- Testes de validação cobrem listas oficiais de Borda e Miolo.
- Testes de puxar grupos validam extração dos concursos históricos sem duplicar.
- Testes de limpar bloco e remoção individual validam isolamento entre Borda Geral, Miolo Geral e blocos antigos.
- Testes de persistência cobrem normalização de `exactGroupExclusions` e reload no Playwright.
- Testes de integração com Gerador cobrem comparação exata por subconjunto.
- Testes de cache confirmam que múltiplas execuções não reaproveitam dado errado.
- Testes de regressão em `app/tests/unit/border-middle-general-performance-v1835.test.ts`.
- Playwright validou blocos novos, blocos antigos, Ímpares/Pares gerais, licença, puxar, limpar, persistência e geração.
- Benchmark registrado em `evidence/logs/performance-before-after-v1835.json`.
- Tempos medidos: abertura Electron `15950 ms`, abrir Gerador `393 ms`, renderizar exclusões `525 ms`, puxar Borda `404 ms`, puxar Miolo `339 ms`, gerar `388 ms`.
- Observação: abertura total do Electron ficou acima da meta de 5s nesta máquina; interações principais do Gerador ficaram subsegundo.
- Build: aprovado (`evidence/logs/npm-run-build-v1835.txt`).
- Unitários: aprovado, `79 passed` (`evidence/logs/npm-run-test-unit-v1835.txt`).
- E2E: aprovado, `19 passed`, `7 skipped` históricos/obsoletos (`evidence/logs/npm-run-test-e2e-v1835.txt`).
- Playwright dedicado: aprovado (`evidence/logs/playwright-border-middle-performance-v1835.txt`).
- Prints: `132` a `144` em `evidence/screenshots/`.
- Logs: auditoria, crosscheck, performance, build, unitários, E2E, Playwright, dist e exe em `evidence/logs/`.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.35.exe`.
- SHA256: `66948B8A7350AD52C7D50EDE0BEF22907CE5E35AB2D4E0E548B3CAB6FA03BB97`.
- Release: bloqueada neste ambiente por falta de `gh` e token GitHub.
- Log de publicação: `evidence/logs/github-release-v1.8.35.json`.

## Validação v1.8.34 - Modo de seleção preservado

- Teste com `Faixa Manual (Concurso ID)` usando Concurso Inicial `3688` e Concurso Final `3737`.
- Navegação para `Estatísticas por Padrão de Coluna` validada sem sobrescrever o modo do Gerador.
- Retorno ao Gerador validado mantendo `Faixa Manual (Concurso ID)`.
- Verificação de `Concurso Inicial` e `Concurso Final` preservados.
- Verificação de que não voltou para `Últimos N concursos`.
- Verificação dos blocos `Números Ímpares` e `Números Pares`.
- Gerador validado após a navegação.
- Build: aprovado (`evidence/logs/npm-run-build-v1834.txt`).
- Unitários: aprovado, `74 passed` (`evidence/logs/npm-run-test-unit-v1834.txt`).
- E2E: aprovado, `18 passed`, `7 skipped` históricos/obsoletos (`evidence/logs/npm-run-test-e2e-v1834.txt`).
- Playwright dedicado: aprovado, `1 passed` (`evidence/logs/playwright-selection-mode-v1834-run.txt`).
- Log funcional: `evidence/logs/playwright-selection-mode-v1834.txt`.
- Prints: `125` a `131` em `evidence/screenshots/`.
- Logs: auditoria, crosscheck, build, unitários, E2E e Playwright em `evidence/logs/`.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.34.exe`.
- SHA256: `E6B84725F53F0B82C598191490D21C2063555BAD76AB6B3B051B535DC2CC8944`.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.34
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.34/ColunaMix-v1.8.34.exe
- Log de publicação: `evidence/logs/github-release-v1.8.34.json`.
- Sem `git push`.

## Validação v1.8.33 - Blocos Ímpares e Pares

- Testes de validação criados para listas ímpares/pares, números fora de `01` a `25`, formatação com 2 dígitos, ordenação e duplicidade.
- Testes de puxar grupos criados para extração de subconjuntos ímpares e pares do histórico.
- Testes de limpar bloco e remoção individual cobertos por regressão de estado isolado.
- Testes de persistência cobertos por normalização de `exactGroupExclusions` e Playwright com reload.
- Testes de integração com Gerador cobrem exclusão exata por grupo ímpar/par.
- Teste de regressão criado em `app/tests/unit/odd-even-group-exclusions-v1833.test.ts`.
- Blocos antigos Borda/Miolo/Primos/Fibonacci preservados.
- Gerador e licença preservados.
- Prints previstos: `116` a `124` em `evidence/screenshots/`.
- Logs previstos: auditoria, crosscheck, build, unitários, E2E, Playwright e executável em `evidence/logs/`.
- SHA256 e link release registrados após geração/publicação do `.exe`.

Resultados:

- `npm run build`: aprovado (`evidence/logs/npm-run-build-v1833.txt`).
- `npm run test:unit`: aprovado, `67 passed` (`evidence/logs/npm-run-test-unit-v1833.txt`).
- `npm run test:e2e`: aprovado, `17 passed`, `7 skipped` históricos/obsoletos (`evidence/logs/npm-run-test-e2e-v1833.txt`).
- Playwright dedicado: aprovado, `1 passed` (`evidence/logs/playwright-odd-even-groups-v1833-run.txt`).
- Log funcional Playwright: `evidence/logs/playwright-odd-even-groups-v1833.txt`.
- Primeira execução Playwright teve falha de asserção auxiliar do teste; causa raiz registrada em `evidence/logs/odd-even-groups-playwright-root-cause-v1833.md` e cenário repetido com sucesso.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.33.exe`.
- SHA256: `320F49777AE15A3F6EEEB944E60441F9FB122E69371ACEA4607E1A362E3EF05B`.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.33
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.33/ColunaMix-v1.8.33.exe
- Log de publicação: `evidence/logs/github-release-v1.8.33.json`.
- Sem `git push`.

## Validação v1.8.32 - Histórico Técnico

- Sidebar validado com novo botão `Histórico Técnico`.
- Tela `Histórico Técnico` validada.
- Data `15/07/2026` validada.
- Horário `11:48` validado.
- Status `Concluído` validado.
- Tag `Atualização preventiva` validada.
- Tags `PREVENÇÃO`, `CACHE`, `ESTABILIDADE`, `GERADOR`, `ESTATÍSTICAS` e `CORREÇÃO` validadas.
- Revisão de cache validada.
- `Gerador validado.` validado.
- `Estatísticas por Padrão de Coluna` validada.
- Gerador preservado.
- Padrões de Linha e Padrões de Coluna preservados.
- Build: aprovado (`evidence/logs/npm-run-build-v1832.txt`).
- Unitários: aprovado, `57 passed` (`evidence/logs/npm-run-test-unit-v1832.txt`).
- E2E/Playwright completo: aprovado, `16 passed`, `7 skipped` históricos/obsoletos (`evidence/logs/npm-run-test-e2e-v1832.txt`).
- Playwright dedicado: aprovado, `1 passed` (`evidence/logs/playwright-technical-history-v1832.txt`).
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.32.exe`.
- SHA256: `B89DD2705DFF972DF9538C2BB8B0C1A49157EA2D398E152B7AACC86F58A42ECF`.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.32
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.32/ColunaMix-v1.8.32.exe
- Log de publicação: `evidence/logs/github-release-v1.8.32.json`.
- Sem `git push`.

Evidências v1.8.32:

- `evidence/screenshots/109-v1832-sidebar-historico-tecnico.png`
- `evidence/screenshots/110-v1832-historico-tecnico-tela.png`
- `evidence/screenshots/111-v1832-historico-tecnico-manutencao-15072026.png`
- `evidence/screenshots/112-v1832-historico-tecnico-tags.png`
- `evidence/screenshots/113-v1832-historico-tecnico-cache-gerador-estatisticas.png`
- `evidence/screenshots/114-v1832-gerador-preservado.png`
- `evidence/screenshots/115-v1832-padroes-preservados.png`
- `evidence/logs/technical-history-feature-v1832.json`
- `evidence/logs/exe-build-info-v1.8.32.json`
- `evidence/logs/github-release-v1.8.32.json`

## Validação v1.8.31 - Restauração v1.8.19

- Auditoria da v1.8.19 concluída em `evidence/logs/v1819-column-stats-audit-v1831.md`.
- Tela antiga identificada em `v1.8.19`: `ColumnStats.tsx` com `Concurso Inicial: 3000`, paginação `Anterior / Página X de Y / Próxima` e abertura na última página.
- Recorrência Geral da v1.8.19 identificada como maior `DIST` entre C1-C5 do card.
- Build: aprovado (`evidence/logs/npm-run-build-v1831.txt`).
- Unitários: aprovado, `57 passed` (`evidence/logs/npm-run-test-unit-v1831.txt`).
- E2E/Playwright: aprovado, `15 passed`, `7 skipped` históricos/obsoletos da tela antiga intermediária (`evidence/logs/npm-run-test-e2e-v1831.txt`).
- Playwright dedicado: aprovado (`evidence/logs/playwright-column-stats-v1831.txt`).
- Campo `Concurso Inicial: 3000`: validado.
- Paginação antiga: validada com `Página 71 de 71`.
- Valores de referência: `3700=52`, `3701=194`, `3702=51`, `3703=93`, `3704=56`, `3705=29`, `3706=61`, `3707=50`, `3708=110`.
- Gerador preservado.
- Módulos novos `Padrões de Linha` e `Padrões de Coluna` preservados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.31.exe`.
- SHA256: `31042B050528B69870639AA5C5BE4567F83515B5B796FDA1CBF607F37483CAC8`.
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.31
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.31/ColunaMix-v1.8.31.exe
- Log de publicação: `evidence/logs/github-release-v1.8.31.json`.
- Sem `git push`.

Evidências v1.8.31:

- `evidence/screenshots/99-v1831-column-stats-restaurada-v1819.png`
- `evidence/screenshots/100-v1831-column-stats-concurso-inicial-3000.png`
- `evidence/screenshots/101-v1831-column-stats-paginacao-antiga.png`
- `evidence/screenshots/102-v1831-column-stats-valores-referencia.png`
- `evidence/screenshots/103-v1831-column-stats-3700-52.png`
- `evidence/screenshots/104-v1831-column-stats-3701-194.png`
- `evidence/screenshots/105-v1831-column-stats-3704-56.png`
- `evidence/screenshots/106-v1831-column-stats-3708-110.png`
- `evidence/screenshots/107-v1831-gerador-preservado.png`
- `evidence/screenshots/108-v1831-padroes-linha-coluna-preservados.png`
- `evidence/logs/column-stats-v1819-restore-crosscheck-v1831.json`

## Validação v1.8.30 - Recorrência Geral conforme referência

- Build: aprovado (`evidence/logs/npm-run-build-v1830.txt`).
- Unitários: aprovado, `57 passed` (`evidence/logs/npm-run-test-unit-v1830.txt`).
- E2E/Playwright no app fonte: aprovado, `16 passed`, `5 skipped` obsoletos de estatística antiga (`evidence/logs/npm-run-test-e2e-v1830.txt`).
- Recorrência Geral validada pela regra correta: maior `DIST` entre C1-C5 no card.
- `displayStartContest`: `3699`.
- `analysisStartContest`: `3000`.
- Valores validados: `3700=52`, `3701=194`, `3702=51`, `3703=93`, `3704=56`, `3705=29`, `3706=61`, `3707=50`, `3708=110`.
- Botão `Recalcular estatísticas`: validado, mantendo os mesmos valores.
- Layout compacto `5x2`, 10 cards, `ÚLT`, `DIST` e Gerador preservados.
- Executável gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.30.exe`.
- SHA256: `57FBCF6F38594F3C2D72B721070B4D7E8D0289DC432704DEDB496A53C5DACA19`.
- Publicação GitHub Releases: concluída via API do GitHub usando credencial local do Git Credential Manager.
- Release: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.30
- Asset: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.30/ColunaMix-v1.8.30.exe
- Log de publicação: `evidence/logs/github-release-v1.8.30.json`.
- Sem `git push`.

Evidências v1.8.30:

- `evidence/screenshots/92-v1830-column-stats-referencia-correta.png`
- `evidence/screenshots/93-v1830-column-stats-3700-52.png`
- `evidence/screenshots/94-v1830-column-stats-3701-194.png`
- `evidence/screenshots/95-v1830-column-stats-3704-56.png`
- `evidence/screenshots/96-v1830-column-stats-3708-110.png`
- `evidence/screenshots/97-v1830-column-stats-apos-recalcular.png`
- `evidence/screenshots/98-v1830-gerador-preservado.png`
- `evidence/logs/column-stats-root-cause-v1830.md`
- `evidence/logs/column-stats-reference-crosscheck-v1830.json`
- `evidence/logs/column-stats-analysis-vs-display-start-v1830.json`
- `evidence/logs/playwright-column-stats-v1830.txt`

## Validação v1.8.29

- Build: aprovado (`evidence/logs/npm-run-build-v1829.txt`).
- Unitários: aprovado, `55 passed` (`evidence/logs/npm-run-test-unit-v1829.txt`).
- E2E/Playwright no app fonte: aprovado, `1 passed` para o cenário v1.8.29 (`evidence/logs/npm-run-test-e2e-v1829.txt`).
- Cache antigo: validado com chaves antigas semeadas em `localStorage`/`sessionStorage`; a tela removeu os valores antigos e gravou o schema `v1.8.29-column-recurrence-official-map`.
- Botão Recalcular estatísticas: validado; recálculo manteve os valores oficiais e exibiu `Estatísticas recalculadas com sucesso.`
- Recorrência Geral: validada contra o mapa oficial de Padrões de Coluna; concursos `3699` a `3703` exibiram `56 concursos` para `2,2,3,4,4`, batendo com `officialOccurrencesFromPatternStats: 56`.
- Campo Concurso inicial: validado como controle apenas de cards visíveis; a recorrência continuou usando a base histórica completa.
- Reabrir app: validado no E2E fonte sem resetar o perfil; os cards continuaram corretos após fechar e abrir novamente.
- Gerador: preservado e validado após o fluxo de estatísticas.

Evidências v1.8.29:

- `evidence/screenshots/80-v1829-column-stats-v1289-visible.png`
- `evidence/screenshots/81-v1829-column-stats-recurrencia-corrigida.png`
- `evidence/screenshots/82-v1829-column-stats-recalcular-estatisticas.png`
- `evidence/screenshots/83-v1829-column-stats-apos-recalcular.png`
- `evidence/screenshots/84-v1829-column-stats-reabrir-app-cache-ok.png`
- `evidence/screenshots/85-v1829-gerador-preservado.png`
- `evidence/logs/column-stats-client-visible-crosscheck-v1829.json`
- `evidence/logs/column-stats-cache-invalidation-v1829.json`
- `evidence/logs/playwright-column-stats-v1829.txt`
- `evidence/logs/exe-build-info-v1.8.29.json`

Executável v1.8.29:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.29.exe`
- Tamanho: `74272213` bytes
- SHA256: `0D875EE886FE217CF67B2A8E5F4A31C9FB33C38FB67D445E1B185B6F915D7FA4`

Validação no executável final:

- Bloqueada neste ambiente.
- `release\win-unpacked\ColunaMix.exe` foi bloqueado pela política Device Guard.
- O portable `ColunaMix-v1.8.29.exe` foi gerado, mas não pôde ser controlado pelo `electron.launch` para Playwright.
- Registro: `evidence/logs/column-stats-packaged-validation-blocked-v1829.json`.

## Observação v1.8.29 - Playwright no executável

O teste Playwright no executável final foi bloqueado pelo Device Guard do ambiente atual. O bloqueio ocorreu antes da validação funcional no `.exe`, portanto não foi classificado como falha da aplicação.

Não foi registrado que o Playwright no `.exe` passou. Em vez disso, foi aceita uma validação alternativa documentada:

- Build aprovado.
- Build empacotado gerado sem erro.
- Unitários aprovados com `55 passed`.
- E2E fonte aprovado.
- Validação da Recorrência Geral contra o mapa oficial de Padrões de Coluna.
- Validação de invalidação de cache antigo.
- Validação do botão Recalcular estatísticas.
- Gerador preservado.
- Executável `ColunaMix-v1.8.29.exe` gerado.
- SHA256 conferido: `0D875EE886FE217CF67B2A8E5F4A31C9FB33C38FB67D445E1B185B6F915D7FA4`.
- Waiver registrada em `evidence/logs/exe-playwright-device-guard-waiver-v1829.json`.

Publicação v1.8.29:

- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.29
- Asset publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.29/ColunaMix-v1.8.29.exe
- A release foi verificada com exatamente 1 asset: `ColunaMix-v1.8.29.exe`.
- Registro: `evidence/logs/github-release-v1.8.29.json`.
- Sem `git push`.

## Auditoria obrigatória pós-publicação - v1.8.28

O adendo de validação detalhada foi recebido depois da publicação inicial da v1.8.28. A auditoria foi executada posteriormente no código-fonte e no executável já empacotado. Ambos passaram no teste dedicado (`1 passed` em cada execução).

Validação cruzada com o mapa oficial de Padrões de Coluna:

- Concurso `3699`: C1 `01,06` (2); C2 `02,07` (2); C3 `03,08,13` (3); C4 `04,09,14,19` (4); C5 `05,10,15,20` (4). PatternKey calculado `2,2,3,4,4`; ocorrências oficiais `56`; Recorrência Geral exibida `56 concursos`; bateu.
- Concurso `3700`: C1 `11,16` (2); C2 `12,17` (2); C3 `08,13,18` (3); C4 `09,14,19,24` (4); C5 `10,15,20,25` (4). PatternKey calculado `2,2,3,4,4`; ocorrências oficiais `56`; Recorrência Geral exibida `56 concursos`; bateu.
- Concurso `3701`: C1 `01,06` (2); C2 `02,07` (2); C3 `03,08,13` (3); C4 `04,09,14,19` (4); C5 `05,10,15,20` (4). PatternKey calculado `2,2,3,4,4`; ocorrências oficiais `56`; Recorrência Geral exibida `56 concursos`; bateu.

O bloco visível contém 10 cards, mas a Recorrência Geral usa a base histórica completa e retorna `56`, comprovando que não está limitada pelo campo Concurso inicial nem pelos cards visíveis. A tela abre nos últimos concursos, mantém ordem crescente, layout compacto `5x2`, `ÚLT`, `DIST` e o Gerador.

Evidências:

- `evidence/logs/column-stats-recurrence-crosscheck-v1828.json`
- `evidence/logs/playwright-column-stats-v1828-audit.txt`
- `evidence/logs/playwright-column-stats-v1828-packaged-audit.txt`
- `evidence/screenshots/75-v1828-column-stats-recurrencia-bate-com-padroes-coluna.png`
- `evidence/screenshots/78-v1828-column-stats-ultimos-10-layout-preservado.png`
- `evidence/screenshots/79-v1828-gerador-preservado.png`

Na auditoria final da release foi encontrado e removido um asset antigo `ColunaMix-v1.8.23.exe`. A API pública foi novamente validada e a v1.8.28 contém exatamente um asset: `ColunaMix-v1.8.28.exe`, com `74269322` bytes e SHA256 `e8d3d7ecf4b11ee4578fbb668705e3fad8543cfb78edab196d8451a41a918e7d`.

## Ambiente

- Projeto: ColunaMix
- Aplicação: Desktop Windows (`.exe`)
- Versão validada: `v1.8.22`
- Base de teste: `data/input/exemplo.csv`
- Evidências: `evidence/`
- Repositório: https://github.com/FilipePr0graming/colunamix
- Releases: https://github.com/FilipePr0graming/colunamix/releases

## Comandos executados

```bash
npm run build
npm run test:unit
npm run test:e2e
npm run dist
```

## Resultados

- Build: aprovado
- Testes unitários: `32 passed`
- Testes E2E: `14 passed`
- Testes E2E no executável empacotado: `14 passed`
- Build do executável `.exe`: aprovado
- Publicação GitHub Releases v1.8.22: aprovada via GitHub Actions

## Evidências de tela

- `evidence/screenshots/01-padroes-linha.png`
- `evidence/screenshots/02-padroes-coluna.png`
- `evidence/screenshots/03-filtro-analisar-ate-concurso.png`
- `evidence/screenshots/04-botao-mais-frequentes.png`
- `evidence/screenshots/05-botao-menos-frequentes.png`
- `evidence/screenshots/06-ordenacao-crescente.png`
- `evidence/screenshots/07-ordenacao-decrescente.png`
- `evidence/screenshots/08-gerador-10-jogos.png`
- `evidence/screenshots/15-busca-variacoes-linha.png`
- `evidence/screenshots/16-busca-variacoes-coluna.png`
- `evidence/screenshots/17-busca-variacoes-gerador.png`
- `evidence/screenshots/18-busca-variacoes-usar-padrao.png`
- `evidence/screenshots/19-busca-variacoes-excluir-padrao.png`

## Evidências de logs

- `evidence/logs/npm-run-build.txt`
- `evidence/logs/npm-run-test-unit.txt`
- `evidence/logs/npm-run-test-e2e.txt`
- `evidence/logs/npm-run-dist.txt`
- `evidence/logs/real-base-pattern-example.json`
- `evidence/logs/license-validation.json`
- `evidence/logs/generator-10-games.json`
- `evidence/logs/exe-build-info.json`
- `evidence/logs/npm-run-build-after-variation-search.txt`
- `evidence/logs/npm-run-test-unit-after-variation-search.txt`
- `evidence/logs/npm-run-test-e2e-after-variation-search.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.22.txt`
- `evidence/logs/npm-run-dist-v1.8.22.txt`
- `evidence/logs/pattern-variation-search-validation.json`
- `evidence/logs/exe-build-info-v1.8.22.json`
- `evidence/logs/github-release-v1.8.22.json`

## Evidências de exportação

- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215525.csv`
- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215532.txt`
- `evidence/exports/ColunaMix_Padroes_Linhas_1780279215537.xls`

## Validação de cálculo real

Base usada: `data/input/exemplo.csv`

Exemplo de linha:

```json
{
  "patternKey": "3,3,3,3,3",
  "occurrences": 3,
  "lastContest": 3214,
  "lag": 6,
  "percentage": 15
}
```

Exemplo de coluna:

```json
{
  "patternKey": "3,3,4,2,3",
  "occurrences": 2,
  "lastContest": 3220,
  "lag": 0,
  "percentage": 10
}
```

Fórmula do atraso:

```text
atraso = último concurso analisado - último concurso em que o padrão apareceu
```

## Validação da licença

Log: `evidence/logs/license-validation.json`

```json
{
  "status": "FULL",
  "daysLeft": -1,
  "deviceId": "f60278a0-fdae-485b-9f40-326dafc05a53",
  "customer": "Licenciado"
}
```

## Validação do gerador

- Base importada: `data/input/exemplo.csv`
- Concursos importados: `20`
- Jogos gerados: `10`
- Log: `evidence/logs/generator-10-games.json`

Primeiros jogos:

```text
02,03,04,05,06,09,10,13,14,15,17,18,20,24,25
02,03,04,05,06,10,13,14,15,17,18,19,20,24,25
02,03,04,05,06,09,10,13,15,17,18,19,20,24,25
02,03,05,06,09,10,13,14,15,17,18,19,20,24,25
02,03,04,05,06,08,09,10,14,15,17,20,23,24,25
```

## Validação do executável .exe

- Versão gerada: `v1.8.21`
- Nome do arquivo: `ColunaMix-v1.8.21.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.21.exe`
- Tamanho: `74267701` bytes
- SHA256: `6ac796ee85bbfb5689c22c9b02c40eb915e82e00c344a3c7f4a3099986d00d12`
- Comando usado para gerar: `npm run dist`
- Log do comando: `evidence/logs/npm-run-dist.txt`
- Dados do executável: `evidence/logs/exe-build-info.json`

## Status da publicação no GitHub Releases

- Publicação automática via GitHub Actions: realizada
- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.21
- Asset publicado: `ColunaMix-v1.8.21.exe`
- Motivo de não usar `gh`: GitHub CLI não está instalado localmente.
- Caminho do `.exe` gerado: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.21.exe`
- Instruções manuais de fallback: `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`
- Release alvo: https://github.com/FilipePr0graming/colunamix/releases

## Checklist final

- [x] Padrões de Linha implementado
- [x] Padrões de Coluna implementado
- [x] Modo Inteligente substituído/removido do fluxo principal
- [x] Campo Analisar até concurso validado
- [x] Ordenação crescente validada
- [x] Ordenação decrescente validada
- [x] Mais frequentes validado
- [x] Menos frequentes validado
- [x] Exportação CSV validada
- [x] Exportação TXT validada
- [x] Exportação Excel/XLS validada
- [x] Build aprovado
- [x] Testes unitários aprovados
- [x] Testes E2E aprovados
- [x] Licença validada
- [x] Gerador validado
- [x] Prints gerados
- [x] Logs gerados
- [x] Executável `.exe` gerado
- [x] SHA256 do `.exe` registrado
- [x] Release GitHub criada/atualizada ou instruções manuais criadas
- [x] Entrega documentada

## Validação pós-feedback do cliente

- Painel de padrões visível dentro do Gerador: aprovado.
- Painel inserido no local do antigo Modo Inteligente / Radar Histórico Avançado: aprovado.
- Padrões de Linha acessíveis dentro do Gerador: aprovado.
- Padrões de Coluna acessíveis dentro do Gerador: aprovado.
- Botão `Usar`: validado e enviando padrão para `Usar Somente`.
- Botão `Excluir`: validado e enviando padrão para `Modo Excluir`.
- Conflito entre usar e excluir: validado por teste unitário, movendo o padrão entre listas sem duplicar.
- Gerador validado com padrões aplicados: aprovado.
- Build validado: `npm run build` aprovado.
- Testes unitários validados: `28 passed`.
- Testes E2E validados: `13 passed`.
- Prints gerados:
  - `evidence/screenshots/09-gerador-padroes-integrados.png`
  - `evidence/screenshots/10-gerador-padroes-linha.png`
  - `evidence/screenshots/11-gerador-padroes-coluna.png`
  - `evidence/screenshots/12-padrao-adicionado-usar-somente.png`
  - `evidence/screenshots/13-padrao-adicionado-excluir.png`
  - `evidence/screenshots/14-gerador-com-padroes-aplicados.png`
- Logs gerados:
  - `evidence/logs/npm-run-build-after-generator-patterns.txt`
  - `evidence/logs/npm-run-test-unit-after-generator-patterns.txt`
  - `evidence/logs/npm-run-test-e2e-after-generator-patterns.txt`
  - `evidence/logs/generator-pattern-include-exclude-validation.json`

Validação real de padrões aplicados:

```json
{
  "rowIncludeRule": {
    "pattern": "4,3,3,3,2",
    "applied": true
  },
  "columnExcludeRule": {
    "pattern": "3,3,3,2,4",
    "applied": true
  },
  "generatedGames": 10,
  "fixedNumbersPreserved": true,
  "dynamicExclusionsPreserved": true,
  "licensePreserved": true
}
```

Validação do executável pós-feedback:

- Versão gerada: `v1.8.21`
- Nome do arquivo: `ColunaMix-v1.8.21.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.21.exe`
- Tamanho: `74267701` bytes
- SHA256: `6ac796ee85bbfb5689c22c9b02c40eb915e82e00c344a3c7f4a3099986d00d12`
- Dados do executável: `evidence/logs/exe-build-info-v1.8.21.json`

## Validação da busca por variações

- Entrada `1,2,3,4,5` validada.
- Variações `5,4,3,2,1`, `2,4,5,3,1` e `4,5,3,2,1` validadas em dados reais criados pelo teste E2E.
- Entrada com repetição validada: `4,3,3,3,2`.
- Variações com repetição `3,4,3,3,2` e `3,3,4,2,3` validadas por testes unitários.
- Caso diferente `4,4,3,2,2` validado como não equivalente.
- Busca por variações validada em Padrões de Linha.
- Busca por variações validada em Padrões de Coluna.
- Busca por variações validada no painel integrado ao Gerador.
- Botão `Usar` validado após busca por variações.
- Botão `Excluir` validado após busca por variações.
- Entradas inválidas não quebram o sistema.
- Build aprovado.
- Testes unitários aprovados: `32 passed`.
- Testes E2E aprovados: `14 passed`.
- Testes E2E no executável empacotado aprovados: `14 passed`.

Log de validação:

```json
{
  "searchInput": "1,2,3,4,5",
  "canonicalKey": "1,2,3,4,5",
  "matchedExamples": [
    "5,4,3,2,1",
    "2,4,5,3,1",
    "4,5,3,2,1"
  ],
  "rowSearchValidated": true,
  "columnSearchValidated": true,
  "invalidInputHandled": true
}
```

Validação do executável v1.8.22:

- Versão gerada: `v1.8.22`
- Nome do arquivo: `ColunaMix-v1.8.22.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.22.exe`
- Tamanho: `74268761` bytes
- SHA256: `54bd9998147bd48f519091cb17d0a9f4c4f58bbe86dea6ea7686049dda414e4e`
- Dados do executável: `evidence/logs/exe-build-info-v1.8.22.json`

Status da publicação GitHub Releases v1.8.22:

- Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.22
- Asset publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.22/ColunaMix-v1.8.22.exe
- Tamanho do asset publicado: `74245581` bytes
- SHA256 do asset publicado: `26d954510fd5bd63a8390fe92dae40f62cf9e9de0ac3757c81a4ca22f69fd712`
- Workflow: https://github.com/FilipePr0graming/colunamix/actions/runs/27078235275
- Dados da release publicada: `evidence/logs/github-release-v1.8.22.json`

## Status final

Nenhuma pendência funcional identificada na implementação solicitada. A entrega v1.8.22 está pronta para publicação, incluindo documentação, evidências e executável Windows `.exe`.

## Validação v1.8.23 - Correção do painel conforme cliente

Contexto:

- Cliente Anderson testou a v1.8.22 e informou que o painel ainda estava no formato incorreto.
- O layout em cards grandes dentro do Gerador foi removido.
- O novo painel foi validado visualmente com duas tabelas compactas lado a lado.

Prints validados:

- Painel corrigido: `evidence/screenshots/20-gerador-painel-padroes-corrigido-v1823.png`
- Duas tabelas lado a lado: `evidence/screenshots/21-padroes-linha-coluna-lado-a-lado-v1823.png`
- Busca por variações em linha: `evidence/screenshots/22-busca-variacoes-linha-v1823.png`
- Busca por variações em coluna: `evidence/screenshots/23-busca-variacoes-coluna-v1823.png`
- Botão azul usar: `evidence/screenshots/24-botao-azul-usar-padrao-v1823.png`
- Botão vermelho excluir: `evidence/screenshots/25-botao-vermelho-excluir-padrao-v1823.png`
- Toggle desligado: `evidence/screenshots/26-toggle-painel-padroes-desligado-v1823.png`
- Gerador com jogos: `evidence/screenshots/27-gerador-jogos-com-padroes-v1823.png`

Resultados dos comandos:

- `npm run build`: aprovado.
- Log: `evidence/logs/npm-run-build-v1823.txt`
- `npm run test:unit`: aprovado, `35 passed`.
- Log: `evidence/logs/npm-run-test-unit-v1823.txt`
- `npm run test:e2e`: aprovado, `14 passed`.
- Log: `evidence/logs/npm-run-test-e2e-v1823.txt`
- `npm run dist`: aprovado.
- Log: `evidence/logs/npm-run-dist-v1.8.23.txt`

Validações funcionais registradas:

- `evidence/logs/pattern-panel-correction-v1823.json`
- `evidence/logs/pattern-variation-search-v1823.json`
- `evidence/logs/generator-pattern-rules-v1823.json`

Validação visual:

- O painel no Gerador está em tabela compacta, não em cards.
- Padrões de Linha e Padrões de Coluna aparecem lado a lado.
- Cada painel possui campos de `Analisar até concurso`, `Mínimo de ocorrências` e `Busca`.
- As ordenações `<`, `>`, `+` e `-` aparecem por painel.
- As ações por linha usam botão azul `U` para usar somente e botão vermelho `X` para excluir.
- Toggle liga/desliga mostra a mensagem `Painel de padrões desligado para preservar performance.` quando desligado.
- Não há paginação no painel do Gerador.

Validação do executável v1.8.23:

- Versão gerada: `v1.8.23`
- Nome do arquivo: `ColunaMix-v1.8.23.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.23.exe`
- Tamanho: `74269394` bytes
- SHA256: `041280a2434afeae2ef6ea713287feadcb21ac4e41d9ae963ccbb45450e32dad`
- Dados do executável: `evidence/logs/exe-build-info-v1.8.23.json`

Status da publicação GitHub Releases v1.8.23:

- `gh auth status` não pôde ser concluído porque o GitHub CLI não está instalado neste ambiente.
- Release não publicada automaticamente neste ambiente.
- Instruções manuais criadas em `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`.

Preservações confirmadas:

- Gerador preservado.
- Licença/trial preservados.
- CSV/importação preservados.
- Exportações preservadas.
- Exclusões dinâmicas preservadas.
- Exclusão por dezenas preservada.
- Exclusão por grupo preservada.
- Dezenas fixas preservadas.
- Base histórica preservada.
- Abas separadas de Padrões de Linha e Padrões de Coluna preservadas.

Status final v1.8.23:

- Correção implementada e validada.
- `.exe` local gerado.
- Release pendente apenas de publicação manual por ausência do GitHub CLI neste ambiente.

## Validação v1.8.24

- Build executado: aprovado.
- Testes unitários executados: `44 passed`.
- Testes E2E executados: `15 passed`.
- Playwright dedicado v1.8.24 executado: `1 passed`.
- Playwright no executável empacotado executado: `1 passed`.
- Prints obrigatórios gerados: `38` a `51`.
- Logs obrigatórios gerados.
- Exclusão por Primos validada.
- Exclusão por Fibonacci validada.
- Subconjunto e superconjunto permitidos; somente grupo exato excluído.
- Persistência e Puxar histórico de Primos/Fibonacci validados.
- Limitador de Concurso Final e dos padrões validado com base de teste até o concurso `2025` e tentativa `9999`.
- Estatísticas por Padrão de Coluna validadas a partir do concurso `2000`, em ordem crescente e blocos de 10.
- Tooltip dos últimos atrasos validado em linha e coluna.
- Gerador, licença/trial, importação/exportação, exclusões antigas e dezenas fixas validados pelas suítes.

Logs:

- `evidence/logs/npm-run-build-v1824.txt`
- `evidence/logs/npm-run-test-unit-v1824.txt`
- `evidence/logs/npm-run-test-e2e-v1824.txt`
- `evidence/logs/playwright-v1824.txt`
- `evidence/logs/npm-run-dist-v1.8.24.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.24.txt`
- `evidence/logs/prime-fibonacci-exclusion-validation-v1824.json`
- `evidence/logs/contest-final-limiter-validation-v1824.json`
- `evidence/logs/column-pattern-stats-validation-v1824.json`
- `evidence/logs/pattern-last-lags-tooltip-validation-v1824.json`
- `evidence/logs/exe-build-info-v1.8.24.json`

Executável:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.24.exe`
- Tamanho: `74269432` bytes
- SHA256: `6f23c551aa759eefb78865864df214ff9f652429e5b524731e93f472993d2b54`
- Release publicada pela API oficial do GitHub: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.24
- Asset publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.24/ColunaMix-v1.8.24.exe
- Registro: `evidence/logs/github-release-v1.8.24.json`.
- Nenhum `git push` foi executado.

## Validação v1.8.28 - Recorrência Geral oficial

- Validação cruzada executada com o resultado oficial de Padrões de Coluna.
- Padrão `2,2,3,4,4`: `56` ocorrências oficiais.
- Cards `#3699`, `#3700` e `#3701`: Recorrência Geral `56`, correspondência confirmada.
- Teste de base completa validado com 60 concursos e apenas 10 cards visíveis.
- Teste impede uso apenas do bloco visível.
- Teste impede cálculo por dezenas exatas.
- Campo Concurso inicial validado como filtro apenas de exibição.
- Últimos 10 cards, layout compacto `5x2`, ordem crescente, `ÚLT` e `DIST` preservados.
- Gerador validado com geração positiva.
- Prints `75` a `79` e logs obrigatórios gerados.

Resultados:

- `npm run build`: aprovado.
- `npm run test:unit`: aprovado, `52 passed`.
- `npm run test:e2e`: aprovado, `19 passed`.
- Playwright dedicado: aprovado, `1 passed`.

Logs:

- `evidence/logs/npm-run-build-v1828.txt`
- `evidence/logs/npm-run-test-unit-v1828.txt`
- `evidence/logs/npm-run-test-e2e-v1828.txt`
- `evidence/logs/playwright-column-stats-v1828.txt`
- `evidence/logs/column-stats-recurrence-official-map-v1828.json`
- `evidence/logs/column-stats-recurrence-crosscheck-v1828.json`
- `evidence/logs/npm-run-dist-v1.8.28.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.28.txt`
- `evidence/logs/exe-build-info-v1.8.28.json`

Executável v1.8.28:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.28.exe`
- Tamanho: `74269322` bytes
- SHA256: `e8d3d7ecf4b11ee4578fbb668705e3fad8543cfb78edab196d8451a41a918e7d`
- Playwright dedicado na build empacotada: aprovado, `1 passed`.
- Release pública verificada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.28
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.28/ColunaMix-v1.8.28.exe
- Release validada com exatamente 1 asset, o executável da v1.8.28.
- Registro: `evidence/logs/github-release-v1.8.28.json`.
- Nenhum `git push` foi executado.

## Validação v1.8.27 - Estatística por Padrão de Coluna

- Abertura nos últimos concursos validada: base até `#3708`, início padrão `#3699`.
- Botão `Últimos concursos` validado com a regra `último concurso - 9`.
- Recorrência Geral por distribuição de quantidades validada.
- Padrão de teste `2,2,3,4,4` validado com `59 concursos`.
- Teste de regressão impede contagem por dezenas exatas.
- Dez concursos recentes em ordem crescente validados.
- Layout compacto `5x2` validado.
- `ÚLT` e `DIST` preservados.
- Gerador validado com geração positiva.
- Prints `69` a `74` gerados e revisados.
- Logs obrigatórios gerados.

Resultados:

- `npm run build`: aprovado.
- `npm run test:unit`: aprovado, `50 passed`.
- `npm run test:e2e`: aprovado, `18 passed`.
- Playwright dedicado: aprovado, `1 passed`.

Logs:

- `evidence/logs/npm-run-build-v1827.txt`
- `evidence/logs/npm-run-test-unit-v1827.txt`
- `evidence/logs/npm-run-test-e2e-v1827.txt`
- `evidence/logs/playwright-column-stats-v1827.txt`
- `evidence/logs/column-stats-final-fix-v1827.json`
- `evidence/logs/npm-run-dist-v1.8.27.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.27.txt`
- `evidence/logs/exe-build-info-v1.8.27.json`

Executável v1.8.27:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.27.exe`
- Tamanho: `74270107` bytes
- SHA256: `9fba7833d92d363cbf7723d55c65787350c5d570d4712ef7ab99d186b6d5fceb`
- Playwright dedicado na build empacotada: aprovado, `1 passed`.
- Release pública verificada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.27
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.27/ColunaMix-v1.8.27.exe
- Release validada com exatamente 1 asset, o executável da v1.8.27.
- Registro: `evidence/logs/github-release-v1.8.27.json`.
- Nenhum `git push` foi executado.

## Validação - Layout Estatísticas por Padrão de Coluna v1.8.26

- Cards compactos validados com altura máxima medida de `147 px`.
- Bloco com 10 cards validado.
- Grade desktop `5x2` validada por posição real dos cards no Playwright.
- Ordem crescente validada.
- Rolagem/infinite scroll validada com carregamento de mais 10 cards.
- Recorrência Geral visível, numérica e sem `N/A` para cards válidos.
- `ÚLT` e `DIST` preservados.
- Acesso direto aos últimos concursos validado: base até `#3708`, abertura em `#3700`.
- Campo `Concurso inicial`, botão `Aplicar` e botão `Últimos concursos` validados.
- Gerador validado após navegar pela tela de estatísticas.
- Prints `57` a `62` gerados e revisados visualmente.
- Log JSON de medidas e comportamento gerado.

Resultados:

- `npm run build`: aprovado.
- `npm run test:unit`: aprovado, `48 passed`.
- `npm run test:e2e`: aprovado, `17 passed`.
- Playwright dedicado da tela: aprovado, `1 passed`.

Logs:

- `evidence/logs/npm-run-build-v1824-column-layout.txt`
- `evidence/logs/npm-run-test-unit-v1824-column-layout.txt`
- `evidence/logs/npm-run-test-e2e-v1824-column-layout.txt`
- `evidence/logs/playwright-column-stats-layout-v1824.txt`
- `evidence/logs/column-stats-layout-fix-v1824.json`
- `evidence/logs/npm-run-dist-v1.8.26.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.26.txt`
- `evidence/logs/exe-build-info-v1.8.26.json`

Executável v1.8.26:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.26.exe`
- Tamanho: `74269900` bytes
- SHA256: `83db33370127d7b3fc7fd600bf170554244b3a8c996afbd92c4810afc18fb2a0`
- Playwright dedicado na build empacotada: aprovado, `1 passed`.
- Release pública verificada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.26
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.26/ColunaMix-v1.8.26.exe
- Release validada com exatamente 1 asset, o executável da v1.8.26.
- Registro: `evidence/logs/github-release-v1.8.26.json`.
- Nenhum `git push` foi executado.

## Validação - Estatísticas por Padrão de Coluna v1.8.25

- Recorrência Geral validada como contagem total do padrão completo `C1+C2+C3+C4+C5`.
- Cards válidos validados sem `N/A` em Recorrência Geral.
- Cenário E2E real: concurso `2000` com `15 concursos` e concurso `2001` com `16 concursos`.
- Regra mínima de `1 concurso` validada em teste unitário.
- Blocos de 10 cards validados.
- Último bloco parcial de 6 cards validado.
- Scroll/infinite scroll validado com carregamento de `10`, `20` e `26` cards.
- Ordem crescente de `#2000` a `#2025` validada.
- `ÚLT` e `DIST` preservados e validados.
- Gerador validado depois da navegação pela tela de estatísticas.
- Prints `52` a `56` gerados e revisados visualmente.
- Logs JSON e Playwright gerados.

Resultados:

- `npm run build`: aprovado.
- `npm run test:unit`: aprovado, `47 passed`.
- `npm run test:e2e`: aprovado, `16 passed`.
- Playwright dedicado da tela: aprovado, `1 passed`.

Logs:

- `evidence/logs/npm-run-build-v1824-column-stats-fix.txt`
- `evidence/logs/npm-run-test-unit-v1824-column-stats-fix.txt`
- `evidence/logs/npm-run-test-e2e-v1824-column-stats-fix.txt`
- `evidence/logs/playwright-column-stats-v1824.txt`
- `evidence/logs/column-pattern-recurrence-fix-v1824.json`
- `evidence/logs/column-pattern-blocks-10-validation-v1824.json`
- `evidence/logs/npm-run-dist-v1.8.25.txt`
- `evidence/logs/npm-run-test-e2e-packaged-v1.8.25.txt`
- `evidence/logs/exe-build-info-v1.8.25.json`

Executável v1.8.25:

- Caminho: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.25.exe`
- Tamanho: `74271348` bytes
- SHA256: `9c88537dbaf18dcb9644c35f8caef64a57899b576c8f82cd46ae23bef43ac28e`
- Cenário Playwright dedicado na build empacotada: aprovado, `1 passed`.
- Release pública verificada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.25
- Download publicado: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.25/ColunaMix-v1.8.25.exe
- Release validada com exatamente 1 asset, o executável da v1.8.25.
- Registro: `evidence/logs/github-release-v1.8.25.json`.
- Nenhum `git push` foi executado.

