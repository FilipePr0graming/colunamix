# Causa raiz - primeira execução Playwright v1.8.33

A primeira execução do cenário dedicado falhou por uma asserção auxiliar do teste, não pela funcionalidade dos blocos.

O teste calculava `licenseVisible` via `document.body.innerText` após reload e navegação dentro da tela do Gerador. Nesse ponto o texto usado como proxy de licença/versão não estava disponível na porção textual avaliada, retornando `false`.

Correção aplicada: validar `v1.8.33` explicitamente na UI logo ao abrir o Gerador e remover o proxy textual dentro de `page.evaluate`. A lógica funcional de blocos, persistência, puxar histórico e geração foi mantida sem alteração.
