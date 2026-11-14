# État réel de la livraison · 14 novembre 2026 (0.2.1)

## Implémenté et vérifié dans cet environnement

| Domaine | Livré | Vérification |
|---|---|---|
| Moteur, tournois, variantes 7/2 · Ghost · Red River | Inchangés fonctionnellement depuis la 0.1 | Suite de tests serveur existante (45) |
| Design system et refonte de tous les écrans | `mobile/src/theme.ts`, `ui.tsx`, `screens/*` | Typecheck strict, export web, parcours Chrome 393×852 et 375×667 (captures dans `docs/screenshots`) |
| Table de poker 2–8 joueurs | `mobile/src/poker/*` | Parcours réel : 8 joueurs, mise, préactions, historique ; duel à tapis jusqu'au résultat |
| Règles (10 chapitres, mains, comparateur, 4 variantes) | `screens/rules.tsx`, `data/rules.ts` | Parcours Chrome |
| Exercices (positions 6/8-max, 21 décisions pédagogiques) | `screens/training.tsx`, `data/gto.ts` | Parcours Chrome |
| Paramètres persistés + synchronisés | `settings.tsx`, `/me/prefs` | Test API + parcours |
| Économie StackCoins, boutique, inventaire, missions, récompenses | `server/src/economy.ts`, `catalog.ts` | 8 tests dédiés (`server/test/economy.test.ts`) + achat réel dans le parcours |
| Paiement web Stripe Checkout (création, confirmation serveur, webhook signé, remboursement) | `server/src/stripe.ts`, migration 003 | 2 tests (faux serveur Stripe) + parcours navigateur complet avec un faux Stripe local : 500 → 2 000 StackCoins |
| Solutions GTO calculées (9 push/fold Nash, 10 postflop solveur) + tableau Nash | `mobile/src/data/gto-solved.ts`, `tools/gto-lab` | Validateur de format (0 erreur), comparaison à un tableau Nash public, exploitabilité affichée |
| Vérification IAP App Store (JWS x5c + ES256, remboursements) | `server/src/iap.ts` | Test avec une PKI générée (racine → intermédiaire → feuille), signature falsifiée refusée |

## Implémenté mais non vérifié sur iPhone réel

Haptique (`expo-haptics`), sons (`expo-audio`), dégradés natifs, polices natives, safe areas réelles, VoiceOver. Aucun build Xcode/EAS n'a pu être produit ici (Linux, pas de compte Apple).

## Non réalisé / à activer

| Fonction | Reste à faire |
|---|---|
| Achat de StackCoins sur le web | Créer un compte Stripe et fournir `STRIPE_SECRET_KEY` (voir `docs/PAIEMENT_WEB.md`). Non testé contre le vrai Stripe : son API est inaccessible depuis l'environnement de développement |
| Achat de StackCoins sur iPhone | Module StoreKit côté client + produits App Store Connect + variables `APPLE_*` (serveur prêt) |
| Notifications push | APNs ; les préférences et le centre in-app existent |
| Thème clair | Non disponible (indiqué dans Paramètres) |
| GTO multijoueur préflop (RFI, 3-bet…) | Non résolu (outils tête-à-tête uniquement) : 10 « Fondamentaux » sans fréquences |
| OAuth, social, email vérifié | Inchangé depuis la 0.1 |
| Scalabilité (PostgreSQL, Redis) | Inchangé depuis la 0.1 |
