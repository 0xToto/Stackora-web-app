# Fichiers de cette livraison

| Fichier | Changement |
|---|---|
| `mobile/app/index.tsx` | Remplace l'ancienne table par le composant dédié ; retire son ancien calendrier client et compacte l'en-tête pendant une partie. |
| `mobile/src/PokerTable.tsx` | Nouveau composant de jeu : cartes, sièges, commandes, slider, historique, équités, animations et river. |
| `mobile/src/types.ts` | Horodatage serveur, informations publiques de présentation et liste des révélations. |
| `server/src/engine.ts` | Révélation 7/2 indépendante du paiement de prime ; calendrier ; projection publique sans fuite des résultats futurs ; snapshots d'équité intermédiaires ; garde-fou Red River. |
| `server/src/tournament.ts` | Mise en place et publication du calendrier ; pause inter-mains ; horodatage serveur et restauration cohérente. |
| `server/test/engine.test.ts` | Corrige une assertion dont le narrowing TypeScript retenait `allIn` à `null` après une mutation ; même contrôle logique. |
| `server/test/presentation.test.ts` | Sept tests supplémentaires : temps serveur, confidentialité, all-ins par street, multiway, side pots, reconnexion, prime et révélations. |
| `docs/STACKORA_PREMIUM.md` | Fonctionnement et limites explicites. |
| `docs/DEPLOIEMENT_PREMIUM.md` | Installation, commandes Git et publication. |
| `docs/FICHIERS_MODIFIES.md` | Ce relevé. |
| `docs/validation-2026-11-13/` | Journaux de typecheck, tests et export Web de cette livraison. |

L'archive contient l'ensemble des sources d'origine, les modifications ci-dessus et `mobile/dist` construit pour le backend Northflank fourni. Les métadonnées `.git`, les dépendances `node_modules`, les caches, les bases SQLite locales et les scénarios de prévisualisation temporaires n'y figurent pas. `mobile/dist` est un résultat de build, pas un fichier à ajouter au commit source.
