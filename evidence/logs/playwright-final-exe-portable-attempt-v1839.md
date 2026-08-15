# Tentativa Playwright no Portable v1.8.39

- Alvo: `app/release/ColunaMix-v1.8.39.exe`.
- Resultado: `electron.launch` iniciou o processo, mas nao conseguiu anexar/obter a janela antes do timeout de 180000 ms.
- Causa raiz observada: o executavel portable gerado pelo Electron Builder nao se comporta como alvo controlavel pelo `electron.launch` neste ambiente, comportamento ja observado em validacoes historicas do projeto.
- Validacao adotada: o mesmo build final foi validado com `app/release/win-unpacked/ColunaMix.exe` usando `PW_TEST_USE_PACKAGED=true` e `PW_TEST_FORCE_UNPACKED=true`.
- Resultado validado: `1 passed` em `evidence/logs/playwright-final-exe-v1839.txt`.
