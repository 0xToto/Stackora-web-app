# STACKORA — Mise à jour de la table de jeu

Livraison du 13 novembre 2026. À lire avec `FICHIERS_MODIFIES.md`, `DEPLOIEMENT_PREMIUM.md` et les journaux dans `validation-2026-11-13/`.

## Comportements implémentés

- La variante 7/2 révèle désormais aussi une victoire sans showdown qui ne déclenche pas de prime (par exemple après abandon de la petite blinde). La règle de prime reste exactement celle du moteur fourni : victoire franche et, sans showdown, fold provoqué par une agression. Aucun montant de prime modifié.
- Les adversaires couchés restent masqués pour les autres joueurs. La décision de révélation est faite par le serveur.
- Nouvelle table React Native / Expo : feutre profond, liseré doré, ombres, sièges identifiés, dealer, stack, mises, indicateur du joueur actif et gagnants. Les cartes du joueur sont ancrées au bas du tapis, au-dessus des actions.
- Les cartes communes et personnelles sont agrandies ; les dos adverses se réduisent sur les écrans courts pour conserver la lisibilité du board. Les retournements utilisent une rotation 3D ; des jetons animés indiquent les mises et gains.
- Trois actions principales compactes. Relance ouverte à la demande : slider, saisie du total, montant supplémentaire, raccourcis ⅓ / ½ / ¾ / pot / tapis, confirmation. Le minimum est plafonné au stack pour permettre les petits tapis légaux. Les montants non entiers ou hors limites ne peuvent pas être confirmés.
- Slider HTML natif sur Web pour le clavier et le pointeur ; geste PanResponder sur React Native. Commandes tactiles d'au moins 44 px.
- Historique fermé par défaut, panneau latéral animé, fermeture extérieure, défilement interne. La barre d'actions demeure accessible. Événements du tournoi, actions de la main puis résultats et primes sont présentés dans leur ordre de séquence.
- Équités issues du calcul exhaustif existant, désormais disponibles après chacune des trois cartes du flop. Aucune formule d'approximation ajoutée.

## Calendrier de révélation

Quand les enchères sont closes après un tapis payé, le moteur calcule et règle la main comme auparavant. Une structure de présentation indépendante, sérialisée dans l'état existant, conserve le calendrier et les stacks d'avant attribution. Le serveur n'attend aucun accusé de réception d'un client.

| Tapis payé préflop | Temps depuis le début de présentation |
|---|---:|
| Mains participantes visibles | 0 s |
| Première carte du flop | 2 s |
| Deuxième carte du flop | 4 s |
| Troisième carte du flop | 6 s |
| Turn | 8 s |
| River et résultats accessibles | 13 s |

Pour un tapis payé au flop : turn à 2 s, river à 7 s. Pour un tapis payé à la turn : river à 5 s. Chaque carte supplémentaire Red River dispose également de sa fenêtre de cinq secondes.

Le début du calendrier suit le calcul des équités dans les chemins d'action humains et bots, afin que son temps de calcul ne consomme pas l'animation du premier flop. Le tick serveur publie les changements de carte ; les délais réseau et la fréquence du tick existant (500 ms) peuvent décaler leur réception.

La projection publique masque le futur board, les futurs snapshots d'équité, les pots attribués, la prime et les stacks finaux pendant la séquence. Une reconnexion utilise le calendrier existant, sans recommencer au flop. Les nouvelles mains attendent la fin du calendrier le plus long, puis la pause existante de 8,5 secondes.

## River interactive

Une carte géante, limitée par la hauteur disponible et à 75 % de la largeur, apparaît sur fond sombre. Un appui souris ou tactile maintenu soulève graphiquement son coin ; un relâchement anticipé le referme. Le serveur révèle à son échéance, même sans interaction. La face apparaît ensuite en grand pendant 850 ms avant retour au tapis.

**Choix de confidentialité :** le coin animé est un effet graphique. La valeur réelle n'est jamais livrée au client avant l'échéance serveur, et ne peut donc pas être devinée progressivement avant celle-ci. Un maintien ne raccourcit pas le délai commun. Ce comportement diffère d'un peel qui expose une partie de la véritable face avant la révélation générale.

## Vérification et limites

Les fichiers de validation donnent les résultats réellement exécutés. Les essais visuels ont utilisé le vrai composant dans un scénario local contrôlé à huit joueurs, aux dimensions 320 × 568, 390 × 844, 412 × 915 et dans le navigateur desktop. Le volet d'historique, la relance totale et le raccourci tapis, ainsi qu'un appui souris bref et la fin automatique de la river ont été exercés. Le scénario de contrôle et ses routes sont retirés de la livraison.

Ces essais ne constituent pas des tests sur iPhone ou Android physiques, ni un test multijoueur de bout en bout sur Netlify/Northflank. L'aperçu avec backend local a échoué sur une restriction d'énumération des interfaces réseau ; les essais visuels ont donc utilisé une simulation contrôlée des états serveur. Le dernier ajustement des dos adverses sur écran court a été vérifié par compilation, sans nouvelle capture. Le paysage très court et le clavier virtuel restent à valider sur appareils réels.

Limites conservées et explicitées du calcul fourni :

- L'énumération exacte préflop demeure synchrone et peut occuper Node pendant plusieurs secondes. Aucun worker de calcul n'est ajouté dans cette livraison.
- Les pourcentages représentent la comparaison des mains, pas l'espérance pondérée des pots secondaires. Les pots sont toujours calculés par le moteur et testés séparément.
- Red River n'est pas mathématiquement couverte par l'équité Hold'em standard à cinq cartes. L'interface la désigne comme « équité Hold'em 5 cartes ». Au-delà d'un board de cinq cartes déjà présent au moment du tapis, aucun pourcentage n'est inventé. La séquence et le règlement restent fonctionnels.
- Le coin de carte est une animation 2D, pas une simulation physique du papier. Aucun asset photoréaliste ni thème de dos de carte supplémentaire n'a été ajouté.

L'authentification, les migrations et volumes SQLite, les règles de pots et blindes, les routes WebSocket, Docker, Northflank et les workflows GitHub sont conservés. Aucune intervention sur les services en production n'a été effectuée.
