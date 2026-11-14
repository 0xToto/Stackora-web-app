# gto-lab — calcul des solutions GTO de STACKORA

Outil Rust hors application. Il produit les données de `mobile/src/data/gto-solved.ts`.

- `cargo run --release -- equity 40000` : équités préflop 169×169 (Monte-Carlo, évaluateur `native-solver`) → `equity.json` (≈ 4 min sur 2 cœurs, non versionné : 1 Mo).
- `cargo run --release -- nash 600` : équilibre push/fold tête-à-tête, 1 à 25 BB → `nash.json`.
- `python3 ../expand.py spots.json spots.x.json && cargo run --release -- spots spots.x.json result.json` : résolution postflop avec `native-solver` 0.1.0 (MIT / Apache-2.0).
- `python3 ../build_gto.py . ../../mobile/src/data/gto-solved.ts` : génération des scénarios.

Les spots du flop demandent beaucoup de mémoire : une seule taille de mise par street et regroupement des mains (`buckets`) sur une machine de 8 Go.
