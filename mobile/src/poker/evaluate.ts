// Évaluateur d'affichage uniquement (libellé de main, comparateur pédagogique).
// L'attribution réelle des pots reste exclusivement calculée par le serveur.
const RANKS = "23456789TJQKA";
export const CATEGORY = ["Carte haute", "Paire", "Double paire", "Brelan", "Suite", "Couleur", "Full", "Carré", "Quinte flush", "Quinte flush royale"];
const PLURAL: Record<string, string> = { A: "As", K: "Rois", Q: "Dames", J: "Valets", T: "10", "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2" };
const SINGULAR: Record<string, string> = { A: "As", K: "Roi", Q: "Dame", J: "Valet", T: "10" };
export type Score = { category: number; tiebreak: number[]; cards: string[] };

function score5(cards: string[]): Score {
  const vals = cards.map((c) => RANKS.indexOf(c[0])).sort((a, b) => b - a);
  const flush = cards.every((c) => c[1] === cards[0][1]);
  const uniq = [...new Set(vals)];
  let straightHigh = -1;
  if (uniq.length === 5 && vals[0] - vals[4] === 4) straightHigh = vals[0];
  if (uniq.length === 5 && vals[0] === 12 && vals[1] === 3) straightHigh = 3; // roue A-2-3-4-5
  const counts = uniq.map((v) => ({ v, n: vals.filter((x) => x === v).length })).sort((a, b) => b.n - a.n || b.v - a.v);
  const groups = counts.map((c) => c.v);
  if (straightHigh >= 0 && flush) return { category: straightHigh === 12 ? 9 : 8, tiebreak: [straightHigh], cards };
  if (counts[0].n === 4) return { category: 7, tiebreak: groups, cards };
  if (counts[0].n === 3 && counts[1]?.n === 2) return { category: 6, tiebreak: groups, cards };
  if (flush) return { category: 5, tiebreak: vals, cards };
  if (straightHigh >= 0) return { category: 4, tiebreak: [straightHigh], cards };
  if (counts[0].n === 3) return { category: 3, tiebreak: groups, cards };
  if (counts[0].n === 2 && counts[1]?.n === 2) return { category: 2, tiebreak: groups, cards };
  if (counts[0].n === 2) return { category: 1, tiebreak: groups, cards };
  return { category: 0, tiebreak: vals, cards };
}
export function compareScores(a: Score, b: Score) {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const d = (a.tiebreak[i] ?? -1) - (b.tiebreak[i] ?? -1);
    if (d) return d;
  }
  return 0;
}
/** Meilleure main de 5 cartes parmi 5 à 7 cartes (ou plus, Red River). */
export function best(cards: string[]): Score | null {
  if (cards.length < 5) return null;
  let top: Score | null = null;
  const n = cards.length;
  const pick = (start: number, acc: string[]) => {
    if (acc.length === 5) {
      const s = score5(acc);
      if (!top || compareScores(s, top) > 0) top = s;
      return;
    }
    for (let i = start; i <= n - (5 - acc.length); i++) pick(i + 1, [...acc, cards[i]]);
  };
  pick(0, []);
  return top;
}
export function describe(s: Score): string {
  const r = (i: number) => RANKS[s.tiebreak[i]];
  switch (s.category) {
    case 9: return "Quinte flush royale";
    case 8: return `Quinte flush hauteur ${SINGULAR[r(0)] ?? r(0)}`;
    case 7: return `Carré de ${PLURAL[r(0)]}`;
    case 6: return `Full aux ${PLURAL[r(0)]} par les ${PLURAL[r(1)]}`;
    case 5: return `Couleur hauteur ${SINGULAR[r(0)] ?? r(0)}`;
    case 4: return `Suite hauteur ${SINGULAR[r(0)] ?? r(0)}`;
    case 3: return `Brelan de ${PLURAL[r(0)]}`;
    case 2: return `Double paire ${PLURAL[r(0)]} et ${PLURAL[r(1)]}`;
    case 1: return `Paire de ${PLURAL[r(0)]}`;
    default: return `Hauteur ${SINGULAR[r(0)] ?? r(0)}`;
  }
}
/** Libellé de la main en cours (préflop : paire servie ou cartes assorties). */
export function handLabel(hole: string[], board: string[]): string | null {
  if (hole.length !== 2) return null;
  if (board.length >= 3) {
    const s = best([...hole, ...board]);
    return s ? describe(s) : null;
  }
  if (hole[0][0] === hole[1][0]) return `Paire de ${PLURAL[hole[0][0]]}`;
  return hole[0][1] === hole[1][1] ? "Assorties" : null;
}
/** Cartes qui composent la meilleure main, pour les mettre en évidence. */
export function winningCards(hole: string[], board: string[]): string[] {
  const s = best([...hole, ...board]);
  return s ? s.cards : [];
}
