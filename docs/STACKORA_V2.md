# STACKORA 0.2 — Refonte premium, apprentissage et économie

Livraison du 14 novembre 2026. Ce document distingue ce qui est **implémenté et vérifié**, ce qui est **implémenté mais non vérifié sur iPhone réel**, et ce qui **reste à activer** (comptes externes, paiement).

## 1. Direction artistique « Salon nocturne »

| Élément | Choix |
|---|---|
| Fond | Anthracite profond `#0A0B0D`, surfaces `#15171B → #23272D`, filets à 7 % d'opacité |
| Premium | Cuivre doré `#D9AC63` (montants, rareté, actions principales) |
| Interactif | Bleu électrique maîtrisé `#7D8BFF` (suivre, progression, liens) |
| Typographie | Fraunces (titres, chiffres de prestige) + Inter (interface, chiffres tabulaires) |
| Tapis | Vert nuit `#123A31` en dégradé, rail laqué, liseré cuivre, filigrane STACKORA |
| Matière | Dégradés subtils, ombres réalistes, pas de néon, pas de bordures inutiles |

Tokens : `mobile/src/theme.ts`. Composants : `mobile/src/ui.tsx` (Button, Tap, Surface, Segmented, Toggle, SettingRow, Group, Field, Sheet, Confirm, Toast, ProgressBar, Avatar avec cadre animé, CoinBalance, RarityTag, Empty, Skeleton, FadeIn). Cartes et jetons sont dessinés en vues (aucune image externe) : `mobile/src/poker/cards.tsx`.

## 2. Navigation et écrans

Barre d'onglets au pouce : **Accueil · Tournois · Exercices · Règles · Boutique**. En-tête : avatar/niveau → Profil, solde → Boutique, cloche → Notifications, engrenage → Paramètres.

| Écran | Fichier |
|---|---|
| Lancement (animé + splash natif) | `screens/shell.tsx`, `assets/splash.png` |
| Connexion / inscription (validation en direct) | `screens/auth.tsx` |
| Accueil (bouton Jouer principal, reprise de partie, créer, rejoindre, tournois, progression, missions, exercices, boutique) | `screens/home.tsx` |
| Lobby des tournois (filtres, code, états vides, squelettes) | `screens/tournaments.tsx` |
| Création (variantes, structures Turbo/Standard/Deep, réglages avancés validés) | `screens/tournaments.tsx` |
| Salle d'attente (code, partage, joueurs avec cosmétiques publics, bots, lancement) | `screens/tournaments.tsx` |
| Table | `poker/PokerTable.tsx` |
| Fin de tournoi (couronne animée, podium, classement) | `screens/tournaments.tsx` |
| Profil, Collection | `screens/shop.tsx` |
| Boutique (à la une, catégories, fiches, achat confirmé, équipement, packs) | `screens/shop.tsx` |
| Règles | `screens/rules.tsx` + `data/rules.ts` |
| Exercices | `screens/training.tsx` + `data/gto.ts` |
| Paramètres, Notifications | `screens/settings.tsx` |

## 3. Table de poker

- Ellipse proportionnée à la zone disponible, joueurs répartis uniformément (2 à 8), héros toujours en bas.
- Main du héros hors du tapis, en grand (50–60 pt), jamais recouverte ; libellé de main en direct (« Paire de Rois », « Double paire… »).
- Siège : avatar + cadre + badge publics, plaque nom/tapis, anneau du joueur actif, chronomètre, dernière action traduite, TAPIS, ÉLIMINÉ, équité exacte pendant un tapis.
- Dos de cartes adverses = cosmétique public de chaque joueur (valeur jamais transmise).
- Mises posées vers le centre avec piles de jetons, bouton dealer, pot + part « au centre ».
- Animations : distribution, retournement, jetons vers la mise, collecte vers le pot, pot vers le(s) gagnant(s), effet de victoire public (halo, confettis, supernova), bannière de changement de blindes, bannière prime 7/2, mise en évidence des 5 cartes gagnantes.
- Décision : Passer / Parole-Suivre / Miser-Relancer (56 pt de haut), panneau de mise compact avec curseur, saisie, raccourcis contextuels (préflop 2 / 2,5 / 3 BB ou ×2,5 / ×3 ; postflop ⅓ ½ ¾ Pot) et Tapis, confirmation du tapis et des grosses mises.
- Préactions « Parole / Passe » et « Parole » : exécutées uniquement si l'action est légale au moment du tour (la préaction « Parole » s'annule si quelqu'un mise).
- **Conservés** : prime 7/2 et révélation automatique, dévoilement progressif du board après tapis préflop (rythme serveur), révélation interactive de la river (maintenir pour soulever), historique repliable, changement de table observée, unités jetons/BB.

## 4. Règles

10 chapitres Hold'em avec progression de lecture persistée, exemples illustrés (« Exemple suivant »), bouton « Compris ». Classement des 10 mains avec vraies cartes. Comparateur : le joueur devine, l'évaluateur client tranche et explique. Sous-onglets **Texas Hold'em, 7/2, Ghost Poker, Red River**, rédigés à partir de `engine.ts` / `tournament.ts` / `docs/RULES.md` (ex. walk non éligible au 7/2, égalité avec le fantôme = pot reporté). Ajouter une variante = ajouter une entrée dans `VARIANTS`.

## 5. Exercices

**Quiz des positions** : 6-max, 8-max ou mélange ; Débutant / Intermédiaire / Expert ; 10–20 questions ; réponse au toucher d'un siège ou par choix ; correction illustrée sur la table, explication, score, bilan et liste des erreurs. Les noms de positions sont calculés (`poker/positions.ts`), y compris le cas tête-à-tête.

