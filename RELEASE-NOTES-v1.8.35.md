ColunaMix v1.8.35

Nova atualização com a implementação da camada Borda + Miolo no gerador.

Novidades:
- Adicionado bloco Borda - Grupos Gerais.
- Adicionado bloco Miolo - Grupos Gerais.
- Cadastro manual de grupos.
- Busca de grupos por concursos anteriores.
- Validação das dezenas da Borda e do Miolo.
- Limpeza individual por bloco.
- Remoção individual de grupos.
- Salvamento dos grupos cadastrados.
- Integração direta com o gerador.
- Exclusão exata por subconjunto: Borda compara somente com Borda e Miolo compara somente com Miolo.

Performance:
- Otimização aplicada no processamento do gerador.
- Uso de Set de chaves e cache local por categoria.
- Redução de recálculos durante a geração.
- Nos testes, os fluxos principais do gerador ficaram abaixo de 1 segundo:
  - Abrir Gerador: 393 ms.
  - Renderizar Exclusão por Grupo de Dezenas: 525 ms.
  - Puxar Borda Geral: 404 ms.
  - Puxar Miolo Geral: 339 ms.
  - Gerar jogos: 388 ms.

Observação técnica:
A abertura total do Electron no ambiente de teste ficou em 15950 ms, então não prometer abertura total em 5 segundos. O ganho validado está nos fluxos principais do Gerador, que ficaram subsegundo nos testes.

Validação:
- Build aprovado.
- 79 testes unitários aprovados.
- 19 testes E2E aprovados.
- Playwright dedicado aprovado.

SHA256:
66948B8A7350AD52C7D50EDE0BEF22907CE5E35AB2D4E0E548B3CAB6FA03BB97

Asset da release:
ColunaMix-v1.8.35.exe
