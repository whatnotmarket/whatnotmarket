# AGENTS.md

## Obiettivo prodotto
Questa codebase contiene un marketplace React/TypeScript.
La search bar principale usa CMDK e deve offrire una UX premium, veloce e intelligente.

## Regole UI
- Mantenere design dark, pulito, premium
- Evitare look da developer tool
- Ogni risultato deve avere gerarchia visiva forte
- I prodotti devono mostrare thumbnail, titolo, metadati chiari e prezzo se disponibile

## Regole architetturali
- Separare parsing query, ranking e rendering
- Usare TypeScript stretto
- Evitare logica complessa nei componenti di presentazione
- Preferire utility pure e hook dedicati
- Rendere semplice una futura integrazione con backend search

## Search intelligence
- Supportare ranking composito
- Supportare intent detection
- Supportare recent searches e trending
- Supportare typo tolerance e fuzzy match
- Mostrare gruppi solo se rilevanti

## Qualità
- Non lasciare codice morto
- Non introdurre dipendenze inutili
- Verificare lint e typecheck prima di terminare

