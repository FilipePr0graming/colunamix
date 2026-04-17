# ERRORS INDEX

| # | Erro | Causa Raiz | Correção | Status |
|---|------|-----------|---------|--------|
| 1 | `npm install` falha com `better-sqlite3` | `node-gyp` não encontra build tools do Python/Visual Studio | Substituído por JSON file storage — zero deps nativas | ✅ Resolvido |
| 2 | TS lint: "Cannot find module 'crypto'" | Falta `@types/node` no devDependencies | `npm install --save-dev @types/node` | ✅ Resolvido |
| 3 | Select/Dropdown cortado/ilegível no Electron | Radix UI `SelectContent` usa portal que cria stacking context. Combinado com `overflow: hidden` no container pai e `backdrop-filter: blur()` no `.glass-card`, o dropdown fica cortado ou invisível. Transformações CSS (`transform`, `backdrop-filter`) criam novos containing blocks para posicionamento fixo, quebrando o popper. | **Solução definitiva**: substituiu-se todos os `<Select>` (Radix/shadcn) por HTML nativo `<select>` e `<input>` com classes CSS `.native-select` e `.native-input`. HTML nativo funciona sem portais, sem z-index, sem bugs de stacking. Estilos via CSS puro (appearance: none + SVG arrow + dark theme colors). | ✅ Resolvido |
| 4 | Gerador retorna 0 jogos | `noRepeatDrawn` estava `true` por padrão. Com poucos concursos (ex: 20), as combinações do produto cartesiano frequentemente reconstroem os draws originais e são todos filtrados. | Default mudado para `false`. Adicionado debug logging no IPC handler e generator. | ✅ Resolvido |
