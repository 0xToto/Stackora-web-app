// Contenu des règles. Les chapitres STACKORA décrivent le moteur réel
// (server/src/engine.ts, tournament.ts, docs/RULES.md) : ne pas modifier sans changer le code.
import type { Variant } from "../types";

export type Block =
  | { kind: "text"; body: string }
  | { kind: "cards"; cards: string[]; caption: string; board?: string[] }
  | { kind: "tip"; body: string }
  | { kind: "steps"; items: { title: string; body: string }[] };
export type Example = { title: string; hero?: string[]; board?: string[]; body: string };
export type Chapter = { id: string; title: string; summary: string; icon: string; blocks: Block[]; examples?: Example[] };

export const HOLDEM: Chapter[] = [
  {
    id: "goal",
    title: "Le but du jeu",
    icon: "flag-outline",
    summary: "Gagner des jetons, puis tous les jetons.",
    blocks: [
      { kind: "text", body: "Au Texas Hold'em, chaque joueur reçoit deux cartes privées. Cinq cartes communes sont ensuite posées au centre. Vous formez la meilleure main de cinq cartes en combinant librement vos deux cartes et les cartes communes." },
      { kind: "text", body: "On remporte un pot de deux façons : avoir la meilleure main à l'abattage (le showdown), ou faire coucher tous les adversaires avant. En tournoi, le dernier joueur qui possède des jetons gagne." },
      { kind: "tip", body: "Sur STACKORA, les jetons n'ont aucune valeur réelle. Personne ne mise d'argent." },
    ],
    examples: [
      { title: "Gagner sans montrer", hero: ["9s", "8s"], board: ["Kd", "4c", "2h"], body: "Vous misez sur le flop, tous les adversaires se couchent : le pot est à vous, même avec une main faible. Vos cartes ne sont pas montrées." },
      { title: "Gagner à l'abattage", hero: ["Ah", "Kd"], board: ["Ac", "9s", "5d", "2c", "Jh"], body: "Deux joueurs restent après la river. Votre paire d'As avec un Roi bat la paire d'As de l'adversaire s'il a un kicker plus faible." },
    ],
  },
  {
    id: "deck",
    title: "Les cartes",
    icon: "albums-outline",
    summary: "52 cartes, 4 couleurs, 13 rangs.",
    blocks: [
      { kind: "text", body: "Le jeu compte 52 cartes : 13 rangs (2, 3, 4, 5, 6, 7, 8, 9, 10, Valet, Dame, Roi, As) dans 4 couleurs (pique, cœur, carreau, trèfle). Aucune couleur n'est supérieure à une autre." },
      { kind: "cards", cards: ["As", "Kh", "Qd", "Jc", "Ts"], caption: "As, Roi, Dame, Valet, 10" },
      { kind: "text", body: "L'As est la carte la plus haute, mais il peut aussi servir de carte basse dans la suite A-2-3-4-5 (la « roue »)." },
      { kind: "cards", cards: ["5h", "4s", "3d", "2c", "Ah"], caption: "La roue : suite hauteur 5" },
      { kind: "tip", body: "Activez les cartes à quatre couleurs dans Paramètres › Jeu : carreau bleu, trèfle vert. Les couleurs se distinguent d'un coup d'œil." },
    ],
  },
  {
    id: "blinds",
    title: "Les blindes et le bouton",
    icon: "ellipse-outline",
    summary: "Deux mises forcées pour lancer l'action.",
    blocks: [
      { kind: "text", body: "Le bouton dealer (le jeton « D ») indique qui distribue fictivement. Il avance d'un siège occupé à chaque main." },
      { kind: "text", body: "Les deux joueurs à gauche du bouton posent des mises obligatoires : la petite blinde (SB) puis la grosse blinde (BB). Sur STACKORA, la SB vaut la moitié de la BB, arrondie vers le bas (minimum 1)." },
      { kind: "text", body: "En tête-à-tête (2 joueurs), le bouton paie la petite blinde et parle en premier avant le flop ; la grosse blinde parle en premier après le flop." },
      { kind: "tip", body: "Les blindes garantissent qu'il y a toujours quelque chose à gagner. Sans elles, tout le monde attendrait les As." },
    ],
  },
  {
    id: "positions",
    title: "Les positions",
    icon: "locate-outline",
    summary: "Parler en dernier est un avantage.",
    blocks: [
      { kind: "text", body: "Votre position dépend de votre place par rapport au bouton. Plus vous parlez tard, plus vous avez d'informations sur les autres : c'est l'avantage de position." },
      {
        kind: "steps",
        items: [
          { title: "UTG (Under the Gun)", body: "Juste après la BB. Premier à parler avant le flop : jouez serré." },
          { title: "UTG+1, Lojack (LJ), Hijack (HJ)", body: "Les positions intermédiaires, à 7 ou 8 joueurs." },
          { title: "Cutoff (CO)", body: "Juste avant le bouton : une excellente position pour ouvrir." },
          { title: "Bouton (BTN)", body: "La meilleure place : vous parlez en dernier sur le flop, la turn et la river." },
          { title: "Small Blind (SB) et Big Blind (BB)", body: "Elles parlent en dernier avant le flop, mais en premier ensuite." },
        ],
      },
      { kind: "tip", body: "Entraînez-vous dans Exercices › Quiz des positions, en 6-max et 8-max." },
    ],
  },
  {
    id: "streets",
    title: "Le déroulement d'une main",
    icon: "layers-outline",
    summary: "Préflop, flop, turn, river, showdown.",
    blocks: [
      {
        kind: "steps",
        items: [
          { title: "Distribution", body: "Chacun reçoit deux cartes privées, face cachée." },
          { title: "Préflop", body: "Premier tour d'enchères, en commençant par le joueur à gauche de la BB." },
          { title: "Flop", body: "Une carte est brûlée, puis trois cartes communes sont retournées. Nouveau tour d'enchères, en commençant par le premier joueur actif à gauche du bouton." },
          { title: "Turn", body: "Une carte brûlée, une quatrième carte commune, puis un tour d'enchères." },
          { title: "River", body: "Une carte brûlée, la cinquième carte commune, le dernier tour d'enchères." },
          { title: "Showdown", body: "S'il reste au moins deux joueurs, les cartes sont montrées. La meilleure main de cinq cartes gagne." },
        ],
      },
      { kind: "cards", cards: ["Kc", "8d", "3s"], caption: "Le flop : trois cartes communes" },
      { kind: "tip", body: "Les cartes brûlées ne sont jamais envoyées à votre téléphone. Le mélange est fait sur le serveur avec un générateur cryptographique." },
    ],
  },
  {
    id: "actions",
    title: "Les actions",
    icon: "hand-left-outline",
    summary: "Passer, parole, suivre, miser, relancer, tapis.",
    blocks: [
      {
        kind: "steps",
        items: [
          { title: "Passer (Fold)", body: "Vous abandonnez la main et les jetons déjà misés." },
          { title: "Parole (Check)", body: "Possible seulement si personne n'a misé dans le tour : vous ne mettez rien et passez la main au suivant." },
          { title: "Suivre (Call)", body: "Vous égalisez la mise la plus haute du tour." },
          { title: "Miser (Bet)", body: "Vous ouvrez les enchères du tour." },
          { title: "Relancer (Raise)", body: "Vous augmentez une mise existante." },
          { title: "Tapis (All-in)", body: "Vous misez tous vos jetons. Vous ne pouvez plus être forcé à mettre davantage." },
        ],
      },
      { kind: "tip", body: "Sur STACKORA, le montant d'une relance est le total misé dans le tour (« relance à »), pas le supplément." },
    ],
  },
  {
    id: "betting",
    title: "Mises et relances",
    icon: "trending-up-outline",
    summary: "Le minimum, le no-limit et les petits tapis.",
    blocks: [
      { kind: "text", body: "STACKORA joue en No-Limit : vous pouvez miser jusqu'à la totalité de votre tapis à tout moment." },
      { kind: "text", body: "Une relance doit être au moins égale à la mise courante plus la dernière relance complète. Exemple : la BB est de 100, un joueur relance à 300 (+200). La relance suivante doit aller à 500 minimum." },
      { kind: "text", body: "Un tapis inférieur à une relance complète est autorisé, mais il ne rouvre pas les enchères pour un joueur qui a déjà parlé. Plusieurs petits tapis successifs rouvrent l'action dès qu'ils cumulent une relance complète par rapport à la dernière action de ce joueur." },
      { kind: "text", body: "Si une mise n'est suivie par personne, le surplus est rendu à son auteur avant le calcul des pots." },
    ],
  },
  {
    id: "pots",
    title: "Le pot et les pots secondaires",
    icon: "pie-chart-outline",
    summary: "Qui peut gagner quoi quand un joueur est à tapis.",
    blocks: [
      { kind: "text", body: "Le pot rassemble toutes les mises de la main. Quand un joueur est à tapis avec moins de jetons que les autres, il ne peut gagner que ce que chaque adversaire a mis jusqu'à son montant : c'est le pot principal." },
      { kind: "text", body: "Les mises au-delà forment un pot secondaire, disputé seulement par ceux qui y ont contribué. Il peut y avoir plusieurs pots secondaires." },
      {
        kind: "steps",
        items: [
          { title: "Alice met 200 (tapis)", body: "Pot principal : 200 × 3 = 600, Alice, Boris et Chloé peuvent le gagner." },
          { title: "Boris et Chloé mettent 500", body: "Pot secondaire : 300 × 2 = 600, seuls Boris et Chloé peuvent le gagner." },
          { title: "Abattage", body: "Si Alice a la meilleure main, elle gagne 600. Le meilleur entre Boris et Chloé gagne l'autre pot de 600." },
        ],
      },
      { kind: "tip", body: "Les joueurs couchés ont contribué aux pots mais ne peuvent pas les gagner." },
    ],
  },
  {
    id: "ties",
    title: "Égalités et partages",
    icon: "git-compare-outline",
    summary: "Mains identiques : pot partagé.",
    blocks: [
      { kind: "text", body: "Deux mains de même catégorie se départagent par leurs cartes les plus hautes, dans l'ordre (le kicker). Si les cinq cartes ont exactement la même valeur, le pot est partagé." },
      { kind: "cards", cards: ["Ad", "Kc"], board: ["As", "Qh", "8d", "5c", "2s"], caption: "Paire d'As, kicker Roi" },
      { kind: "cards", cards: ["Ah", "Jd"], board: ["As", "Qh", "8d", "5c", "2s"], caption: "Paire d'As, kicker Dame puis Valet : perd" },
      { kind: "text", body: "Sur STACKORA, un jeton impossible à diviser va au premier gagnant situé après le bouton, dans l'ordre des sièges. Il n'y a aucune commission." },
    ],
  },
  {
    id: "tournaments",
    title: "Les tournois",
    icon: "trophy-outline",
    summary: "Éliminations, niveaux, table finale.",
    blocks: [
      { kind: "text", body: "Chacun commence avec le même tapis. Un joueur qui n'a plus de jetons est éliminé ; le dernier survivant gagne. Le classement est définitif." },
      { kind: "text", body: "Les blindes doublent à chaque niveau (durée choisie par l'organisateur), jusqu'au niveau 13. Une main en cours garde toujours les blindes de son début." },
      { kind: "text", body: "Les tables accueillent 8 joueurs maximum. Entre deux mains, STACKORA ferme les tables devenues inutiles et déplace le moins de joueurs possible pour équilibrer (au plus un joueur d'écart). Un joueur transféré qui vient de payer la BB ne la repaie pas immédiatement." },
      { kind: "text", body: "Quand il reste 8 joueurs ou moins, tous se retrouvent à la table finale." },
      { kind: "text", body: "Éliminations simultanées : le joueur qui avait le plus petit tapis avant la main est classé derrière." },
      { kind: "tip", body: "Si vous ne jouez pas à temps, STACKORA fait parole si c'est possible, sinon vous passez. Vous continuez à payer les blindes." },
    ],
  },
];

