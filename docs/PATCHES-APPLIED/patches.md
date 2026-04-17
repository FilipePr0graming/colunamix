# PATCHES APPLIED

## Part 1 — Bootstrap
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/package.json` | Electron + Vite + React + TypeScript project config |
| CREATE | `app/tsconfig.json` | TypeScript configuration |
| CREATE | `app/vite.config.ts` | Vite + electron plugin |
| CREATE | `app/tailwind.config.js` | Tailwind CSS config |
| CREATE | `app/postcss.config.js` | PostCSS config |
| CREATE | `app/electron-builder.json` | Build config (NSIS + ZIP) |
| CREATE | `app/index.html` | Vite entry HTML |

## Part 2 — Database
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/src/main/database.ts` | JSON file storage (dual APPDATA/LOCALAPPDATA backup) |

> **Decisão**: Substituído `better-sqlite3` por storage JSON para evitar problemas de compilação nativa (node-gyp). Mesma API, zero dependências nativas.

## Part 3 — Regras de Colunas
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/src/shared/columns.ts` | C1-C5 mapping, parseNumbers, collectUniquePatterns |
| CREATE | `app/src/shared/types.ts` | Interfaces TypeScript |
| CREATE | `app/src/shared/generator.ts` | Cartesian product + fixas/excluídas + dedup |

## Part 4 — Importação CSV
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/src/renderer/components/ImportCSV.tsx` | File picker + CSV parsing UI |
| CREATE | `data/input/exemplo.csv` | CSV de exemplo com 20 concursos |

## Part 5 — Gerador
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/src/renderer/components/Generator.tsx` | UI completa (mode, K, fixas, excluídas, max_jogos) |

## Part 6 — Export TXT
| Action | Files | Description |
|--------|-------|-------------|
| Integrado em `Generator.tsx` | Botão "Exportar TXT" com Save dialog |

## Part 7 — Segurança
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/src/main/license.ts` | ED25519 validation, trial 10 dias, anti-clock |
| CREATE | `app/src/main/ipc-handlers.ts` | IPC bridge |
| CREATE | `app/src/preload/index.ts` | contextBridge seguro |
| CREATE | `app/src/renderer/components/TrialBanner.tsx` | Banner TRIAL |
| CREATE | `app/src/renderer/components/BlockedScreen.tsx` | Tela bloqueada |
| MODIFY | `scripts/generate-license.js` | Gerador de licença ED25519 completo |
| CREATE | `scripts/public_key.pem` | Chave pública (embutida no app) |
| CREATE | `scripts/private_key.pem` | Chave privada (APAGAR após salvar em env) |

## Part 8 — Build
| Action | Files | Description |
|--------|-------|-------------|
| CREATE | `app/electron-builder.json` | NSIS + portable ZIP |

---

## Patch 2 — Correção de UI (Dropdowns/Inputs)

### Causa raiz
Radix UI `<Select>` renderiza em portal que conflita com `backdrop-filter: blur()` e `overflow: hidden` dos containers `.glass-card` do Electron. O dropdown ficava cortado, invisível ou ilegível.

### Correção aplicada

| Action | Files | Description |
|--------|-------|-------------|
| REWRITE | `app/src/renderer/components/Generator.tsx` | Substituído Radix Select por HTML nativo `<select>` + `<input>`. Adicionado: TRIAL max=50, seção ajuda, feedback de erros claro |
| MODIFY | `app/src/renderer/index.css` | Adicionado `.native-select`, `.native-input`, `.field-label` com estilos dark |
| MODIFY | `app/src/main/ipc-handlers.ts` | Debug logging no generator:generate handler |
| MODIFY | `app/src/shared/generator.ts` | Debug logging de padrões por coluna |
| FIX | `Generator.tsx` linha 16 | `noRepeatDrawn` default mudado de `true` para `false` |
