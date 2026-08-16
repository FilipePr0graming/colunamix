# v1.8.40 - Fix Scope Audit

## Escopo
- Corrigir somente busca por sequência sem vírgula.
- Corrigir somente a semântica de `Limpar Config. das Caixas`.
- Publicar nova versão `v1.8.40`.

## Correção 1
- Arquivo: `app/src/shared/patternStats.ts`.
- Função: `parsePatternSequenceInput`.
- Resultado: entradas compactas sem vírgula são interpretadas dígito a dígito.
- Mantido: entradas com vírgula, espaços e busca normal.

## Correção 2
- Arquivo: `app/src/renderer/components/Generator.tsx`.
- Função: `clearBoxConfigsPreservingNumbers`.
- Resultado: limpa `fixas`, `exclusions`, `patternIncludes`, `patternExclusions`, `exactGroupExclusions`, inputs temporários e erros temporários.
- Preservado: Concurso Inicial, Concurso Final, Volume, K, valores `CONC.` e números-base das categorias.

## Testes
- Unitários: `npm run test:unit` aprovado, 87 passed.
- E2E completo: `npm run test:e2e` aprovado, 22 passed e 7 skipped históricos.
- Playwright focado: `tests/e2e/final-client-fixes-v1840.spec.ts` aprovado.

## Evidências
- `evidence/logs/sequence-search-no-comma-v1840.json`
- `evidence/logs/clear-config-client-semantics-v1840.json`
- `evidence/logs/npm-run-build-v1840.txt`
- `evidence/logs/npm-run-test-unit-v1840.txt`
- `evidence/logs/npm-run-test-e2e-v1840.txt`
- `evidence/logs/playwright-v1840.txt`
- `evidence/screenshots/167-v1840-sequence-search-33-line.png` a `179-v1840-generator-final.png`