export type VariantRule = { id: Variant; name: string; tagline: string; symbol: string; blocks: Block[]; examples: Example[] };
export const VARIANTS: VariantRule[] = [
  {
    id: "classic",
    name: "Texas Hold'em",
    tagline: "Le classique, sans règle maison.",
    symbol: "♠",
    blocks: [{ kind: "text", body: "Les règles des chapitres Hold'em s'appliquent telles quelles." }],
    examples: [],
  },
  {
    id: "sevenTwo",
    name: "7 / 2",
    tagline: "Gagner avec la pire main rapporte une prime.",
    symbol: "72",
    blocks: [
      { kind: "cards", cards: ["7h", "2c"], caption: "Un 7 et un 2, assortis ou non" },
      { kind: "text", body: "Une main contenant exactement un 7 et un 2 peut déclencher une prime : chaque autre joueur ayant reçu des cartes, y compris ceux qui se sont couchés, paie une grosse blinde de la main au gagnant." },
      {
        kind: "steps",
        items: [
          { title: "Condition 1 : gagner seul un pot", body: "Vous devez remporter seul au moins un pot (principal ou secondaire). Une égalité sur tous les pots ne suffit pas." },
          { title: "Condition 2 : showdown ou agression", body: "Soit vous gagnez à l'abattage disputé, soit votre mise ou relance a provoqué au moins un abandon." },
          { title: "Pas de walk", body: "Gagner les blindes sans avoir misé (tout le monde se couche devant vous sans mise de votre part) ne déclenche pas la prime." },
        ],
      },
      { kind: "text", body: "Quand un 7/2 gagne parce que tous les adversaires se couchent, ses cartes sont révélées automatiquement à toute la table." },
      { kind: "text", body: "La prime se règle après tous les pots, sur les jetons restants : chacun paie au plus une BB, et seulement ce qu'il lui reste. Pas de dette, pas de tapis négatif ; un joueur à tapis sans jeton paie zéro." },
      { kind: "text", body: "Si plusieurs joueurs avec 7/2 gagnent chacun seul un pot distinct, chacun reçoit sa prime. La prime peut transformer un joueur presque éliminé en éliminé : l'élimination est constatée à la fin de la main." },
    ],
    examples: [
      { title: "Bluff récompensé", hero: ["7d", "2s"], board: ["Kh", "Qc", "4d"], body: "Vous misez au flop, les deux adversaires se couchent. Vous gagnez seul, grâce à votre mise : prime d'une BB par adversaire, et vos cartes sont révélées." },
      { title: "Égalité : pas de prime", hero: ["7c", "2h"], board: ["As", "Ad", "Ks", "Kd", "Qh"], body: "Le board joue pour tout le monde : le pot est partagé. Sans victoire seule, pas de prime." },
      { title: "Walk : pas de prime", hero: ["7s", "2d"], body: "Vous êtes en BB et tout le monde se couche avant vous. Vous gagnez les blindes sans avoir misé : pas de prime." },
    ],
  },
  {
    id: "ghost",
    name: "Ghost Poker",
    tagline: "Un adversaire invisible. Un pot qui survit.",
    symbol: "◈",
    blocks: [
      { kind: "text", body: "Un fantôme reçoit deux vraies cartes, retirées du paquet. Il n'a ni siège, ni tapis, ni mise. Même si tout le monde se couche sauf un joueur, le board est complété et les cartes du fantôme sont révélées." },
      { kind: "text", body: "Pour chaque pot, le meilleur joueur encore en lice doit battre strictement le fantôme. Une égalité avec le fantôme suffit à lui donner le pot." },
      { kind: "text", body: "Les pots gagnés par le fantôme forment le Ghost Pot de la table. À la main suivante, il devient un pot à part, ouvert à tous les joueurs non couchés de la nouvelle main, même avec un petit tapis." },
      { kind: "text", body: "Quand une table ferme, son Ghost Pot rejoint une table conservée. S'il ne reste qu'un joueur avec des jetons, il récupère tout Ghost Pot restant. Si le fantôme a capturé tous les jetons, le Ghost Pot va au plus gros tapis d'avant la dernière main." },
    ],
    examples: [{ title: "Battu par le fantôme", hero: ["Qs", "Qd"], board: ["Kh", "8c", "4s", "2d", "9h"], body: "Vous êtes seul en lice avec une paire de Dames. Le fantôme révèle K-J : paire de Rois. Le pot part dans le Ghost Pot pour la main suivante." }],
  },
  {
    id: "redRiver",
    name: "Red River",
    tagline: "Une river rouge ? La partie continue.",
    symbol: "♥",
    blocks: [
      { kind: "text", body: "Préflop, flop et turn se jouent normalement. Si la première river est noire (pique ou trèfle), les mises s'arrêtent et on passe à l'abattage." },
      { kind: "text", body: "Si la river est rouge (cœur ou carreau), un nouveau tour d'enchères a lieu puis une carte supplémentaire est retournée. Noire : c'est fini. Rouge : on recommence." },
      { kind: "text", body: "Toutes les cartes restent sur le board. Chaque joueur prend la meilleure main de cinq cartes parmi ses deux cartes et toutes les cartes communes." },
      { kind: "text", body: "Une seule carte est brûlée, avant la première river. Si le paquet s'épuise, on termine le tour d'enchères puis abattage. Si tout le monde est à tapis, les rivers s'enchaînent automatiquement jusqu'à une noire." },
    ],
    examples: [{ title: "Deux rivers rouges", board: ["Ks", "9d", "4c", "8h", "Jd", "3s"], body: "La river 8♥ est rouge : on mise et on continue. Le J♦ est rouge : on recommence. Le 3♠ est noir : abattage, avec un board de six cartes." }],
  },
];

