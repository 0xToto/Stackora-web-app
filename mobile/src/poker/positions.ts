// Noms des positions selon le nombre de joueurs.
// Ordre d'action préflop : UTG … CO, BTN, SB, BB.
// En heads-up, le bouton est aussi la petite blinde (règle appliquée par le moteur STACKORA).
export type Position = "BTN" | "SB" | "BB" | "UTG" | "UTG+1" | "LJ" | "HJ" | "CO" | "BTN/SB";
export const POSITION_NAME: Record<Position, string> = {
  BTN: "Bouton",
  SB: "Small Blind",
  BB: "Big Blind",
  UTG: "Under the Gun",
  "UTG+1": "UTG+1",
  LJ: "Lojack",
  HJ: "Hijack",
  CO: "Cutoff",
  "BTN/SB": "Bouton / Small Blind",
};
/** Positions des sièges non-blindes et non-bouton, du premier au dernier à parler. */
function middle(k: number): Position[] {
  return (
    [[], ["UTG"], ["UTG", "CO"], ["UTG", "HJ", "CO"], ["UTG", "LJ", "HJ", "CO"], ["UTG", "UTG+1", "LJ", "HJ", "CO"]] as Position[][]
  )[k] ?? (["UTG", "UTG+1", "LJ", "HJ", "CO"] as Position[]);
}
/**
 * `seats` : sièges occupés ; `button` : siège du bouton.
 * Retourne la position de chaque siège.
 */
export function positionsFor(seats: number[], button: number, size = 8): Map<number, Position> {
  const sorted = [...seats].sort((a, b) => ((a - button + size) % size) - ((b - button + size) % size));
  const out = new Map<number, Position>();
  const n = sorted.length;
  if (n === 2) {
    out.set(sorted[0], "BTN/SB");
    out.set(sorted[1], "BB");
    return out;
  }
  out.set(sorted[0], "BTN");
  out.set(sorted[1], "SB");
  out.set(sorted[2], "BB");
  const mid = middle(n - 3);
  sorted.slice(3).forEach((s, i) => out.set(s, mid[i]));
  return out;
}
/** Ordre d'action : préflop commence après la BB, postflop après le bouton. */
export function actionOrder(seats: number[], button: number, street: "preflop" | "postflop", size = 8): number[] {
  const sorted = [...seats].sort((a, b) => ((a - button + size) % size || size) - ((b - button + size) % size || size));
  // sorted : SB, BB, UTG, …, BTN
  if (seats.length === 2) {
    const btn = seats.find((s) => s === button)!;
    const bb = seats.find((s) => s !== button)!;
    return street === "preflop" ? [btn, bb] : [bb, btn];
  }
  return street === "preflop" ? [...sorted.slice(2), ...sorted.slice(0, 2)] : sorted;
}
