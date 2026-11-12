# STACKORA PWA — Publication gratuite sur iPhone et Android

## Ce qui est livré

- Client Expo web conservant l’interface et la logique des parties existantes.
- `mobile/public/manifest.json` et trois icônes aux dimensions adaptées.
- Métadonnées Safari iOS et lancement plein écran.
- Bouton Partager compatible navigateur et partage de l’URL publique avec code de tournoi.
- Service worker volontairement limité aux icônes et au manifeste ; **le jeu n’est pas jouable hors ligne**.
- Workflow `.github/workflows/web-pwa.yml` pour produire l’archive statique.

## 1. Mettre en ligne le serveur de poker

Il faut un backend **public HTTPS et WSS** avec SQLite **persistant**. Il est impossible de jouer à plusieurs via Internet avec `localhost` ou `192.168.x.x`.

Le projet inclut un `Dockerfile` et `compose.yaml` pour servir de base au déploiement. Choisir un hébergeur Node/Docker offrant stockage persistant (gratuité éventuelle sous conditions). Définir `CORS_ORIGIN=https://VOTRE-SITE.netlify.app` (sans slash final) dans l'environnement du backend. La base SQLite ne doit pas résider sur un disque éphémère. Vérifier `https://API-URL/health` => `{"ok":true,...}`.

**IMPORTANT :** le jeu est un prototype : avant ouverture au grand public, renforcer la sécurité, mettre en place une vérification email, récupération de compte, suppression de compte, politique de confidentialité, supervision, sauvegardes et tests de charge. Pas de poker à argent réel.

## 2. Construire le site (PC Windows)

Prérequis : Node.js 24 et npm. À la racine de `stackora`, PowerShell :

```powershell
npm ci
$env:EXPO_PUBLIC_API_URL="https://ADRESSE-PUBLIQUE-DU-SERVEUR"
npm run build:web
```

Le site statique se trouve dans `mobile/dist`. Ne pas recopier le fichier `.env.production.example` sans remplacer le domaine d'exemple ! La valeur `EXPO_PUBLIC_API_URL` est incorporée au moment du build.

## 3. Publier le site sur Netlify (offre gratuite dans les limites du plan)

Option simple : connecter le dépôt GitHub sur https://app.netlify.com/ en sélectionnant le dossier de base `mobile`, commande `npm run build:web`, dossier publié `dist` ; côté Netlify configurer `EXPO_PUBLIC_API_URL` avec l’URL HTTPS réelle de votre serveur AVANT le déploiement. Puis relancer une compilation après toute modification de cette variable. Le monorepo exige `npm ci` au bon emplacement (racine `stackora`) : si la configuration de build automatique pose problème, utiliser le téléchargement manuel du dossier `mobile/dist` depuis un build local.

Netlify héberge **uniquement les fichiers web**, pas le serveur de poker.

## 4. Installation iPhone

Ouvrir le lien HTTPS dans **Safari** → bouton Partager → **Sur l'écran d'accueil** → Ajouter. Sur les versions récentes d'iOS, choisir « Ouvrir comme app » si l'option apparaît. L'icône STACKORA apparaît sur l'écran d'accueil. Aucun câble requis.

## 5. Installation Android

Ouvrir le même lien dans Chrome → menu ⋮ → **Installer l'application** ou « Ajouter à l'écran d'accueil ».

## 6. Vérifications indispensables

- ouvrir l’URL publique en navigation privée, écran de connexion visible ;
- créer deux comptes et vérifier le partage de code entre deux téléphones ;
- vérifier le websocket WSS et les mises en direct ;
- rafraîchir le site, lancer une partie puis la reprendre ;
- fermer complètement l'application iPhone : la version actuelle enregistre la session dans `sessionStorage`, une reconnexion peut être nécessaire ;
- vérifier la bonne prise en compte des mises à jour.

## Limites importantes

Cette PWA est installable **depuis Safari/Chrome**, mais n'est **pas référencée sur l'App Store**. Les navigateurs iOS n’autorisent pas l’installation silencieuse. Le jeu reste dépendant de l’API et des WebSockets accessibles. Le serveur n'est PAS inclus dans l'hébergement statique.
