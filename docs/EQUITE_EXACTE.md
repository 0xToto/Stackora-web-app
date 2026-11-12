# STACKORA — Équités exactes et affichage au tapis payé

## Calcul

Le serveur ne réalise plus de simulation Monte Carlo pour les tapis payés.
Il énumère toutes les combinaisons non ordonnées possibles des cartes restant
à distribuer, exclut les cartes privées révélées, et compare les meilleures
mains de chaque joueur. Les égalités répartissent équitablement l'équité.
Cela intègre automatiquement paires, brelans, suites, couleurs, fulls,
carrés et quintes flush.

Les pourcentages présentés sont des **équités de pot** avec égalités réparties.
Ils sont exacts mathématiquement avant l'arrondi d'affichage à 0,01 point.

Les snapshots sont calculés aux étapes atteintes après le tapis payé :
préflop, flop, turn, river. L'interface fait avancer la carte animée et
sélectionne le snapshot correspondant à la street affichée.

La règle de 2/4 au poker est seulement un moyen d'estimation rapide et ne
permet pas de calculer les probabilités exactes, particulièrement avant
le flop ou lors de tirages simultanés.

**Exemple contrôlé :** Js Jh contre Ks Kh : préflop 17,78 % / 82,22 %;
flop 2c 3d 8h : 8,38 % / 91,62 %;
turn 9s : 4,55 % / 95,45 %.

**Outs :** au flop, les cartes listées améliorent l'équité conditionnelle
sur la turn; à la turn, les outs listés sont les rivers permettant à une main
actuellement derrière de remporter au moins une part du pot.

## Limitations

- Le calcul exhaustif peut occuper le serveur Node.js pendant 1 à 3 secondes,
  voire davantage suivant l'hébergement, lors d'un all-in préflop.
- En cas de pots secondaires, le pourcentage indique l'équité de comparaison
  des mains encore en jeu, pas le retour monétaire exact de chaque pot.
- La variante personnalisée Red River (cartes supplémentaires si la river est
  rouge) n'est pas couverte par les probabilités de river standard.
- Nécessite un nouveau déploiement du backend Northflank **et** du PWA Netlify.

## Déploiement

1. Mettre à jour tout le dépôt dans GitHub.
2. Vérifier que le déploiement du backend Northflank s'est terminé.
3. Lancer le workflow `STACKORA - Construire la PWA`.
4. Publier `mobile/dist` sur Netlify.
5. Tester JJ vs KK, un tirage couleur à la turn et un partage de pot.
