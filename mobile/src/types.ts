export type Variant = "classic" | "sevenTwo" | "ghost" | "redRiver";
export type User = { id: string; name: string; email: string };
export type Player = {
  id: string;
  name: string;
  stack: number;
  seat: number;
  bot: boolean;
  cards?: string[];
  bet?: number;
  total?: number;
  folded?: boolean;
  lastAction?: string;
};
export type Hand = {
  id: number;
  revealed?: string[];
  presentation?: { startedAt: number; endsAt: number; nextAt: number | null; count: number; river: boolean } | null;
  players: Player[];
  board: string[];
  ghostCards: string[];
  ghostPot: number;
  allIn?: { boardAtCall: string[]; odds: { id: string; percent: number; outs: string[] }[]; streets?: { boardCount: number; odds: { id: string; percent: number; outs: string[] }[] }[] } | null;
  bb: number;
  sb: number;
  button: number;
  stage: string;
  turn: string | null;
  pots: { amount: number; winners: string[]; ghost: boolean }[];
  log: string[];
  bonus: { from: string; to: string; amount: number }[];
  legal: {
    call: number;
    canCheck: boolean;
    canRaise: boolean;
    minTo: number;
    maxTo: number;
  } | null;
};
export type Game = {
  serverNow?: number;
  id: string;
  code: string;
  owner: string;
  name: string;
  status: string;
  variant: Variant;
  maxPlayers: number;
  startingStack: number;
  initialBB: number;
  levelSeconds: number;
  decisionSeconds: number;
  startedAt: number;
  version: number;
  players: Player[];
  tables: {
    id: string;
    players: string[];
    button: number;
    deadline: number;
    hand: Hand | null;
  }[];
  results: { id: string; name: string; rank: number }[];
  events: { at: number; text: string }[];
  /** Cosmétiques publics équipés, fournis par le serveur (jamais par un client). */
  cosmetics?: Record<string, PublicLook>;
};
export type Slot = "table" | "cardBack" | "cardFace" | "chips" | "avatar" | "frame" | "badge" | "winFx" | "showdownFx";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type PublicLook = { avatar: string; frame: string; badge: string; cardBack: string; winFx: string; showdownFx: string; level: number };
export type Item = {
  id: string;
  slot: Slot;
  name: string;
  description: string;
  rarity: Rarity;
  price: number;
  visibility: "public" | "local";
  collection: string;
  free?: boolean;
  look: Record<string, string | number | boolean>;
};
export type Pack = { productId: string; name: string; coins: number; displayPrice: string; priceCents: number; currency: string };
export type Catalog = { items: Item[]; packs: Pack[]; iapEnabled: boolean; webPayments?: { enabled: boolean; test: boolean }; balance: number; owned: string[]; equipped: Record<Slot, string> };
export type Progress = { level: number; xp: number; current: number; next: number };
export type Profile = {
  user: User;
  wallet: { balance: number };
  progress: Progress;
  equipped: Record<Slot, string>;
  owned: string[];
  stats: { played: number; wins: number; top3: number; bestRank: number | null; active: number };
  history: { id: string; name: string; variant: Variant; rank: number; players: number; at: number }[];
  training: { module: string; category: string; sessions: number; correct: number; total: number }[];
};
export type Mission = { id: string; period: "daily" | "weekly"; label: string; target: number; progress: number; coins: number; xp: number; claimed: boolean; resetsAt: number };
export type Summary = Pick<
  Game,
  "id" | "name" | "code" | "status" | "variant"
> & { count: number };
