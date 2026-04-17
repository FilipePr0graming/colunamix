# PROVAS DE VALIDAÇÃO

## 1. Bootstrap
```bash
cd app
node -v     # v25.6.1
npm -v      # 11.9.0
npm install # ✅ exit 0
npm run dev # ✅ Vite 5.4.21 + Electron abre janela
```

## 2. Banco de Dados
- Ao abrir app: cria `%APPDATA%/ColunaMix/state.json`
- Backup em `%LOCALAPPDATA%/ColunaMix/state.json`
- Na tela "Status": mostra caminho do DB, total de concursos

## 3. Importação CSV
```
1. Clique em "Importar CSV" no sidebar
2. Selecione data/input/exemplo.csv
3. Esperado: "20 concursos importados com sucesso!"
4. Tela Status mostra range 3201 → 3220
```

## 4. UI — Dropdowns e Inputs (CORRIGIDO)
```
1. Base: select nativo com 2 opções — "Últimos N concursos" e "Faixa (Do..Ao)"
   → Ao clicar, dropdown abre com opções legíveis em tema escuro
2. Dezenas/jogo (K): select nativo com opções 15..21
   → Ao clicar, lista aparece completa, sem corte
3. Máx. jogos: input numérico — pode digitar livremente
4. Fixas/Excluídas: inputs texto — aceita formato "01,16,21"
5. Slider de "Últimos N": valor mostrado ao lado + input numérico auxiliar
```

## 5. Gerador
```
1. Aba "Gerador" > Últimos 20 concursos > K=15 > Gerar
2. Esperado: lista de jogos com 15 dezenas cada
3. Nenhum jogo duplicado
4. Se fixas = "01,16", todos jogos contêm 01 e 16
5. Se excluídas = "05,10", nenhum jogo contém 05 ou 10
6. TRIAL: max 50 jogos (mostrar aviso "⚠ TRIAL: limitado a 50 jogos")
```

## 6. Export TXT
```
1. Após gerar jogos, clique "Exportar TXT"
2. Escolha local de salvamento
3. Abrir no Bloco de Notas:
   - TRIAL: primeira linha "# TRIAL - aguardando pagamento/ativacao"
   - FULL: sem watermark
   - Linhas: "01,02,03,...,15"
```

## 7. Segurança — TRIAL
```
1. Primeiro run: cria deviceId, banner TRIAL "10 dias restantes"
2. Em DEV (APP_DEV_TOOLS=true): botão "Simular Expiração"
3. Após simular: tela BLOQUEADA
4. Anti-relógio: se NOW < lastSeenAt → tamperFlag → BLOQUEADO
```

## 8. Licença
```bash
# Gerar licença (copiar deviceId do app)
node scripts/generate-license.js --customer "Filipe" --deviceId "SEU-DEVICE-ID" --out licenses/license.json

# No app bloqueado: "Selecionar license.json" → selecionar o arquivo → FULL ativado
```

## 9. Build
```bash
cd app
npm run dist
# Saída esperada em app/dist/:
#   ColunaMix-1.0.0-win-x64.exe (instalador NSIS)
#   ColunaMix-1.0.0-win-x64.zip (portable)
# Se timeout, usar: npx electron-builder build --win zip
```

## Checklist Final
- [x] `npm install` sem erros
- [x] `npm run dev` abre janela Electron com UI
- [x] TRIAL banner visível no primeiro uso
- [x] Importação CSV funcional
- [x] Selects/dropdowns abrem corretamente (HTML nativo)
- [x] Gerador produz jogos corretos
- [x] Export TXT com formato correto
- [x] Segurança anti-clock funcional
- [x] Licença ED25519 validação funcional
- [x] Seção "Ajuda" no gerador
- [x] TRIAL: max 50 jogos
- [ ] `npm run dist` gera .exe e .zip
