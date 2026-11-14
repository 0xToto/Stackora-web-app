# Fichiers modifiés — version 0.2

## Serveur
- `server/migrations/002_economy.sql` (nouveau) : portefeuilles, ledger, inventaire, équipement, progression, récompenses, préférences, exercices, transactions IAP.
- `server/src/catalog.ts` (nouveau) : catalogue cosmétique, packs, configuration des récompenses, niveaux.
- `server/src/economy.ts` (nouveau) : transactions atomiques et idempotentes, boutique, équipement, récompenses, missions, exercices, IAP, projection publique.
- `server/src/iap.ts` (nouveau) : vérification JWS StoreKit 2 et notifications de remboursement.
- `server/src/store.ts` : migrations multiples, économie, renommage, suppression de compte, préférences.
- `server/src/app.ts` : routes profil / préférences / boutique / missions / exercices / IAP, cosmétiques publics dans l'état de table, récompenses de fin de tournoi.
- `server/test/economy.test.ts` (nouveau) : 8 tests.

## Mobile
- `mobile/app/index.tsx` : racine (polices, préférences, navigation à onglets, transitions).
- `mobile/app/+html.tsx`, `mobile/app.json`, `mobile/public/manifest.json` : couleurs 0.2.
- `mobile/src/theme.ts`, `ui.tsx`, `settings.tsx`, `feedback.ts`, `app-context.tsx` (nouveaux) : design system, préférences, haptique, sons.
- `mobile/src/poker/` (nouveau) : `PokerTable.tsx`, `cards.tsx`, `evaluate.ts`, `positions.ts`. L'ancien `src/PokerTable.tsx` est remplacé.
- `mobile/src/screens/` (nouveau) : `shell`, `auth`, `home`, `tournaments`, `shop`, `rules`, `training`, `settings`.
- `mobile/src/data/rules.ts`, `data/gto.ts` (nouveaux).
- `mobile/src/useStackora.ts`, `types.ts`, `storage.ts` : API économie/profil, préférences durables.
- `mobile/assets/` : nouvelle icône, splash, logos SVG, favicon ; `assets/sounds/*.wav` (sons originaux synthétisés).
- `mobile/package.json` : `expo-haptics`, `expo-audio`, `expo-linear-gradient`, `expo-font`, `@expo-google-fonts/inter`, `@expo-google-fonts/fraunces`, `@expo/vector-icons`.

## Documentation
- `docs/STACKORA_V2.md`, `docs/GTO_FORMAT.md`, `docs/validation-2026-11-14/`, `docs/screenshots/` (nouveaux).
- `README.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`, `docs/IPHONE.md` mis à jour.

## 0.2.1
- `server/src/stripe.ts`, `server/migrations/003_payments.sql`, `server/test/stripe.test.ts` (nouveaux) ; `economy.ts` (crédit et remboursement web), `catalog.ts` (prix en centimes), `app.ts` (routes `/pay/stripe/*`), `store.ts` (migration 003).
- `mobile/src/screens/shop.tsx` (paiement web), `app/index.tsx` (retour de paiement), `useStackora.ts`, `types.ts`.
- `mobile/src/data/gto-solved.ts` (généré), `data/gto.ts` (pack solveur + fondamentaux), `screens/training.tsx` (fréquences, hypothèses, filtre de source, tableau Nash).
- `tools/gto-lab/`, `tools/build_gto.py`, `tools/expand.py` (calculs reproductibles).
- `docs/PAIEMENT_WEB.md` (nouveau), `docs/STACKORA_V2.md`, `docs/GTO_FORMAT.md`, `docs/STATUS.md`.
