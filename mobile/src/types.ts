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
};
export type Summary = Pick<
  Game,
  "id" | "name" | "code" | "status" | "variant"
> & { count: number };
