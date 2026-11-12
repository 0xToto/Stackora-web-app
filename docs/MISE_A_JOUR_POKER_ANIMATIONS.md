# STACKORA — Ghost Poker, tapis payé, prime 7/2

## Fonctionnalités

- **Ghost Poker** : à la fin de la main, même lorsqu'un joueur se couche avant la river, le moteur déroule le board, évalue le Ghost et publie ses deux cartes. L'interface affiche successivement les cartes communes et conserve le rendu Ghost.
- **Tapis payé** : quand toutes les décisions restantes ont été prises, les mains encore dans le coup deviennent visibles. Un instantané de la situation au moment de l'all-in est calculé côté serveur : probabilités approximatives de victoire (simulation Monte Carlo avant la river, égalités partagées), suggestions de cartes favorables au joueur derrière. Si le tapis est payé à la turn, les cartes de river favorables sont énumérées exactement pour les cartes restantes. Les suggestions à plusieurs cartes ne sont pas des « outs garantis ».
- **Animations** : distribution des cartes communes en cascade, et mise en scène spécifique de la cinquième carte (dos agrandi, inclinaison et coin simulé pendant le retournement). Compatible React Native et Web via Animated.
- **Prime 7/2** : si une main 7-2 provoque le fold des autres joueurs et reçoit la prime, elle est révélée publiquement même en l'absence de showdown. Les autres mains couchées restent privées.
- La pause entre deux mains passe de 4 à 8,5 secondes pour laisser le temps de voir la révélation. Le gagnant et la prime s'affichent dans le panneau de résultats.

## Déploiement

1. Remplacer dans GitHub le contenu du dépôt par celui de ce ZIP (sans effacer les paramètres ou secrets GitHub et Northflank).
2. Le service Northflank connecté à `main` doit reconstruire **le backend**, car les règles de visibilité et les statistiques sont produites sur le serveur. Vérifier la route `/health` sur le domaine Northflank.
3. Lancer le workflow `STACKORA - Construire la PWA`. Dans `.github/workflows/web-pwa.yml`, vérifier l'URL de `EXPO_PUBLIC_API_URL` ; elle doit désigner votre API Northflank, pas Render.
4. Télécharger `STACKORA-PWA-site-web`, décompresser et déposer le dossier contenant `index.html` dans les déploiements de votre site Netlify existant.
5. Tester avec deux comptes et la même table (sur deux navigateurs ou téléphones). Après la mise à jour, lancer de nouvelles mains : les mains déjà stockées conservent leur ancien format.

## Contrôles

- Tests du moteur : **29/29 passés** (Node 22 utilisé pour exécuter les tests JavaScript transpilés).
- Les fichiers TS/TSX modifiés ont été transpilés sans erreur de syntaxe.
- Le `npm ci` / `typecheck` complet n'a pas pu être finalisé dans l'environnement de livraison ; le workflow GitHub doit effectuer la vérification de compilation et le test sur les versions d'Expo / React Native du dépôt.
- Les animations iPhone / Safari réel n'ont pas été inspectées physiquement ; un test sur appareils reste nécessaire.

## Précisions sur l'équité

Les pourcentages représentent une estimation de la chance d'emporter le pot (avec partage des égalités), **pas** une garantie et **pas** une modélisation financière des side pots. Ils n'incluent pas une éventuelle prime 7/2. En Ghost Poker, les scénarios où le Ghost égale ou bat les mains humaines ne sont pas comptés comme des gains humains.
