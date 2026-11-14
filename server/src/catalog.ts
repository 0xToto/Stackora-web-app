// Catalogue cosmétique autoritaire. Le client ne fait qu'afficher ces données.
// Aucune pièce de ce catalogue ne modifie une règle, une probabilité ou un stack.
export type Slot =
  | "table"
  | "cardBack"
  | "cardFace"
  | "chips"
  | "avatar"
  | "frame"
  | "badge"
  | "winFx"
  | "showdownFx";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export interface Item {
  id: string;
  slot: Slot;
  name: string;
  description: string;
  rarity: Rarity;
  price: number;
  /** Visible par les adversaires (synchronisé) ou purement local. */
  visibility: "public" | "local";
  collection: string;
  free?: boolean;
  look: Record<string, string | number | boolean>;
}
/** Emplacements dont l'équipement est montré aux autres joueurs. */
export const PUBLIC_SLOTS: Slot[] = ["avatar", "frame", "badge", "cardBack", "winFx", "showdownFx"];
export const SLOTS: Slot[] = ["table", "cardBack", "cardFace", "chips", "avatar", "frame", "badge", "winFx", "showdownFx"];

const i = (
  id: string,
  slot: Slot,
  name: string,
  rarity: Rarity,
  price: number,
  collection: string,
  description: string,
  look: Item["look"],
  free = false,
): Item => ({
  id,
  slot,
  name,
  rarity,
  price: free ? 0 : price,
  collection,
  description,
  look,
  free,
  visibility: PUBLIC_SLOTS.includes(slot) ? "public" : "local",
});

