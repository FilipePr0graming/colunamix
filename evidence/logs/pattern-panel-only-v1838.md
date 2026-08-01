# v1.8.38 - Painel de Padrões como antes

## Escopo aplicado

- Mantido somente o Painel de Padrões integrado ao Gerador mostrado na referência da v1.8.35.
- Mantidos Padrões de Linha e Padrões de Coluna lado a lado.
- Mantidos filtros, busca, mínimo de ocorrências, ordenação, toggle e ações individuais U/X.
- Removidos os acessos laterais independentes `Padrões de Linha` e `Padrões de Coluna` adicionados na v1.8.36.
- Removidos o botão `Limpar Config.`, seu modal e sua lógica adicionados na v1.8.37.

## Arquivos de produção alterados

- `app/src/renderer/App.tsx`
- `app/src/renderer/components/Generator.tsx`
- `app/src/renderer/components/StatusPage.tsx`
- `app/package.json`
- `app/package-lock.json`

## Garantias

- O componente do painel integrado não foi removido nem reorganizado.
- Os handlers U/X e a distinção entre Linha e Coluna não foram alterados.
- A ordem dos quadros de exclusão não foi alterada.
- Backend, banco, API, licença, importação e lógica principal do gerador não foram alterados.

## Validação

- Build: aprovado.
- Unitários: `79 passed`.
- Playwright focado: `1 passed`.
- E2E completo: `20 passed`, `7 skipped` históricos.
- Executável: `app/release/ColunaMix-v1.8.38.exe` (`74.273.141` bytes).
- SHA256: `BA5729D99D100927CF3B5B4BCDED19AF4367B3C421B8EE25FEF2509D5848E02E`.
- Evidências visuais:
  - `evidence/screenshots/161-v1838-painel-padroes-como-antes.png`
  - `evidence/screenshots/162-v1838-sidebar-original-e-gerador-preservados.png`

## Observação de teste

A primeira execução completa expôs uma corrida no reset de `localStorage` entre testes antigos: a Faixa Manual do caso anterior podia ser gravada novamente antes do reload. O bootstrap E2E passou a limpar o storage uma única vez no início do próximo documento. A reexecução completa passou.
