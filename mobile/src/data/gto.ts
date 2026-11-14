/**
 * Entraîneur de décision — format de scénarios versionné.
 *
 * FIABILITÉ : les scénarios de ce pack (« stackora-pedagogy-v1 ») sont des exercices
 * pédagogiques rédigés à partir des principes théoriques largement admis (positions,
 * cotes du pot, ranges d'ouverture usuelles, push/fold de type Nash à faible tapis).
 * Ils NE SONT PAS des sorties de solveur : aucune fréquence n'est donc affichée.
 *
 * Un pack issu d'un solveur peut être importé via `validatePack` : il doit déclarer
 * sa provenance (solveur, version, paramètres, licence) et fournir des fréquences
 * qui somment à 100 %. Voir docs/GTO_FORMAT.md.
 */
import { SOLVED } from "./gto-solved";
export type Act = "fold" | "check" | "call" | "bet" | "raise" | "allin";
export type Option = { act: Act; sizeBB?: number; label: string };
export type Source =
  | { kind: "pedagogical"; pack: string; note: string }
  | { kind: "solver"; pack: string; solver: string; solverVersion: string; settings: string; license: string; importedAt?: string };
export type Scenario = {
  id: string;
  version: number;
  street: "preflop" | "postflop";
  /** Type de décision, pour le suivi par catégorie. */
  type: "RFI" | "BB defense" | "3-bet" | "vs 3-bet" | "4-bet" | "Push/fold" | "Short stack" | "C-bet" | "vs C-bet" | "Check-raise" | "Value bet" | "Bluff" | "Bluff catch" | "Turn barrel" | "SPR" | "Board texture" | "River";
  difficulty: 1 | 2 | 3;
  title: string;
  players: number;
  /** Positions de la situation, la première est le héros. */
  hero: { pos: string; cards: [string, string] };
  villains: { pos: string; stackBB: number }[];
  stackBB: number;
  blinds: string;
  board: string[];
  potBB: number;
  history: string[];
  facing: string;
  options: Option[];
  /** Index des options recommandées / acceptables. */
  best: number[];
  acceptable?: number[];
  /** Fréquences du héros par option (somme 100). Uniquement pour une source solveur. */
  frequencies?: number[] | null;
  /** Fréquences de toute la range du héros à ce nœud. */
  rangeFrequencies?: number[];
  /** Hypothèses du modèle résolu (ranges d'entrée, tailles, convergence). */
  model?: { hero: "oop" | "ip"; oop: string; ip: string; sizes: number[]; maxRaises: number; iterations: number; exploitabilityPct: number; buckets?: number | null };
  explanation: string;
  keyPoints: string[];
  source: Source;
};
const PEDA: Source = { kind: "pedagogical", pack: "stackora-fondamentaux-v1", note: "Fondamental pédagogique (situation multijoueur non résolue ici) : pas de fréquences" };