export const CATALOG: Item[] = [
  // Tables (locales : chacun voit son propre tapis)
  i("table-obsidian", "table", "Obsidienne", "common", 0, "Tapis classiques", "Le tapis signature STACKORA : vert nuit profond, liseré cuivre.", { felt: "#123A31", felt2: "#0A221C", rail: "#1A1A1C", line: "#C8955A" }, true),
  i("table-midnight", "table", "Minuit", "common", 0, "Tapis classiques", "Bleu encre, très reposant pour les longues sessions.", { felt: "#16263A", felt2: "#0C1624", rail: "#16171A", line: "#7E9CC9" }, true),
  i("table-bordeaux", "table", "Bordeaux", "common", 400, "Tapis classiques", "Velours lie-de-vin et liseré or pâle.", { felt: "#4A1E2A", felt2: "#2A0F17", rail: "#18120F", line: "#D6AE72" }),
  i("table-graphite", "table", "Graphite", "rare", 1200, "Tables premium", "Anthracite mat, rail laqué, contraste maximal pour les cartes.", { felt: "#2A2C31", felt2: "#16171A", rail: "#0B0B0D", line: "#B9BCC4" }),
  i("table-monaco", "table", "Monaco", "epic", 2800, "Tables de casino", "Vert casino traditionnel, double liseré doré.", { felt: "#0F4A34", felt2: "#06281B", rail: "#2B1A10", line: "#E2B867", double: true }),
  i("table-aurora", "table", "Aurore boréale", "legendary", 6500, "Tables animées", "Un halo lent qui respire sous le tapis. Désactivé si les animations sont réduites.", { felt: "#141F3A", felt2: "#080D1C", rail: "#0B0B12", line: "#8C7CFF", glow: "#5B7CFF", animated: true }),
  i("table-hiver", "table", "Nuit d'hiver", "rare", 1400, "Thèmes saisonniers", "Bleu glacier et filet argenté.", { felt: "#1C3446", felt2: "#0D1B26", rail: "#121619", line: "#D8E6F2" }),
  // Dos de cartes (publics : vus sur vos cartes fermées, sans jamais révéler leur valeur)
  i("back-stackora", "cardBack", "Monogramme", "common", 0, "Dos de cartes", "Le losange STACKORA sur fond nuit.", { base: "#16352D", accent: "#C8955A", pattern: "monogram" }, true),
  i("back-onyx", "cardBack", "Onyx", "common", 350, "Jeux minimalistes", "Noir mat, fin filet cuivre. Rien de plus.", { base: "#141416", accent: "#B98856", pattern: "line" }),
  i("back-royal", "cardBack", "Royal", "rare", 1000, "Jeux premium", "Bleu roi et losanges dorés.", { base: "#1B2A5C", accent: "#E2B867", pattern: "diamond" }),
  i("back-rubis", "cardBack", "Rubis", "epic", 2600, "Jeux premium", "Rouge profond, rayons dorés.", { base: "#5A1424", accent: "#F0C27A", pattern: "sunburst" }),
  i("back-eclipse", "cardBack", "Éclipse", "legendary", 7000, "Cartes collector", "Disque d'or sur nuit violette. Série limitée à l'édition 1.", { base: "#1A1033", accent: "#FFD28A", pattern: "eclipse" }),
  // Faces (locales)
  i("face-classic", "cardFace", "Classique", "common", 0, "Faces", "Index généreux, lisibles à toutes les tailles.", { style: "classic" }, true),
  i("face-quattro", "cardFace", "Quattro", "common", 0, "Cartes à quatre couleurs", "Pique noir, cœur rouge, carreau bleu, trèfle vert. Fortement recommandé sur mobile.", { style: "classic", fourColor: true }, true),
  i("face-editorial", "cardFace", "Éditorial", "rare", 900, "Jeux minimalistes", "Typographie fine, grandes valeurs, contraste élevé.", { style: "minimal" }),
  // Jetons (locaux)
  i("chips-classic", "chips", "Argile", "common", 0, "Jetons classiques", "Jetons d'argile avec inserts de couleur.", { base: "#C8955A", edge: "#F3E3C6" }, true),
  i("chips-steel", "chips", "Acier", "rare", 1100, "Jetons métalliques", "Acier brossé, reflets froids.", { base: "#9AA3AD", edge: "#E6EAEE", metal: true }),
  i("chips-gold", "chips", "Or 24", "epic", 3200, "Jetons dorés", "Pour les stacks qui ont de la tenue.", { base: "#E2B867", edge: "#FFF1CC", metal: true }),
  // Avatars (publics)
  i("avatar-spade", "avatar", "Pique", "common", 0, "Avatars", "Sobre et efficace.", { glyph: "♠", bg: "#1E2A27", fg: "#E8D3A8" }, true),
  i("avatar-heart", "avatar", "Cœur", "common", 0, "Avatars", "Pour les joueurs qui jouent avec le cœur.", { glyph: "♥", bg: "#2A1B1F", fg: "#F0A3A8" }, true),
  i("avatar-crown", "avatar", "Couronne", "rare", 1200, "Avatars exclusifs", "Le roi de la table.", { glyph: "♛", bg: "#2B2214", fg: "#F2C978" }),
  i("avatar-ace", "avatar", "As", "epic", 2500, "Avatars exclusifs", "Une seule lettre suffit.", { glyph: "A", bg: "#141B33", fg: "#9DB4FF" }),
  i("avatar-comet", "avatar", "Comète", "legendary", 6000, "Avatars exclusifs", "Une trajectoire. Aucune pitié.", { glyph: "✦", bg: "#1A1033", fg: "#FFD28A" }),
  // Cadres (publics)
  i("frame-none", "frame", "Aucun", "common", 0, "Cadres", "Pas de cadre.", { color: "transparent" }, true),
  i("frame-copper", "frame", "Cuivre", "common", 450, "Cadres de profil", "Un filet cuivre poli.", { color: "#C8955A" }),
  i("frame-sapphire", "frame", "Saphir", "rare", 1300, "Cadres de profil", "Bleu électrique profond.", { color: "#5B7CFF" }),
  i("frame-imperial", "frame", "Impérial", "epic", 3000, "Bordures animées", "Double anneau or et ivoire.", { color: "#E2B867", color2: "#FFF1CC" }),
  i("frame-nebula", "frame", "Nébuleuse", "legendary", 7500, "Bordures animées", "Un anneau qui tourne lentement. Statique si les animations sont réduites.", { color: "#8C7CFF", color2: "#FFD28A", animated: true }),
  // Badges (publics)
  i("badge-none", "badge", "Aucun", "common", 0, "Badges", "Pas de badge.", { glyph: "", color: "transparent" }, true),
  i("badge-founder", "badge", "Fondateur", "rare", 800, "Badges", "Présent dès la première saison.", { glyph: "◆", color: "#E2B867" }),
  i("badge-shark", "badge", "Requin", "epic", 2200, "Badges", "Pour les prédateurs de table finale.", { glyph: "▲", color: "#5B7CFF" }),
  // Effets (publics, synchronisés via l'état de la main)
  i("win-classic", "winFx", "Halo", "common", 0, "Effets de victoire", "Un halo doré autour du gagnant.", { kind: "halo", color: "#E2B867" }, true),
  i("win-confetti", "winFx", "Confettis", "rare", 1500, "Effets de célébration", "Une pluie de confettis brefs, synchronisée pour toute la table.", { kind: "confetti", color: "#E2B867" }),
  i("win-supernova", "winFx", "Supernova", "legendary", 8000, "Effets de célébration", "Une onde de lumière qui traverse le tapis.", { kind: "nova", color: "#8C7CFF" }),
  i("show-none", "showdownFx", "Sobre", "common", 0, "Effets de showdown", "Les cartes se retournent, sans plus.", { kind: "none" }, true),
  i("show-spark", "showdownFx", "Étincelle", "epic", 2400, "Effets de showdown", "Un éclat bref sur vos cartes au showdown.", { kind: "spark", color: "#FFD28A" }),
];
export const DEFAULTS: Record<Slot, string> = {
  table: "table-obsidian",
  cardBack: "back-stackora",
  cardFace: "face-quattro",
  chips: "chips-classic",
  avatar: "avatar-spade",
  frame: "frame-none",
  badge: "badge-none",
  winFx: "win-classic",
  showdownFx: "show-none",
};
export const item = (id: string) => CATALOG.find((x) => x.id === id);

