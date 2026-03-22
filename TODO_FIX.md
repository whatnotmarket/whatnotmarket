# TODO Fix

Stato lint attuale:
- errors: `0`
- warnings: `3`
- warning residui: `react-hooks/incompatible-library`

## Residuo da chiudere

- [ ] `src/app/(commerce)/sell/SellClient.tsx` (`react-hook-form watch()`):
  - sostituire `watch("paymentMethods")` dentro callback con `useWatch` o `getValues` in modo compatibile con React Compiler.

- [ ] `src/app/(commerce)/sell/SellPageClient.tsx` (`react-hook-form watch()`):
  - stesso fix del file sopra, mantenendo comportamento identico su selezione crypto.

- [ ] `src/components/shared/ui/data-table.tsx` (`@tanstack/react-table useReactTable()`):
  - scegliere una strada unica:
  - `A)` isolare il componente fuori dal path compilato da React Compiler, oppure
  - `B)` mantenere il componente così e documentare/accettare il warning (lint disable mirato con commento tecnico).

## Nota operativa

Dopo questi 3 fix: rilanciare `npm run lint` e verificare `0 warnings`.