const FUNDAMENTALS: Scenario[] = [
  {
    id: "pf-rfi-btn-a5s", version: 1, street: "preflop", type: "RFI", difficulty: 1, title: "Ouverture au bouton",
    players: 6, hero: { pos: "BTN", cards: ["Ah", "5h"] }, villains: [{ pos: "SB", stackBB: 100 }, { pos: "BB", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 1.5,
    history: ["UTG passe", "HJ passe", "CO passe"], facing: "Personne n'est entré dans le coup.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", label: "Limper 1 BB" }, { act: "raise", sizeBB: 2.5, label: "Relancer à 2,5 BB" }],
    best: [2], explanation: "Au bouton, seules les deux blindes restent à parler et vous aurez la position sur elles pour toute la main. Un As assorti est une ouverture évidente : il fait des couleurs max, des suites (roue) et bloque les As adverses.",
    keyPoints: ["Le bouton ouvre la range la plus large de la table.", "Limper au bouton laisse les blindes voir un flop à bon prix : relancez ou passez.", "Les As assortis jouent bien en position."], source: PEDA,
  },
  {
    id: "pf-rfi-utg-k9o", version: 1, street: "preflop", type: "RFI", difficulty: 1, title: "Premier de parole à 8",
    players: 8, hero: { pos: "UTG", cards: ["Kc", "9d"] }, villains: [], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 1.5,
    history: [], facing: "Vous parlez en premier, sept joueurs derrière vous.",
    options: [{ act: "fold", label: "Passer" }, { act: "raise", sizeBB: 2.5, label: "Relancer à 2,5 BB" }],
    best: [0], explanation: "Sept joueurs peuvent encore vous relancer ou vous payer en position. K9 dépareillé est souvent dominé (KT, KJ, KQ, AK) et joue mal hors de position. En premier de parole à 8, on ouvre une range serrée.",
    keyPoints: ["Plus il reste de joueurs derrière, plus il faut être sélectif.", "Les mains dépareillées « moyennes » sont souvent dominées.", "La position compte autant que les cartes."], source: PEDA,
  },
  {
    id: "pf-rfi-co-76s", version: 1, street: "preflop", type: "RFI", difficulty: 2, title: "Connecteurs au cutoff",
    players: 6, hero: { pos: "CO", cards: ["7s", "6s"] }, villains: [{ pos: "BTN", stackBB: 100 }, { pos: "SB", stackBB: 100 }, { pos: "BB", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 1.5,
    history: ["UTG passe", "HJ passe"], facing: "Trois joueurs derrière vous.",
    options: [{ act: "fold", label: "Passer" }, { act: "raise", sizeBB: 2.5, label: "Relancer à 2,5 BB" }],
    best: [1], acceptable: [0], explanation: "Au cutoff, les connecteurs assortis font partie des ouvertures standards à 100 BB : ils touchent des tirages et des mains cachées, et volent souvent les blindes. Passer n'est pas une grosse faute, mais l'ouverture rapporte davantage.",
    keyPoints: ["Les tapis profonds favorisent les mains « spéculatives ».", "Le cutoff est la deuxième meilleure position.", "Une ouverture gagne aussi souvent les blindes immédiatement."], source: PEDA,
  },
  {
    id: "pf-bb-k7o-vs-btn", version: 1, street: "preflop", type: "BB defense", difficulty: 2, title: "Défense de grosse blinde",
    players: 6, hero: { pos: "BB", cards: ["Kd", "7c"] }, villains: [{ pos: "BTN", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 4,
    history: ["Tous passent jusqu'au BTN", "BTN relance à 2,5 BB", "SB passe"], facing: "Il vous en coûte 1,5 BB pour un pot de 4 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 1.5, label: "Suivre 1,5 BB" }, { act: "raise", sizeBB: 11, label: "3-bet à 11 BB" }],
    best: [1], acceptable: [2], explanation: "Vous payez 1,5 BB pour gagner 4 BB : il suffit d'environ 27 % d'équité. Face à la range large du bouton, K7o en a nettement plus. La défense par un call est la ligne standard ; un 3-bet occasionnel est possible.",
    keyPoints: ["La BB a déjà investi : ses cotes sont excellentes.", "Plus l'ouvreur est en position tardive, plus on défend large.", "Calculez : à payer / (pot + à payer)."], source: PEDA,
  },
  {
    id: "pf-bb-q8o-vs-utg", version: 1, street: "preflop", type: "BB defense", difficulty: 2, title: "BB contre une ouverture UTG",
    players: 8, hero: { pos: "BB", cards: ["Qh", "8s"] }, villains: [{ pos: "UTG", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 4.5,
    history: ["UTG relance à 3 BB", "Tous passent"], facing: "Il vous en coûte 2 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 2, label: "Suivre 2 BB" }],
    best: [0], explanation: "L'ouverture UTG à 8 est très forte, et la relance plus grosse dégrade vos cotes. Q8o est souvent dominée (AQ, KQ, QJ) et vous jouerez hors de position. Passer est la décision raisonnable.",
    keyPoints: ["Les cotes ne suffisent pas si votre main est souvent dominée.", "La force de la range adverse dépend de sa position.", "Hors de position, on réalise moins son équité."], source: PEDA,
  },
  {
    id: "pf-3bet-btn-aqs", version: 1, street: "preflop", type: "3-bet", difficulty: 1, title: "3-bet de valeur",
    players: 6, hero: { pos: "BTN", cards: ["Ad", "Qd"] }, villains: [{ pos: "CO", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 4,
    history: ["CO relance à 2,5 BB"], facing: "Le cutoff a ouvert, vous êtes au bouton.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 2.5, label: "Suivre 2,5 BB" }, { act: "raise", sizeBB: 8, label: "3-bet à 8 BB" }],
    best: [2], acceptable: [1], explanation: "AQ assorti domine une grande partie de la range d'ouverture du cutoff. Le 3-bet construit le pot avec une main forte, isole l'ouvreur et retire l'avantage des blindes qui pourraient entrer à bon prix.",
    keyPoints: ["En position, 3-bet ≈ 3 fois la relance.", "Le 3-bet réduit le nombre de joueurs dans le coup.", "Payer reste correct, mais laisse les blindes squeezer."], source: PEDA,
  },
  {
    id: "pf-vs3bet-co-kk", version: 1, street: "preflop", type: "vs 3-bet", difficulty: 1, title: "Rois contre un 3-bet",
    players: 6, hero: { pos: "CO", cards: ["Kh", "Ks"] }, villains: [{ pos: "BTN", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 12,
    history: ["CO (vous) relance à 2,5 BB", "BTN 3-bet à 8 BB", "Blindes passent"], facing: "Il vous en coûte 5,5 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 5.5, label: "Suivre" }, { act: "raise", sizeBB: 21, label: "4-bet à 21 BB" }],
    best: [2], acceptable: [1], explanation: "Seuls les As vous dominent. Relancer à nouveau fait payer les mains fortes du bouton (QQ, JJ, AK) et protège votre main. Payer est jouable mais laisse les surcartes du bouton voir un flop gratuitement.",
    keyPoints: ["Avec les meilleures mains, on cherche à mettre de l'argent au milieu.", "Hors de position, construire le pot préflop simplifie la suite.", "Taille de 4-bet hors position ≈ 2,6 fois le 3-bet."], source: PEDA,
  },
  {
    id: "pf-4bet-aa", version: 1, street: "preflop", type: "4-bet", difficulty: 1, title: "As face à un 4-bet",
    players: 6, hero: { pos: "BTN", cards: ["Ac", "Ad"] }, villains: [{ pos: "CO", stackBB: 100 }], stackBB: 100, blinds: "0,5 / 1", board: [], potBB: 31.5,
    history: ["CO relance à 2,5 BB", "BTN (vous) 3-bet à 8 BB", "CO 4-bet à 22 BB"], facing: "Il vous en coûte 14 BB, il reste 78 BB derrière.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 14, label: "Suivre" }, { act: "allin", sizeBB: 100, label: "Tapis 100 BB" }],
    best: [2], acceptable: [1], explanation: "Vous avez la meilleure main possible. À 100 BB, le pot est déjà gros par rapport aux tapis : partir à tapis maximise la valeur contre KK, QQ et AK. Payer pour piéger reste défendable.",
    keyPoints: ["Après un 4-bet, le rapport tapis / pot est faible.", "Les As ne se couchent jamais préflop à 100 BB.", "Le piège a du sens si l'adversaire bluffe souvent."], source: PEDA,
  },
  {
    id: "pf-push-sb-a8o", version: 1, street: "preflop", type: "Push/fold", difficulty: 2, title: "Push or fold en SB",
    players: 8, hero: { pos: "SB", cards: ["As", "8c"] }, villains: [{ pos: "BB", stackBB: 10 }], stackBB: 10, blinds: "0,5 / 1", board: [], potBB: 1.5,
    history: ["Tous passent jusqu'à vous"], facing: "Tournoi, 10 BB effectives, une seule personne derrière.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 0.5, label: "Compléter" }, { act: "allin", sizeBB: 10, label: "Tapis 10 BB" }],
    best: [2], explanation: "À 10 BB en petite blinde contre la seule grosse blinde, les tableaux de push/fold de type Nash poussent une range très large, dont As-8. Le tapis gagne souvent les blindes tout de suite et a de bonnes chances quand il est payé.",
    keyPoints: ["Sous ~12 BB, le tapis direct remplace la relance.", "La fold equity est la moitié du profit.", "Plus il y a de joueurs derrière, plus la range se resserre."], source: PEDA,
  },
  {
    id: "pf-push-utg-k9o", version: 1, street: "preflop", type: "Push/fold", difficulty: 3, title: "Push or fold UTG",
    players: 8, hero: { pos: "UTG", cards: ["Kh", "9c"] }, villains: [], stackBB: 10, blinds: "0,5 / 1", board: [], potBB: 1.5,
    history: [], facing: "Tournoi, 10 BB, sept joueurs derrière.",
    options: [{ act: "fold", label: "Passer" }, { act: "allin", sizeBB: 10, label: "Tapis 10 BB" }],
    best: [0], explanation: "Avec sept joueurs derrière, la probabilité d'être payé par une main qui vous domine est élevée. Les ranges de push à 10 BB en premier de parole sont serrées ; K9 dépareillé n'en fait généralement pas partie.",
    keyPoints: ["La même main peut être un tapis au SB et un fold UTG.", "Chaque joueur derrière est une chance de rencontrer mieux.", "Patience : une meilleure position arrive vite."], source: PEDA,
  },
  {
    id: "pf-short-bb-reshove", version: 1, street: "preflop", type: "Short stack", difficulty: 2, title: "Resteal en BB",
    players: 6, hero: { pos: "BB", cards: ["Ad", "3c"] }, villains: [{ pos: "BTN", stackBB: 40 }], stackBB: 12, blinds: "0,5 / 1", board: [], potBB: 3.5,
    history: ["BTN relance à 2 BB", "SB passe"], facing: "Vous avez 12 BB, le bouton en a 40.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 1, label: "Suivre 1 BB" }, { act: "allin", sizeBB: 12, label: "Tapis 12 BB" }],
    best: [2], acceptable: [1], explanation: "Le bouton ouvre large. Votre tapis de 12 BB représente une menace sérieuse : en relançant à tapis avec un As, vous gagnez souvent 3,5 BB sans combat et restez rarement très derrière. Payer pour jouer hors de position avec 11 BB restants est moins efficace.",
    keyPoints: ["Un As bloque les meilleures mains adverses.", "À 10–15 BB, le resteal est une arme majeure.", "Le tapis adverse plus gros vous couvre, mais il doit payer avec une partie de sa range."], source: PEDA,
  },
  {
    id: "po-cbet-a72", version: 1, street: "postflop", type: "C-bet", difficulty: 1, title: "Continuation bet sur board sec",
    players: 2, hero: { pos: "BTN", cards: ["Kh", "Qh"] }, villains: [{ pos: "BB", stackBB: 97.5 }], stackBB: 97.5, blinds: "0,5 / 1", board: ["As", "7d", "2c"], potBB: 5.5,
    history: ["BTN (vous) relance à 2,5 BB", "BB suit", "Flop : BB checke"], facing: "Pot de 5,5 BB, la BB a checké.",
    options: [{ act: "check", label: "Checker" }, { act: "bet", sizeBB: 1.8, label: "Miser 1/3 pot (1,8 BB)" }, { act: "bet", sizeBB: 4, label: "Miser 3/4 pot (4 BB)" }],
    best: [1], acceptable: [0], explanation: "Ce flop sec avec un As avantage fortement la range du relanceur : vous avez plus d'As forts que la BB. Une petite mise suffit à faire coucher beaucoup de mains et coûte peu quand elle est payée.",
    keyPoints: ["Board sec + avantage de range = petite mise fréquente.", "Pas besoin de toucher pour miser.", "Checker reste possible avec une partie de la range."], source: PEDA,
  },
  {
    id: "po-vscbet-k83", version: 1, street: "postflop", type: "vs C-bet", difficulty: 1, title: "Défendre avec une paire",
    players: 2, hero: { pos: "BB", cards: ["8h", "7h"] }, villains: [{ pos: "BTN", stackBB: 97.5 }], stackBB: 97.5, blinds: "0,5 / 1", board: ["Ks", "8d", "3c"], potBB: 7.3,
    history: ["BTN relance à 2,5 BB", "BB (vous) suit", "Flop : vous checkez", "BTN mise 1,8 BB"], facing: "Il vous en coûte 1,8 BB pour un pot de 7,3 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 1.8, label: "Suivre" }, { act: "raise", sizeBB: 7, label: "Relancer à 7 BB" }],
    best: [1], explanation: "Face à une petite mise, vous n'avez besoin que d'environ 20 % d'équité. Votre deuxième paire bat tous les bluffs et beaucoup de mains moyennes. Relancer ferait coucher les mains que vous battez et payer celles qui vous battent.",
    keyPoints: ["Petite mise adverse = défense large.", "Une main moyenne préfère contrôler la taille du pot.", "Relancez des mains très fortes ou de vrais tirages."], source: PEDA,
  },
  {
    id: "po-xr-set", version: 1, street: "postflop", type: "Check-raise", difficulty: 2, title: "Check-raise avec un brelan",
    players: 2, hero: { pos: "BB", cards: ["4d", "4c"] }, villains: [{ pos: "CO", stackBB: 97.5 }], stackBB: 97.5, blinds: "0,5 / 1", board: ["Qs", "9d", "4h"], potBB: 5.5,
    history: ["CO relance à 2,5 BB", "BB (vous) suit", "Flop : vous checkez", "CO mise 3,5 BB"], facing: "Il vous en coûte 3,5 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 3.5, label: "Suivre" }, { act: "raise", sizeBB: 12, label: "Check-raise à 12 BB" }],
    best: [2], acceptable: [1], explanation: "Vous avez la main quasi maximale. Ce board offre des tirages (JT, T8, K-J) : relancer fait payer les paires de Dames et les tirages, et protège votre main. Suivre pour piéger est défendable mais laisse des cartes gratuites.",
    keyPoints: ["Construire le pot quand on est loin devant.", "Un board connecté pousse à protéger sa main.", "Le check-raise mélange valeur et tirages."], source: PEDA,
  },
  {
    id: "po-value-river", version: 1, street: "postflop", type: "Value bet", difficulty: 2, title: "Valeur à la river",
    players: 2, hero: { pos: "BTN", cards: ["Kc", "Jd"] }, villains: [{ pos: "BB", stackBB: 80 }], stackBB: 80, blinds: "0,5 / 1", board: ["Kd", "9c", "5s", "2h", "Jc"], potBB: 20,
    history: ["Préflop : vous relancez, BB suit", "Flop : mise, BB suit", "Turn : check, check", "River : BB checke"], facing: "Pot de 20 BB, la BB checke.",
    options: [{ act: "check", label: "Checker" }, { act: "bet", sizeBB: 6, label: "Miser 30 % (6 BB)" }, { act: "bet", sizeBB: 14, label: "Miser 70 % (14 BB)" }],
    best: [2], acceptable: [1], explanation: "Votre double paire bat toutes les paires de Rois et les Valets. L'adversaire a montré une main moyenne en payant le flop : une mise conséquente obtient de la valeur de K-Q, K-T, 9-9 et des tirages ratés qui paient trop. Checker laisserait de l'argent sur la table.",
    keyPoints: ["Misez quand des mains moins bonnes peuvent payer.", "La taille dépend de ce qui paie, pas de la peur.", "Un check au turn rend votre range moins lisible."], source: PEDA,
  },
  {
    id: "po-bluff-missed-flush", version: 1, street: "postflop", type: "Bluff", difficulty: 3, title: "Tirage raté à la river",
    players: 2, hero: { pos: "BTN", cards: ["Qs", "Js"] }, villains: [{ pos: "BB", stackBB: 85 }], stackBB: 85, blinds: "0,5 / 1", board: ["As", "8s", "3d", "Th", "2c"], potBB: 16,
    history: ["Préflop : vous relancez, BB suit", "Flop : mise, BB suit", "Turn : check, check", "River : BB checke"], facing: "Votre couleur ne rentre pas. Vous n'avez rien.",
    options: [{ act: "check", label: "Checker" }, { act: "bet", sizeBB: 11, label: "Miser 70 % (11 BB)" }],
    best: [1], acceptable: [0], explanation: "Avec hauteur Dame, vous ne gagnez presque jamais en checkant. Un bluff n'a besoin de réussir qu'environ 40 % du temps à cette taille. La range de la BB, qui a checké deux fois, contient beaucoup de mains moyennes qui peuvent se coucher. Le bluff est la ligne pédagogique ; checker n'est pas une catastrophe.",
    keyPoints: ["Bluffez avec les mains sans valeur d'abattage.", "Une mise doit raconter une histoire cohérente.", "Fréquence de réussite nécessaire = mise / (pot + mise)."], source: PEDA,
  },
  {
    id: "po-bluffcatch", version: 1, street: "postflop", type: "Bluff catch", difficulty: 2, title: "Bluff catcher à la river",
    players: 2, hero: { pos: "BB", cards: ["Ah", "Td"] }, villains: [{ pos: "BTN", stackBB: 70 }], stackBB: 70, blinds: "0,5 / 1", board: ["Ac", "9d", "5s", "7c", "3h"], potBB: 24,
    history: ["Flop : check, mise, suivi", "Turn : check, check", "River : vous checkez, BTN mise 12 BB"], facing: "Il vous en coûte 12 BB pour un pot de 36 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 12, label: "Suivre 12 BB" }, { act: "raise", sizeBB: 40, label: "Relancer à 40 BB" }],
    best: [1], explanation: "Vous devez gagner 25 % du temps. Le tirage à trèfle et les tirages de suite ratés font partie de la range du bouton, qui a checké la turn. Votre paire d'As bat tous ces bluffs. Relancer ne fait payer que mieux.",
    keyPoints: ["Un bluff catcher bat les bluffs et perd contre la valeur.", "Cotes : 12 / (36 + 12) = 25 %.", "Ne relancez pas une main qui ne fait payer que mieux."], source: PEDA,
  },
  {
    id: "po-turn-barrel", version: 1, street: "postflop", type: "Turn barrel", difficulty: 2, title: "Deuxième barrel avec tirage",
    players: 2, hero: { pos: "BTN", cards: ["Qh", "Jh"] }, villains: [{ pos: "BB", stackBB: 95 }], stackBB: 95, blinds: "0,5 / 1", board: ["Ks", "Tc", "4d", "2h"], potBB: 9,
    history: ["Préflop : vous relancez, BB suit", "Flop : check, vous misez 2 BB, BB suit", "Turn : BB checke"], facing: "Pot de 9 BB. Vous avez un tirage à suite par les deux bouts.",
    options: [{ act: "check", label: "Checker" }, { act: "bet", sizeBB: 6, label: "Miser 2/3 pot (6 BB)" }],
    best: [1], acceptable: [0], explanation: "Avec 8 outs pour la suite (et des cœurs en backdoor), votre main a de l'équité si elle est payée et peut faire coucher les paires faibles. Le semi-bluff combine deux façons de gagner.",
    keyPoints: ["Semi-bluff = fold equity + équité de tirage.", "Les tirages ouverts sont les meilleurs barrels.", "Checker reste correct pour voir la river gratuitement."], source: PEDA,
  },
  {
    id: "po-spr-low", version: 1, street: "postflop", type: "SPR", difficulty: 2, title: "SPR faible avec top paire",
    players: 2, hero: { pos: "SB", cards: ["As", "Kd"] }, villains: [{ pos: "BTN", stackBB: 25 }], stackBB: 25, blinds: "0,5 / 1", board: ["Kh", "8c", "3d"], potBB: 20,
    history: ["Préflop : 3-bet de votre part, BTN suit", "Flop : vous checkez, BTN mise 8 BB"], facing: "Pot de 28 BB, il vous reste 25 BB (SPR au flop = 25 / 20 ≈ 1,25).",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 8, label: "Suivre 8 BB" }, { act: "allin", sizeBB: 25, label: "Tapis 25 BB" }],
    best: [2], acceptable: [1], explanation: "Avec un tapis à peine supérieur au pot (SPR ≈ 1,25), la top paire meilleur kicker est engagée. Tapis maximise la valeur contre les paires et tirages et ne laisse aucune mauvaise carte à la turn.",
    keyPoints: ["SPR = tapis effectif / pot au flop.", "SPR bas : top paire = main de tapis.", "SPR élevé : la même main se joue plus prudemment."], source: PEDA,
  },
  {
    id: "po-wet-oop", version: 1, street: "postflop", type: "Board texture", difficulty: 3, title: "Board connecté hors de position",
    players: 2, hero: { pos: "UTG", cards: ["Ac", "Ad"] }, villains: [{ pos: "BTN", stackBB: 97 }], stackBB: 97, blinds: "0,5 / 1", board: ["Jh", "Th", "9s"], potBB: 6.5,
    history: ["Préflop : vous ouvrez, BTN suit"], facing: "Vous parlez en premier sur un flop très connecté.",
    options: [{ act: "check", label: "Checker" }, { act: "bet", sizeBB: 2.2, label: "Miser 1/3" }, { act: "bet", sizeBB: 5, label: "Miser 3/4" }],
    best: [0, 2], explanation: "Ce flop frappe fort la range du bouton (suites, doubles paires, tirages). Hors de position, une stratégie qui checke souvent protège votre range ; avec une main forte mais vulnérable comme AA, miser gros pour faire payer les tirages se défend aussi. La petite mise est la moins logique ici.",
    keyPoints: ["Board connecté = avantage au joueur qui a payé.", "Les petites mises conviennent aux boards secs.", "Plusieurs lignes peuvent être correctes : c'est normal."], source: PEDA,
  },
  {
    id: "po-river-overbet", version: 1, street: "postflop", type: "River", difficulty: 3, title: "Overbet à la river",
    players: 2, hero: { pos: "BB", cards: ["9h", "8h"] }, villains: [{ pos: "BTN", stackBB: 60 }], stackBB: 60, blinds: "0,5 / 1", board: ["Qd", "9c", "4s", "2d", "Kc"], potBB: 18,
    history: ["Flop : check, mise, suivi", "Turn : check, mise, suivi", "River : vous checkez, BTN mise 30 BB"], facing: "Il vous en coûte 30 BB pour un pot de 48 BB.",
    options: [{ act: "fold", label: "Passer" }, { act: "call", sizeBB: 30, label: "Suivre 30 BB" }],
    best: [0], explanation: "Trois barrels avec une surmise : la range du bouton est très polarisée vers des Dames, des Rois et des mains plus fortes. Votre deuxième paire ne bat presque que les bluffs, et le prix demandé (38 %) exige de les trouver souvent.",
    keyPoints: ["Plus la mise est grosse, plus il faut d'équité.", "Trois mises représentent une range forte.", "Coucher une main moyenne n'est pas une faiblesse."], source: PEDA,
  },
];

/**
 * Pack actif : d'abord les solutions calculées (solveur / Nash), puis les
 * fondamentaux pédagogiques qui ne sont pas couverts par une solution.
 */
const REPLACED = new Set(["pf-push-sb-a8o"]);
export const SCENARIOS: Scenario[] = [...SOLVED, ...FUNDAMENTALS.filter((f) => !REPLACED.has(f.id) && !SOLVED.some((s) => s.id === f.id))];
export const isSolved = (s: Scenario) => s.source.kind === "solver";

/** Validation d'un pack importé (solveur ou pédagogique). Retourne les erreurs. */
export function validatePack(pack: { scenarios: Scenario[] }): string[] {
  const errors: string[] = [];
  for (const s of pack.scenarios ?? []) {
    const p = `${s.id ?? "?"}`;
    if (!s.id || !s.version) errors.push(`${p} : id et version obligatoires`);
    if (!s.source?.kind) errors.push(`${p} : provenance obligatoire`);
    if (!s.options?.length || !s.best?.length) errors.push(`${p} : options et réponse obligatoires`);
    if (s.best?.some((i) => i < 0 || i >= s.options.length)) errors.push(`${p} : index de réponse invalide`);
    if (s.source?.kind === "solver") {
      if (!s.source.solver || !s.source.license || !s.source.settings) errors.push(`${p} : solveur, paramètres et licence obligatoires`);
      if (!s.frequencies || s.frequencies.length !== s.options.length) errors.push(`${p} : fréquences requises pour une source solveur`);
      else if (Math.abs(s.frequencies.reduce((a, b) => a + b, 0) - 100) > 0.5) errors.push(`${p} : les fréquences doivent sommer à 100`);
    }
    if (s.source?.kind === "pedagogical" && s.frequencies) errors.push(`${p} : un exercice pédagogique ne doit pas afficher de fréquences`);
  }
  return errors;
}
export const TYPES = [...new Set(SCENARIOS.map((s) => s.type))];
