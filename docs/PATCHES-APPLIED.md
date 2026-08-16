# PATCHES APPLIED

## v1.8.40 - Correção da busca por sequência e limpeza global

- Busca por sequência agora aceita entrada sem vírgulas.
- `33` equivale a `3,3`.
- `334` equivale a `3,3,4`.
- `33423` equivale a `3,3,4,2,3`.
- Limpeza global corrigida segundo semântica do cliente.
- Dezenas fixas são limpas.
- Filtros/exclusões são limpos.
- Seleções de padrões são limpas.
- Grupos dos 10 quadros são limpos.
- Concurso Inicial, Concurso Final, Volume e K são preservados.
- Valores `CONC.` são preservados.
- Números-base das categorias são preservados.
- Recursos já corretos foram preservados: Busca normal, Busca por sequência com vírgula, Usar Todos, Excluir Todos, U/X individuais e ordem dos quadros.

## v1.8.39 - Busca por sequência, ações em massa, ordem dos quadros e limpeza segura

- Adicionada busca por sequência exata nos Padrões de Linha e Coluna.
- Busca anterior preservada e acumulada com a nova busca.
- Adicionados `Usar Todos` e `Excluir Todos` para Linha e Coluna.
- Ações em massa respeitam todos os filtros ativos e evitam duplicidades.
- Reorganizados os 10 quadros de Exclusão por Grupo de Dezenas.
- Limpeza das configurações das caixas preserva os números preenchidos.
- Build, unitários, E2E, Playwright e executável final validados.

## v1.8.38 - Somente Painel de Padrões dentro do Gerador

- Mantido o Painel de Padrões dentro do Gerador, conforme a referência visual da v1.8.35.
- Padrões de Linha e Padrões de Coluna permanecem lado a lado no painel integrado.
- Botões individuais U/X preservados para Linha e Coluna.
- Removidos os atalhos laterais independentes de Padrões de Linha e Padrões de Coluna.
- Removidos o botão, o modal e a lógica de Limpar Configurações adicionados na v1.8.37.
- Sidebar, Gerador e ordem dos quadros de exclusão mantidos como antes.
- Nenhuma alteração em backend, banco, regras do gerador, licença ou importação.
- Executável local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.38.exe`.
- SHA256: `BA5729D99D100927CF3B5B4BCDED19AF4367B3C421B8EE25FEF2509D5848E02E`.

## v1.8.37 - Painel de Padrões no Gerador e Limpar Configurações

- Restaurado/validado Painel de Padrões dentro do Gerador.
- Padrões de Linha e Padrões de Coluna voltaram a aparecer lado a lado no Gerador.
- Botões U/X preservados e funcionando.
- Linha continua aplicando em Linha.
- Coluna continua aplicando em Coluna.
- Criado botão Limpar Configurações.
- Limpar Configurações preserva números/dezenas digitadas.
- Concurso Inicial, Concurso Final, quantidade de dezenas e Volume de Apostas preservados.
- Regras temporárias são limpas com confirmação.
- Ordem dos quadros de exclusão não foi alterada.
- Build aprovado, unitários `79 passed`, E2E `21 passed`, `7 skipped`, Playwright dedicado aprovado.
- Executável: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.37.exe`.
- SHA256: `BB23A9B84A89CDD6B7E85AE059FD23F5493438AC1A970CA7AD8D7B1B7A8C2BB0`.
- Commit/push concluídos: `0335e6c`.
- Tag enviada: `v1.8.37`.
- Release bloqueada sem `gh`, sem `GITHUB_TOKEN/GH_TOKEN` e com retorno `404` da API pública.

## v1.8.36 - Restauração dos acessos Padrões de Linha e Padrões de Coluna

