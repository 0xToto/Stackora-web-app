import { evaluate, type Card } from "./cards.js";

export interface EquitySeat { id: string; cards: Card[] }
export interface EquityResult { id: string; percent: number; outs: Card[] }
export interface EquitySnapshot { boardCount: number; odds: EquityResult[] }

const RANKS = "23456789TJQKA";
const SUITS = "shdc";
const ALL_CARDS = [...RANKS].flatMap(r => [...SUITS].map(s => r+s));
const rank = (c: Card) => RANKS.indexOf(c[0]) + 2;
const suit = (c: Card) => SUITS.indexOf(c[1]);
const straightHigh = (mask: number): number => {
  if (mask & (1 << 14)) mask |= 1 << 1;
  for (let high=14;high>=5;high--) if ((mask & (31 << (high-4))) === (31 << (high-4))) return high;
  return 0;
};
/** 7-card Hold'em rank, bit-exact ordering with the original 5-card evaluator. */
export function fastRank(cards: Card[]): number {
  const counts = new Int8Array(15);
  const suitCounts = new Int8Array(4);
  const suitMask = new Int32Array(4);
  let mask = 0;
  for (const c of cards) {
    const r=rank(c),s=suit(c);
    counts[r]++; suitCounts[s]++; suitMask[s] |= 1 << r; mask |= 1 << r;
  }
  const code=(type:number, a=0,b=0,c=0,d=0,e=0) => (((((type*15+a)*15+b)*15+c)*15+d)*15+e);
  for(let s=0;s<4;s++) if(suitCounts[s]>=5){
    const sf=straightHigh(suitMask[s]);
    if(sf) return code(8,sf);
  }
  for(let r=14;r>=2;r--) if(counts[r]===4){
    for(let k=14;k>=2;k--) if(k!==r && counts[k]) return code(7,r,k);
  }
  let trip=0, pair=0;
  for(let r=14;r>=2;r--) if(counts[r]>=3 && !trip) trip=r;
  if(trip){
    for(let r=14;r>=2;r--) if(r!==trip && counts[r]>=2){pair=r;break;}
    if(pair) return code(6,trip,pair);
  }
  for(let s=0;s<4;s++) if(suitCounts[s]>=5){
    const values=[];
    for(let r=14;r>=2 && values.length<5;r--) if(suitMask[s] & (1 << r))values.push(r);
    return code(5,values[0],values[1],values[2],values[3],values[4]);
  }
  const straight=straightHigh(mask);
  if(straight) return code(4,straight);
  if(trip){
    const ks=[];
    for(let r=14;r>=2 && ks.length<2;r--) if(r!==trip && counts[r]) ks.push(r);
    return code(3,trip,ks[0],ks[1]);
  }
  const pairs=[];
  for(let r=14;r>=2;r--) if(counts[r]>=2) pairs.push(r);
  if(pairs.length>=2){
    for(let r=14;r>=2;r--) if(r!==pairs[0] && r!==pairs[1] && counts[r]) return code(2,pairs[0],pairs[1],r);
  }
  if(pairs.length){
    const ks=[];
    for(let r=14;r>=2 && ks.length<3;r--) if(r!==pairs[0] && counts[r]) ks.push(r);
    return code(1,pairs[0],ks[0],ks[1],ks[2]);
  }
  const ks=[];
  for(let r=14;r>=2 && ks.length<5;r--) if(counts[r])ks.push(r);
  return code(0,ks[0],ks[1],ks[2],ks[3],ks[4]);
}

/** Exhaustively enumerate all remaining unordered boards, never sample. Ties split equity.
 * Exact for every street; the list of direct river outs is calculated separately. */
export function calculateExactEquity(players: EquitySeat[], board: Card[], blocked: Card[] = []): EquitySnapshot {
  if (players.length < 2 || board.length > 5) throw new Error("Invalid equity input");
  const known = [...players.flatMap(p=>p.cards), ...board, ...blocked];
  if(new Set(known).size !== known.length) throw new Error("Duplicated known cards");
  const available=ALL_CARDS.filter(c=>!known.includes(c));
  const need=5-board.length;
  const scores=new Float64Array(players.length);
  const outs = players.map(()=>[] as Card[]);
  const firstCardShares = board.length === 3 ? players.map(()=>new Float64Array(available.length)) : null;
  let trials=0;
  const evaluateBoard = (extra: Card[]) => {
    const full=[...board,...extra];
    let best=-1, winners=0;
    const ranks=players.map(p=>fastRank([...p.cards,...full]));
    for (let i=0;i<ranks.length;i++) {
      if(ranks[i]>best){best=ranks[i];winners=1;}
      else if(ranks[i]===best) winners++;
    }
    for(let i=0;i<ranks.length;i++) if(ranks[i]===best) {
      const share = 1/winners;
      scores[i] += share;
      if (firstCardShares && extra.length===2) {
        firstCardShares[i][available.indexOf(extra[0])] += share;
        firstCardShares[i][available.indexOf(extra[1])] += share;
      }
    }
    trials++;
  };
  const extra:Card[]=[];
  const walk=(start:number,remaining:number) => {
    if(remaining===0){evaluateBoard(extra);return;}
    for(let i=start;i<=available.length-remaining;i++){
      extra.push(available[i]);walk(i+1,remaining-1);extra.pop();
    }
  };
  walk(0,need);
  // On the flop, each candidate turn has equal probability; derive its conditional
  // winning equity from all possible subsequent rivers (no random sampling).
  if (firstCardShares) {
    const perTurn = available.length - 1;
    for (let i=0;i<players.length;i++) {
      const baseline = scores[i]/trials;
      for(let j=0;j<available.length;j++) {
        if (firstCardShares[i][j]/perTurn > baseline + 1e-10) outs[i].push(available[j]);
      }
    }
  }
  // Exact immediate river outcomes: a river is an out if it strictly increases
  // this player's chance of collecting a nonzero share relative to the current made hand.
  if(board.length===4){
    const current=players.map(p=>fastRank([...p.cards,...board])); // 6 cards valid
    const currentBest=Math.max(...current);
    for(const card of available){
      const rs=players.map(p=>fastRank([...p.cards,...board,card]));
      const best=Math.max(...rs);
      for(let i=0;i<players.length;i++) if(current[i]<currentBest && rs[i]===best) outs[i].push(card);
    }
  }
  return {boardCount:board.length,odds:players.map((p,i)=>({id:p.id,percent:Math.round(10000*scores[i]/trials)/100,outs:outs[i]}))};
}

/** Cross-check the optimized evaluator on all 5/6/7-card forms against the canonical evaluator. */
export function verifyRank(cards: Card[]): boolean {
  const score=fastRank(cards);
  const canonical=evaluate(cards);
  let coded=0;
  for(const n of [...canonical,...Array(6-canonical.length).fill(0)]) coded=coded*15+n;
  return score===coded;
}
