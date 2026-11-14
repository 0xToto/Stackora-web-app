# Format des scénarios de l'entraîneur de décisions

Fichier de référence : `mobile/src/data/gto.ts` (type `Scenario`, fonction `validatePack`).

## Principe de fiabilité

- Chaque scénario porte une **provenance** (`source`) et un **numéro de version**.
- `source.kind = "pedagogical"` : exercice rédigé à partir de principes reconnus. **Interdiction d'afficher des fréquences** (`frequencies` doit être absent). L'interface affiche « Fréquences non affichées : exercice pédagogique ».
- `source.kind = "solver"` : solution issue d'un solveur. **Obligatoire** : `solver`, `solverVersion`, `settings` (ranges, tailles de mise autorisées, rake, précision), `license` (droit de redistribution), et `frequencies` (une valeur par option, somme = 100 ± 0,5).
- `validatePack()` refuse tout pack qui viole ces règles.

## Champs

| Champ | Description |
|---|---|
| `id`, `version` | Identifiant stable, incrémenter `version` à chaque correction |
| `street` | `preflop` ou `postflop` |
| `type` | Catégorie suivie dans les statistiques (RFI, 3-bet, C-bet…) |
| `difficulty` | 1 à 3 |
| `players`, `hero`, `villains`, `stackBB`, `blinds` | Contexte de table |
| `board`, `potBB`, `history`, `facing` | Situation |
| `options` | Actions légales et tailles (`act`, `sizeBB`, `label`) |
| `best`, `acceptable` | Index des options recommandées / tolérées |
| `frequencies` | Solveur uniquement |
| `explanation`, `keyPoints` | Retour pédagogique |

## Importer un pack solveur

1. Exporter les nœuds depuis un solveur dont la licence autorise la redistribution.
2. Convertir chaque nœud en `Scenario` (`source.kind = "solver"`, fréquences en %).
3. Lancer `validatePack({ scenarios })` : zéro erreur requise.
4. Ajouter le pack (fichier ou endpoint) et le concaténer à `SCENARIOS`.

Ne jamais arrondir ou « compléter » des fréquences manquantes à la main.

## Solutions fournies (pack 0.2.1)

| Pack | Méthode | Vérification |
|---|---|---|
| `stackora-nash-hu-v1` | Push/fold SB contre BB, sans ante. Équités 169×169 par Monte-Carlo (40 000 tirages par confrontation, évaluateur de `native-solver`), équilibre par fictitious play (600 itérations) avec retrait des cartes. | Équités de contrôle : AA/KK 82,1 % (réf. 81,9), AKs/QQ 45,6 % (réf. ≈ 46). Seuils comparés à un tableau Nash HU gratuit (version sans ante) : T3s 7,75/7,7 · K2o 11,5/11,6 · K5o 14,25/14,2 · T7o 9,0/9,0 · Q2o 7,0/7,0 et 5,5/5,6 · 97o 10,75/10,8 · 22 (call) 15,25/15,0. |
| `stackora-solved-v1` | `native-solver` 0.1.0 (MIT / Apache-2.0), DCFR, isomorphie des couleurs. River et turn résolus exactement ; flop avec regroupement des mains (abstraction) et une seule taille de mise par street pour tenir en mémoire. | Exploitabilité calculée par le solveur et affichée dans chaque scénario. |

Reproduire : `cd tools/gto-lab && cargo run --release -- equity 40000 && cargo run --release -- nash 600 && cargo run --release -- spots spots.json out.json`, puis `python3 tools/build_gto.py tools/gto-lab mobile/src/data/gto-solved.ts`.

Limites : les ranges d'entrée postflop sont des choix de modélisation (affichés dans l'app). Les solutions sont exactes pour ces ranges et ces tailles de mise, pas pour toutes les situations réelles.