**Entraîneur de décisions** : 21 situations (RFI, défense BB, 3-bet, vs 3-bet, 4-bet, push/fold, short stack, c-bet, défense, check-raise, value, bluff, bluff-catch, barrel, SPR, texture, river), filtres préflop/postflop/difficulté, révision des erreurs, statistiques par type et par street, historique.

**Données GTO (0.2.1)** : les situations principales sont désormais **calculées**, avec leurs fréquences réelles :
- *Push/fold* : équilibre de Nash tête-à-tête (sans ante) calculé par STACKORA, vérifié contre un tableau Nash gratuit publié en ligne (écarts de 0,1 à 0,2 BB sur les seuils comparés). Tableau 13×13 consultable dans Exercices.
- *Postflop* : spots résolus avec `native-solver` 0.1.0, solveur open source sous licence MIT / Apache-2.0 (DCFR). Chaque scénario affiche ses ranges d'entrée, tailles de mise, nombre d'itérations et exploitabilité.
- Les spots multijoueurs préflop (RFI, 3-bet…) restent des « Fondamentaux » sans fréquences : ils ne sont pas résolubles avec ces outils.
Méthode et reproduction : `docs/GTO_FORMAT.md` et `tools/gto-lab`.

## 6. Paramètres

Sections Apparence, Jeu, Son, Notifications, Compte. Toutes les préférences sont appliquées immédiatement, sauvegardées sur l'appareil (localStorage web / Keychain iOS) et **synchronisées avec le compte** (`GET/PUT /me/prefs`, la plus récente gagne). Les cosmétiques locaux (tapis, faces, jetons) et publics (dos, avatar, cadre, badge, effets) sont équipés via l'inventaire serveur. « Afficher mon niveau » est appliqué côté serveur. Le réglage système « Réduire les animations » est respecté.

Limites honnêtes : thème clair non disponible (le sélecteur l'indique) ; notifications push non actives (APNs à configurer) — les préférences sont enregistrées et le centre de notifications in-app fonctionne.

## 7. Économie StackCoins (serveur autoritaire)

| Domaine | Implémentation |
|---|---|
| Portefeuille | `wallets.balance CHECK(balance >= 0)`, bonus de bienvenue unique |
| Ledger | append-only, `UNIQUE(user_id, idem)` : aucun double crédit/débit, solde après chaque ligne |
| Atomicité | `BEGIN IMMEDIATE` + `UPDATE … WHERE balance + delta >= 0` |
| Boutique | 36 cosmétiques, 9 emplacements, 4 raretés ; achat idempotent, déjà possédé refusé, solde insuffisant refusé |
| Équipement | uniquement si possédé et compatible avec l'emplacement ; republication immédiate aux tables en cours |
| Visibilité | `cosmetics` ajouté par le serveur à chaque état de table ; les emplacements locaux ne sont jamais publiés |
| Récompenses | fin de tournoi uniquement (jamais par pot) : participation, top 3, victoire ; rang payé seulement avec ≥ 2 humains et ≥ 5 min de jeu ; 6 tournois récompensés/jour ; plafond quotidien de gains |
| Missions | 2 quotidiennes, 3 hebdomadaires, réclamation idempotente par période |
| Exercices | session ≥ 10 questions, 4 sessions récompensées/jour, rejeu ignoré |
| Progression | XP et niveau (engagement uniquement, aucun avantage) |
| Achats réels | `/iap/apple/verify` vérifie la chaîne x5c jusqu'à la racine Apple, la signature ES256, le bundle et le produit ; crédit idempotent par `transactionId` ; `/iap/apple/notifications` traite REFUND/REVOKE (débit plafonné au solde, manque enregistré) |
| Configuration | `STACKORA_REWARDS`, `STACKORA_PACKS` (JSON) |

Aucun achat n'est simulé : sans `APPLE_ROOT_CA_PEM_PATH` et `APPLE_BUNDLE_ID`, l'endpoint répond 503 et l'app l'indique.

**Paiement web (0.2.1)** : Stripe Checkout. `POST /pay/stripe/checkout` crée la session (prix serveur), `POST /pay/stripe/confirm` relit la session chez Stripe au retour, `POST /pay/stripe/webhook` vérifie la signature HMAC et traite `checkout.session.completed` et `charge.refunded`. Table `payments` (migration 003). Activation : `docs/PAIEMENT_WEB.md`. Les StackCoins ne touchent jamais l'invariant des jetons de tournoi.

## 8. Ce qui reste à activer

0. **Paiement web** : créer un compte Stripe et définir `STRIPE_SECRET_KEY` (voir `docs/PAIEMENT_WEB.md`). Le mode test suffit pour faire fonctionner les achats.
1. **StoreKit côté app** : ajouter un module IAP compatible Expo (ex. `expo-iap`), créer les 5 produits consommables dans App Store Connect, envoyer `signedTransaction` à `/iap/apple/verify`, renseigner `appAccountToken` = identifiant utilisateur. Le serveur est prêt.
2. **Apple** : télécharger *Apple Root CA – G3* (PEM), définir `APPLE_ROOT_CA_PEM_PATH`, `APPLE_BUNDLE_ID`, configurer l'URL des App Store Server Notifications V2.
3. **Juridique** : vérifier les règles App Store (3.1.1, monnaie virtuelle, jeux simulés), CGU et confidentialité avant d'activer les achats.
4. **APNs** pour les notifications push.
5. Thème clair, OAuth, social : non faits.