/** Packs de StackCoins. Les prix sont des indications d'affichage : le prix réel
 * est celui de l'App Store pour le productId. Configurable via STACKORA_PACKS (JSON). */
/** `priceCents`/`currency` : prix facturé sur le web (Stripe). Sur iOS, le prix réel est celui de l'App Store. */
export interface Pack { productId: string; name: string; coins: number; displayPrice: string; priceCents: number; currency: string }
export function packs(): Pack[] {
  if (process.env.STACKORA_PACKS) return JSON.parse(process.env.STACKORA_PACKS);
  return [
    { productId: "com.stackora.coins.500", name: "Découverte", coins: 500, displayPrice: "0,99 €", priceCents: 99, currency: "eur" },
    { productId: "com.stackora.coins.1500", name: "Standard", coins: 1500, displayPrice: "2,99 €", priceCents: 299, currency: "eur" },
    { productId: "com.stackora.coins.3500", name: "Premium", coins: 3500, displayPrice: "5,99 €", priceCents: 599, currency: "eur" },
    { productId: "com.stackora.coins.8000", name: "Elite", coins: 8000, displayPrice: "11,99 €", priceCents: 1199, currency: "eur" },
    { productId: "com.stackora.coins.20000", name: "Ultimate", coins: 20000, displayPrice: "24,99 €", priceCents: 2499, currency: "eur" },
  ];
}

/** Récompenses configurables côté serveur (STACKORA_REWARDS, JSON partiel). */
export interface RewardConfig {
  welcome: number;
  participation: { coins: number; xp: number };
  finishTop3: { coins: number; xp: number };
  win: { coins: number; xp: number };
  /** Rangs et victoire ne paient que si la table comptait au moins ce nombre d'humains. */
  minHumansForRank: number;
  /** Durée minimale d'un tournoi récompensé (anti-farming de tournois éclairs). */
  minTournamentSeconds: number;
  maxRewardedTournamentsPerDay: number;
  training: { coins: number; xp: number; minQuestions: number; maxPerDay: number };
  dailyCoinCap: number;
  missions: { id: string; period: "daily" | "weekly"; label: string; metric: "tournaments" | "training" | "top3"; target: number; coins: number; xp: number }[];
}
export function rewardConfig(): RewardConfig {
  const base: RewardConfig = {
    welcome: 500,
    participation: { coins: 20, xp: 40 },
    finishTop3: { coins: 60, xp: 60 },
    win: { coins: 150, xp: 150 },
    minHumansForRank: 2,
    minTournamentSeconds: 300,
    maxRewardedTournamentsPerDay: 6,
    training: { coins: 15, xp: 30, minQuestions: 10, maxPerDay: 4 },
    dailyCoinCap: 600,
    missions: [
      { id: "d-play", period: "daily", label: "Terminer un tournoi", metric: "tournaments", target: 1, coins: 40, xp: 40 },
      { id: "d-train", period: "daily", label: "Terminer une session d'exercices", metric: "training", target: 1, coins: 30, xp: 30 },
      { id: "w-play", period: "weekly", label: "Terminer 5 tournois", metric: "tournaments", target: 5, coins: 200, xp: 200 },
      { id: "w-top3", period: "weekly", label: "Finir 3 fois dans le top 3", metric: "top3", target: 3, coins: 250, xp: 250 },
      { id: "w-train", period: "weekly", label: "Terminer 5 sessions d'exercices", metric: "training", target: 5, coins: 150, xp: 150 },
    ],
  };
  return process.env.STACKORA_REWARDS ? { ...base, ...JSON.parse(process.env.STACKORA_REWARDS) } : base;
}
/** Niveau = indicateur d'engagement uniquement. */
export function levelFor(xp: number) {
  let level = 1;
  while (xp >= xpFor(level + 1)) level++;
  return { level, xp, current: xpFor(level), next: xpFor(level + 1) };
}
export const xpFor = (level: number) => Math.round(120 * (level - 1) ** 1.6);
