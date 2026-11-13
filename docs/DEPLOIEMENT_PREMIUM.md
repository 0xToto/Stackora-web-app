# Déploiement de STACKORA

## Préparer le dépôt existant

Utiliser Node.js 24, comme les workflows existants. Dans votre clone Git local, conserver le dossier `.git` ; y recopier les sources de cette archive. Ne pas remplacer une base SQLite ou un fichier d'environnement local.

Les commandes suivantes s'exécutent à la racine de votre dépôt :

```sh
git switch main
git pull --ff-only origin main
```

Recopier ensuite les fichiers de l'archive dans le clone, puis :

```sh
npm ci
npm run typecheck
npm test
git diff --check
git status --short
```

`npm test` peut prendre plusieurs minutes : la suite existante simule 1 200 mains et des tournois, et calcule des équités exhaustives.

## Commit limité aux changements

```sh
git add mobile/app/index.tsx mobile/src/PokerTable.tsx mobile/src/types.ts
git add server/src/engine.ts server/src/tournament.ts
git add server/test/engine.test.ts server/test/presentation.test.ts
git add docs/STACKORA_PREMIUM.md docs/DEPLOIEMENT_PREMIUM.md docs/FICHIERS_MODIFIES.md docs/validation-2026-11-13
git diff --cached --stat
git commit -m "Ameliore la table poker et synchronise les revelations serveur"
git push origin main
```

## Backend Northflank

Le push déclenche le redéploiement connecté au dépôt selon votre configuration existante. Vérifier son succès et l'endpoint `/health`. Conserver le volume persistant et la variable `DATABASE_PATH` existants. Aucune migration n'est requise. Ne pas supprimer/recréer le volume, et ne pas exécuter de commande de réinitialisation SQLite.

Déployer de préférence hors d'une main active ; les nouveaux champs JSON restent optionnels pour les états plus anciens. Publier backend et frontend pendant la même fenêtre de maintenance, car l'ancien frontend ne connaît pas l'état public `runout`.

## Frontend Netlify

Le fichier `.github/workflows/web-pwa.yml` fourni **construit et publie un artifact GitHub Actions** ; il ne contient aucune étape d'envoi direct vers Netlify. Si votre site Netlify est déjà relié au dépôt, conserver son mécanisme de build actuel. Sinon, récupérer l'artifact du workflow et publier son contenu sur le site Netlify existant.

`mobile/dist` inclus a été construit avec l'URL de backend suivante :
`https://api--stackora--rc725y9s4fxd.code.run`.

Pour reconstruire vous-même sous PowerShell :

```powershell
$env:EXPO_PUBLIC_API_URL = "https://api--stackora--rc725y9s4fxd.code.run"
npm exec -w mobile -- expo export --platform web --clear
```

Sous bash :

```sh
EXPO_PUBLIC_API_URL=https://api--stackora--rc725y9s4fxd.code.run npm exec -w mobile -- expo export --platform web --clear
```

Publier le **contenu** de `mobile/dist` (le dossier comprenant `index.html`). Ne pas pousser `node_modules`, les bases SQLite ou les fichiers de secrets. Le service worker d'origine ne met pas les réponses de jeu en cache.

## Recette après publication

Sur deux téléphones : connexion, entrée dans le même tournoi, relance/suivi, 7/2 gagnant après fold, all-in préflop, fenêtre river sans toucher, puis reconnexion d'un téléphone pendant cette fenêtre. Vérifier aussi le clavier numérique, le mode paysage, une table pleine et le changement de table après élimination. Ces essais sur les services en production et appareils réels ne sont pas revendiqués dans les résultats joints.
