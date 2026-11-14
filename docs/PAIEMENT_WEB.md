# Activer l'achat de StackCoins sur la version web (Stripe)

Le code est prêt. Il ne manque que tes clés Stripe. En **mode test**, tout fonctionne avec de fausses cartes : aucun argent réel n'est débité, et le compte Stripe est gratuit.

## 1. Créer le compte Stripe

Va sur https://dashboard.stripe.com/register et crée un compte. Pas besoin d'activer les paiements réels pour le mode test.

## 2. Copier la clé secrète de test

Dans le tableau de bord, active **Mode test** (en haut à droite), puis va dans **Développeurs → Clés API**. Copie la **clé secrète** : elle commence par `sk_test_`.

Ne la mets jamais dans l'application mobile ni dans Git : elle ne va que dans le serveur.

## 3. Lancer le serveur avec la clé

À la racine du projet :

```sh
STRIPE_SECRET_KEY=sk_test_xxx WEB_APP_URL=http://localhost:8081 npm run server
```

Sous Windows (PowerShell) :

```powershell
$env:STRIPE_SECRET_KEY="sk_test_xxx"; $env:WEB_APP_URL="http://localhost:8081"; npm run server
```

`WEB_APP_URL` est l'adresse où tourne l'app web : Stripe y renvoie le joueur après le paiement.

## 4. Lancer l'app web

```sh
cd mobile
npx expo start --web
```

## 5. Tester un achat

Boutique → section StackCoins → choisis un pack. Tu es redirigée vers la page de paiement Stripe. Utilise :

- carte : `4242 4242 4242 4242`
- date : n'importe quelle date future
- CVC : 3 chiffres au choix

Au retour, l'app affiche « +1 500 StackCoins crédités ». Le serveur a relu la session directement chez Stripe avant de créditer.

## 6. (Recommandé) Remboursements avec le webhook

Pour que les remboursements retirent les StackCoins :

```sh
stripe login
stripe listen --forward-to localhost:3001/pay/stripe/webhook
```

La commande affiche un secret `whsec_…` : relance le serveur avec `STRIPE_WEBHOOK_SECRET=whsec_…` en plus. En production, crée le webhook dans **Développeurs → Webhooks** avec les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded` et `charge.refunded`.

## Ce qui est garanti par le serveur

- Le prix vient du serveur (`priceCents` dans `server/src/catalog.ts`), jamais du navigateur.
- Crédit uniquement après lecture de la session chez Stripe ou webhook signé (HMAC, 5 min de tolérance).
- Une session ne crédite qu'une fois, et seulement le compte qui l'a créée.
- Montant ou devise incohérents : refusé.
- Remboursement : débit plafonné au solde, jamais négatif, une seule fois.

## Avant de passer en réel

- Remplacer `sk_test_` par `sk_live_` et activer le compte Stripe (identité, IBAN).
- Mettre à jour CGU, mentions légales et politique de remboursement (contenu numérique, droit de rétractation).
- Sur iPhone, l'App Store impose ses achats intégrés pour les biens numériques : l'app native n'affiche pas le paiement Stripe.
