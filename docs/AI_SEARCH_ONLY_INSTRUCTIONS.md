# AI Search Only - Implementation Instructions (better-cmdk)

## Scope (strict)
- Questo documento copre **solo l'intelligenza della ricerca**.
- Non cambiare layout/UI generale di `/global-chat` oltre a ciò che serve per l'AI search.
- Non duplicare sistemi: mantenere una sola pipeline di ranking/intent.

## Current project context (already detected)
- Framework: Next.js App Router
- Package manager: npm
- Tailwind: v4 (`@import "tailwindcss"` presente)
- Search UI esistente: custom cmdk in:
  - `src/components/search/GlobalCommandSearch.tsx`
  - `src/components/search/global-search-catalog.ts`
  - `src/app/api/search/cmdk/route.ts`
- `better-cmdk` installato.

## Non-assumption protocol (mandatory)
Quando una scelta non è esplicita, **non assumere**.
Fermati e chiedi una domanda breve e specifica, poi continua.

Domande obbligatorie prima di implementare la parte AI:
1. Modalità AI da usare:
   - No AI chat (solo intent/ranking)
   - Built-in trial endpoint (`https://better-cmdk.com/api/chat`)
   - Endpoint proprietario (`/api/chat`) con provider tuo
   - ModifyWithAI
2. Integrazione UI:
   - Tenere cmdk attuale e aggiungere solo intelligenza
   - Migrare completamente a `better-cmdk`
3. Privacy policy per query utente:
   - Posso inviare query a endpoint esterno?
   - Oppure solo locale/server proprietario?

## AI search objective
Dato un input utente, il sistema deve:
1. Capire l'intento (utente, prodotto, categoria, wallet, pagina, servizio, richiesta).
2. Mostrare risultati coerenti con priorità alta sui match reali.
3. Evitare suggerimenti rumorosi/non pertinenti.
4. Tenere latenza bassa (<200ms client-side percepita, quando possibile).

## Intent taxonomy
Usare questi intenti:
- `profile_handle` (es: `@lucatest`)
- `profile_name` (es: `lucatest`)
- `wallet_lookup` (EVM/TRON/SOL)
- `product_search`
- `service_search`
- `category_search`
- `request_search`
- `site_navigation`
- `generic_search`

## Hard behavior rules (must)
1. Se query è `@handle`: mostra **solo** risultati utente/profilo.
2. Se query sembra nome profilo e ci sono match utente forti: sopprimi quick actions rumorose (products/services non richiesti).
3. Prediction whitelist fissa:
   - `Services`
   - `Sellers`
   - `Category`
4. CTA devono essere contestuali e coerenti con intento.
5. Nessuna label testuale di verifica (`VERIFIED`) nei risultati; solo icona quando prevista.
6. Font uniformi: stessa famiglia, cambia solo il peso.

## Ranking pipeline (recommended)
1. **Normalize query**
   - trim, lowercase, collapse spaces
2. **Intent detect**
   - regex + keyword matching + lightweight confidence score
3. **Candidate retrieval**
   - live API results (`/api/search/cmdk`)
   - catalog statico
   - prediction whitelist
4. **Intent-aware scoring**
   - boost per gruppo coerente con intento
   - penalità per gruppi incoerenti
   - boost extra per exact/prefix match su handle e title
5. **Deduplicate + cap**
   - per `id`, max risultati configurato
6. **Post-filter UI rules**
   - applicare hard rules sopra (es. `@handle` only profile)

## better-cmdk usage for AI only
Se si mantiene la UI attuale:
- usare `better-cmdk` come backend/pattern di azioni AI (non obbligatorio sostituire il componente UI subito).
- mantenere un array azioni unico e deduplicato (source of truth) per funzioni no-arg.
- tutte le azioni con parametri richiesti vanno marcate come AI-owned (non come quick command base).

## Single source of truth for actions
Creare/riusare un file unico:
- `src/components/search/search-actions.ts`

Ogni action deve avere:
- `name` (kebab-case)
- `label`
- `group` (`Navigation`, `UI / Preferences`, `Data`, `Help / Utilities`)
- `keywords`
- `execute` (no-arg command)
- opzionale: `shortcut`, `icon`, `disabled`, `semanticKey`

## Suggested AI-only milestones
1. Stabilizzare intent detector (handle/profile/wallet/product/category).
2. Unificare scoring in una funzione sola.
3. Aggiungere test minimi intent/ranking (query reali: `@user`, `luca`, `skin`, `0x...`).
4. Aggiungere metriche locali:
   - query
   - top 3 risultati
   - click result
   - miss/no-results

## Acceptance checklist
- `@username` => solo profilo.
- query profilo senza `@` con match reale => niente suggerimenti rumorosi.
- prediction mostra solo 3 voci richieste.
- CTA coerenti per tipo risultato.
- nessuna regressione visiva della cmdk.
- nessuna assunzione fatta senza domanda esplicita.

## Hosted endpoint note (if enabled)
Se scegli Built-in chat di better-cmdk:
- endpoint: `https://better-cmdk.com/api/chat`
- limite developer-trial: **10 richieste / 10 minuti**
- per produzione usare endpoint proprio (`chatEndpoint`) o ModifyWithAI.
