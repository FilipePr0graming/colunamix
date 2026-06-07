# GitHub Release - ColunaMix v1.8.22

Publicação automática realizada via GitHub Actions em `v1.8.22`.

Release publicada: https://github.com/FilipePr0graming/colunamix/releases/tag/v1.8.22

## Asset publicado

- Arquivo: `ColunaMix-v1.8.22.exe`
- URL: https://github.com/FilipePr0graming/colunamix/releases/download/v1.8.22/ColunaMix-v1.8.22.exe
- Tamanho publicado: `74245581` bytes
- SHA256 publicado: `26d954510fd5bd63a8390fe92dae40f62cf9e9de0ac3757c81a4ca22f69fd712`
- Workflow: https://github.com/FilipePr0graming/colunamix/actions/runs/27078235275

## Build local validado

- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.22.exe`
- Tamanho local: `74268761` bytes
- SHA256 local: `54bd9998147bd48f519091cb17d0a9f4c4f58bbe86dea6ea7686049dda414e4e`

## Changelog

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
- Dados da release publicada: `evidence/logs/github-release-v1.8.22.json`
- Validação da busca: `evidence/logs/pattern-variation-search-validation.json`