export const HAND_RANKS: { name: string; cards: string[]; body: string }[] = [
  { name: "Quinte flush royale", cards: ["As", "Ks", "Qs", "Js", "Ts"], body: "As, Roi, Dame, Valet, 10 de la même couleur. Imbattable." },
  { name: "Quinte flush", cards: ["9h", "8h", "7h", "6h", "5h"], body: "Cinq cartes qui se suivent, de la même couleur." },
  { name: "Carré", cards: ["Qc", "Qd", "Qh", "Qs", "4d"], body: "Quatre cartes de même rang." },
  { name: "Full", cards: ["Jh", "Jc", "Js", "7d", "7c"], body: "Un brelan et une paire." },
  { name: "Couleur", cards: ["Ad", "Jd", "8d", "5d", "2d"], body: "Cinq cartes de la même couleur, pas forcément consécutives." },
  { name: "Suite", cards: ["Tc", "9d", "8s", "7h", "6c"], body: "Cinq cartes consécutives de couleurs mélangées." },
  { name: "Brelan", cards: ["8s", "8h", "8d", "Kc", "3s"], body: "Trois cartes de même rang." },
  { name: "Double paire", cards: ["Ah", "Ac", "9s", "9d", "Kc"], body: "Deux paires différentes." },
  { name: "Paire", cards: ["Kh", "Kd", "Qs", "7c", "3d"], body: "Deux cartes de même rang." },
  { name: "Carte haute", cards: ["Ah", "Jc", "9s", "6d", "3c"], body: "Aucune combinaison : la carte la plus haute compte." },
];

