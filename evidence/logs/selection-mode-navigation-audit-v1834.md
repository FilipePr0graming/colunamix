# Auditoria v1.8.34 - Preservacao do modo de selecao na navegacao

1. Onde o modo de selecao e armazenado?

O modo de selecao do Gerador fica no estado local de `app/src/renderer/components/Generator.tsx`, em `mode`, com valores `lastN` e `range`. A persistencia fica no `localStorage`, na chave `colunamix_generator_settings`, junto com `lastN`, `rangeStart`, `rangeEnd` e demais configuracoes do Gerador.

2. Onde o modo e alterado?

O modo e alterado pelo `<select data-testid="generator-history-mode">` em `Generator.tsx`, chamando `setMode(e.target.value as 'lastN' | 'range')`. O modo tambem e restaurado pelo efeito de carga do `localStorage` e por importacao de configuracao.

3. Qual componente altera para Ultimos N concursos?

Nenhum componente de Estatisticas por Padrao de Coluna chama `setMode`. O valor volta para `lastN` porque o proprio `Generator` inicializa `mode` com `useState('lastN')` sempre que e remontado.

4. Ao abrir Estatisticas por Padrao de Coluna, algum useEffect reseta o modo?

`ColumnStats.tsx` nao acessa `mode`, `setMode`, `localStorage` do Gerador nem configuracoes do Gerador. O reset ocorre indiretamente pela troca de aba em `App.tsx`: `{tab === 'gerador' && <Generator />}` desmonta o Gerador. Ao voltar, o `Generator` remonta com estado inicial `lastN`.

5. O estado e global ou local?

O estado e local ao componente `Generator`. A unica ponte entre desmontagens e o `localStorage`.

6. Qual foi a causa raiz?

O `Generator` possui dois efeitos independentes: um carrega `colunamix_generator_settings` no mount, e outro persiste o estado atual. Na remontagem, o estado inicial e `lastN`; antes da restauracao efetiva estabilizar, o efeito de persistencia pode gravar o estado inicial e sobrescrever a configuracao salva de `range`, `rangeStart` e `rangeEnd`. Isso faz a navegacao para Estatisticas por Padrao de Coluna parecer mudar o modo para Ultimos N concursos.

7. Quais arquivos serao alterados?

- `app/src/renderer/components/Generator.tsx`
- `app/src/shared/generatorSettings.ts`
- `app/src/renderer/App.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/package.json`
- `app/package-lock.json`
- `app/tests/unit/generatorSettings.spec.ts`
- `app/tests/e2e/desktop.e2e.spec.ts`
- `PATCHES-APPLIED.md`
- `TEST-REPORT.md`
- `docs/PATCHES-APPLIED.md`
- `docs/TEST-REPORT.md`

Risco controlado: a correcao nao altera logica do Gerador, base historica, licenca, Estatisticas por Padrao de Coluna, nem os blocos de grupos exatos; apenas impede persistencia antes da hidratacao inicial do estado.
