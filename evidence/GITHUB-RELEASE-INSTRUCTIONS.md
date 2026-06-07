# GitHub Release Instructions - ColunaMix v1.8.22

Publicação automática não realizada neste ambiente porque o GitHub CLI (`gh`) não está instalado e não há `GITHUB_TOKEN`/`GH_TOKEN` disponível.

A API pública do GitHub foi consultada em 2026-06-06 e a release mais recente encontrada foi `v1.8.21`. A release `v1.8.22` ainda precisa ser criada/publicada.

## Arquivo obrigatório da release

- Arquivo: `ColunaMix-v1.8.22.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.22.exe`
- Tamanho: `74268761` bytes
- SHA256: `54bd9998147bd48f519091cb17d0a9f4c4f58bbe86dea6ea7686049dda414e4e`

## Publicação via GitHub UI

1. Acesse: https://github.com/FilipePr0graming/colunamix/releases
2. Clique em `Draft a new release`.
3. Em `Choose a tag`, informe `v1.8.22`.
4. Se a tag ainda não existir, escolha criar a nova tag a partir da branch principal.
5. Em `Release title`, informe `ColunaMix v1.8.22`.
6. Anexe o arquivo:
   `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.22.exe`
7. Cole o changelog abaixo.
8. Clique em `Publish release`.

## Publicação via workflow

O repositório possui `.github/workflows/release.yml`. Também é possível publicar por:

- push da tag `v1.8.22`; ou
- execução manual do workflow `Build & Release (Windows)` com `release_tag=v1.8.22`.

## Changelog sugerido

ColunaMix v1.8.22

- Implementada busca por variações de padrões.
- Ao pesquisar `1,2,3,4,5`, o sistema encontra padrões equivalentes em outras ordens, como `5,4,3,2,1`.
- Busca por variações disponível para Padrões de Linha.
- Busca por variações disponível para Padrões de Coluna.
- Busca integrada ao painel de padrões dentro do Gerador.
- Repetições de valores são respeitadas na comparação.
- Entradas inválidas são tratadas sem travar a tela.
- Preservado funcionamento dos botões Usar e Excluir padrão.
- Preservado funcionamento do Gerador.
- Preservada licença/trial.
- Preservadas importação, exportação, exclusões e dezenas fixas.
- Build aprovado.
- Testes unitários aprovados: 32 passed.
- Testes E2E aprovados: 14 passed.
- Testes E2E no executável empacotado aprovados: 14 passed.

## Logs e evidências

- Build: `evidence/logs/npm-run-build-after-variation-search.txt`
- Testes unitários: `evidence/logs/npm-run-test-unit-after-variation-search.txt`
- Testes E2E: `evidence/logs/npm-run-test-e2e-after-variation-search.txt`
- Testes E2E no executável empacotado: `evidence/logs/npm-run-test-e2e-packaged-v1.8.22.txt`
- Build do executável: `evidence/logs/npm-run-dist-v1.8.22.txt`
- Dados do executável: `evidence/logs/exe-build-info-v1.8.22.json`
- Validação da busca: `evidence/logs/pattern-variation-search-validation.json`