/** Duels pour le comparateur. Le verdict est calculé par l'évaluateur, pas écrit à la main. */
export const DUELS: { board: string[]; a: string[]; b: string[]; note: string }[] = [
  { board: ["Kd", "9s", "5c", "2h", "Jd"], a: ["Ks", "Qc"], b: ["Kh", "Tc"], note: "Même paire de Rois : le kicker décide." },
  { board: ["8h", "7h", "2c", "Kh", "3s"], a: ["Ah", "4c"], b: ["9c", "6d"], note: "Couleur contre suite : la couleur l'emporte." },
  { board: ["Qs", "Qd", "6h", "6c", "2s"], a: ["Ah", "3d"], b: ["Kc", "Kd"], note: "Deux doubles paires : la plus haute paire gagne, puis la deuxième." },
  { board: ["As", "Ad", "Kh", "Kc", "Qd"], a: ["7c", "2h"], b: ["5s", "4s"], note: "Le board joue pour les deux : partage." },
  { board: ["Jh", "Ts", "9d", "3c", "2h"], a: ["Qh", "8c"], b: ["Kd", "Qd"], note: "Deux suites : la plus haute gagne." },
  { board: ["5d", "4c", "3h", "Kc", "9s"], a: ["Ah", "2d"], b: ["6s", "2c"], note: "La roue (5 haut) perd contre la suite 6 haut." },
];
