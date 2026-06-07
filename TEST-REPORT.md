# TEST REPORT - ColunaMix

## Resumo

A implementação foi validada com build, testes unitários, testes E2E, prints, logs, exportações, validação de licença, validação do gerador e geração do executável Windows `.exe`.

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
- Publicação GitHub Releases v1.8.22: não realizada automaticamente porque `gh` não está instalado e não há `GITHUB_TOKEN`/`GH_TOKEN` neste ambiente

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

- GitHub CLI (`gh`): não instalado.
- `GITHUB_TOKEN`/`GH_TOKEN`: não disponível.
- API pública consultada em 2026-06-06: release mais recente encontrada foi `v1.8.21`.
- Release `v1.8.22`: não publicada neste ambiente.
- Instruções manuais/workflow atualizadas: `evidence/GITHUB-RELEASE-INSTRUCTIONS.md`

## Status final

Nenhuma pendência funcional identificada na implementação solicitada. A entrega v1.8.22 está pronta para publicação, incluindo documentação, evidências e executável Windows `.exe`.