- Restaurados os acessos laterais para Padrões de Linha e Padrões de Coluna.
- Telas de análise de padrões voltaram a ficar acessíveis pela navegação.
- Botões individuais U/X preservados.
- Gerador preservado.
- Ordem dos quadros de exclusão não foi alterada.
- Não foi implementado botão em massa.
- Build aprovado, unitários `79 passed`, E2E `20 passed`, Playwright dedicado aprovado.
- Executável: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.36.exe`.
- SHA256: `984858294F84CDB4B6A032CF31ABD65714DA28923BA1444EDA90F8A3C88991BA`.
- Commit/push concluídos: `bcba371`.
- Tag enviada: `v1.8.36`.
- Release bloqueada sem `gh` e sem token GitHub no ambiente.

## v1.8.35 - Exclusão por Borda/Miolo Geral e otimização de performance

- Criado bloco `Borda - Grupos Gerais`.
- Criado bloco `Miolo - Grupos Gerais`.
- Adição manual, puxar histórico, limpar por bloco, remoção individual e persistência validados.
- Validação bloqueia Miolo na Borda e Borda no Miolo.
- Gerador integrado por comparação exata de subconjunto.
- Cache local de chaves por categoria reduz recálculos no gerador.
- Blocos antigos, Ímpares/Pares gerais, Gerador e licença preservados.
- Build aprovado, unitários `79 passed`, E2E `19 passed`, Playwright dedicado aprovado.
- Executável: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.35.exe`.
- SHA256: `66948B8A7350AD52C7D50EDE0BEF22907CE5E35AB2D4E0E548B3CAB6FA03BB97`.
- Release bloqueada por falta de `gh` e token GitHub no ambiente.

## v1.8.34 - Correção de preservação do modo Faixa Manual

- Corrigido bug onde o modo de seleção mudava sozinho para `Últimos N concursos`.
- `Faixa Manual (Concurso ID)` permanece selecionada ao navegar para Estatísticas por Padrão de Coluna.
- `Concurso Inicial` e `Concurso Final` são preservados.
- Estatísticas por Padrão de Coluna não sobrescreve o modo selecionado.
- Gerador preservado.
- Blocos `Números Ímpares` e `Números Pares` preservados.
- Executável: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.34.exe`.
- SHA256: `E6B84725F53F0B82C598191490D21C2063555BAD76AB6B3B051B535DC2CC8944`.
- Release: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.34
- Asset: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.34/ColunaMix-v1.8.34.exe
- Sem `git push`.

## v1.8.33 - Exclusão por grupos de Números Ímpares e Números Pares

- Criado bloco `Números Ímpares`.
- Criado bloco `Números Pares`.
- Adição manual, Puxar por concursos, Limpar local e remoção individual integrados.
- Persistência em `exactGroupExclusions`.
- Integração com o Gerador por comparação exata do subconjunto ímpar/par.
- Validação para aceitar somente ímpares no bloco Ímpares.
- Validação para aceitar somente pares no bloco Pares.
- Preservados Borda, Miolo, Primos, Fibonacci, Gerador e licença.
- Executável: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.33.exe`.
- SHA256: `320F49777AE15A3F6EEEB944E60441F9FB122E69371ACEA4607E1A362E3EF05B`.
- Release: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.33
- Asset: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.33/ColunaMix-v1.8.33.exe
- Sem `git push`.

## v1.8.32 - Histórico Técnico e manutenção preventiva

- Adicionado botão `Histórico Técnico` no sidebar.
- Criada tela de histórico técnico somente leitura.
- Registrada manutenção preventiva de `15/07/2026`.
- Adicionadas tags de prevenção, cache, estabilidade, gerador, estatísticas e correção.
- Registradas etapas técnicas revisadas.
- Gerador preservado.
- Padrões de Linha/Coluna preservados.
- Estatísticas preservadas.
- Validado com Playwright.

## Data

2026-06-15

## Objetivo

Criar estrutura local de orquestracao, regras e RAG leve para orientar proximas execucoes do Codex no projeto `eufilipesouza-site`.

## Arquivos Alterados

- A preencher a cada execucao.

## Antes

- Projeto sem base RAG local completa em `docs/rag/`.
- Projeto sem `AGENTS.md` permanente na raiz.
- Projeto sem regras locais `.codex/rules/default.rules`.

## Depois

- Estrutura RAG local criada.
- Regras permanentes criadas.
- Template de prompt e criterios de aceite adicionados.

## Riscos

- Nenhuma alteracao funcional de UI/backend foi intencional nesta etapa.

## Validacoes

- A preencher apos execucao de lint/build/Playwright.

## Observacoes

- Backend, banco, Prisma, API, deploy e rotas foram preservados.
