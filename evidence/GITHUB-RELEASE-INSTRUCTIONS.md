# GitHub Release - ColunaMix v1.8.23

A publicação da release `v1.8.23` deve ser feita pelo workflow `.github/workflows/release.yml`, acionado por push da tag `v1.8.23`.

## Asset local validado

- Arquivo: `ColunaMix-v1.8.23.exe`
- Caminho local: `C:\Users\filip\Local Sites\colunamix\app\release\ColunaMix-v1.8.23.exe`
- Tamanho local: `74269394` bytes
- SHA256 local: `041280a2434afeae2ef6ea713287feadcb21ac4e41d9ae963ccbb45450e32dad`
- Dados do executável local: `evidence/logs/exe-build-info-v1.8.23.json`

## Workflow esperado

Ao enviar a tag:

```powershell
git push origin main
git push origin v1.8.23
```

O GitHub Actions executa:

- `npm ci`
- `npm run dist`
- upload do artefato `app/release/*.exe`
- criação/atualização da release `v1.8.23`
- anexo do asset `ColunaMix-v1.8.23.exe`

## Changelog usado pela release

O workflow usa `RELEASE-NOTES.md`, atualizado para:

ColunaMix v1.8.23

- Corrigido painel de padrões conforme PDF e feedback do cliente Anderson.
- Painel agora fica dentro do Gerador no local do antigo Modo Inteligente.
- Padrões de Linha e Padrões de Coluna exibidos lado a lado.
- Substituído layout em cards por tabelas compactas com scroll interno.
- Removida limitação visual de poucos padrões.
- Adicionados filtros por painel: analisar até concurso, mínimo de ocorrências e busca.
- Implementada busca por variações de padrão.
- Adicionadas ordenações: decrescente, crescente, maiores ocorrências e menores ocorrências.
- Botão azul adiciona padrão em usar somente.
- Botão vermelho adiciona padrão em excluir padrões.
- Adicionado toggle liga/desliga para preservar performance.
- Gerador validado com padrões aplicados.
- Preservados licença/trial, importação, exportação, exclusões e dezenas fixas.
- Build aprovado.
- Testes unitários aprovados.
- Testes E2E aprovados.

## Logs e evidências

- Build: `evidence/logs/npm-run-build-v1823.txt`
- Testes unitários: `evidence/logs/npm-run-test-unit-v1823.txt`
- Testes E2E: `evidence/logs/npm-run-test-e2e-v1823.txt`
- Build do executável local: `evidence/logs/npm-run-dist-v1.8.23.txt`
- Dados do executável local: `evidence/logs/exe-build-info-v1.8.23.json`
- Painel corrigido: `evidence/screenshots/20-gerador-painel-padroes-corrigido-v1823.png`
