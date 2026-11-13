import { test } from 'node:test';
import assert from 'node:assert/strict';
import { act, startHand, publicHand, schedulePresentation, assertConservation, type Hand } from '../src/engine.js';
import { shuffled } from '../src/cards.js';
import { createTournament, view, tick } from '../src/tournament.js';
const players = (n = 2) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, stack: 100, seat: i, bot: false }));
function rig(holes: string[][], board = ['3s','4h','5d','9c','Jh']) {
  const rest = shuffled().filter(c => ![...holes.flat(), ...board].includes(c));
  return [...holes.map(c => c[0]), ...holes.map(c => c[1]), rest.shift()!, ...board.slice(0,3), rest.shift()!, board[3], rest.shift()!, board[4], ...rest];
}
function allin(stage: number, multi = false) {
  const ps = players(multi ? 3 : 2); if(multi) ps[0].stack = 60;
  const h = startHand(ps, 0, 10, 1, 'classic', 0, rig(multi ? [['As','Ah'],['Ks','Kh'],['Qs','Qh']] : [['As','Ah'],['Ks','Kh']]));
  while (h.board.length < stage) act(h, h.turn!, { type: h.players.find(p=>p.id===h.turn)!.bet < h.currentBet ? 'call' : 'check' });
  while(h.stage !== 'done') {
    const p = h.players.find(p => p.id === h.turn)!;
    act(h, p.id, h.currentBet < p.bet + p.stack && h.players.filter(p=>!p.folded && p.stack>0).length > 1 ? { type: 'raise', amount: p.bet+p.stack } : { type:'call' });
  }
  schedulePresentation(h, 10000); return h;
}
let pre: Hand;
test('preflop runout: 2 seconds per card, five-second river, no future results or equity leak', () => {
  pre = allin(0);
  assert.deepEqual(pre.presentation!.revealAt, [12000,14000,16000,18000,23000]);
  for(const [now,count] of [[10000,0],[11999,0],[12000,1],[14000,2],[16000,3],[18000,4],[22999,4],[23000,5]]) {
    const v = publicHand(pre,'p0',now);
    assert.equal(v.board.length,count);
    assert.ok(v.allIn!.streets!.every(s=>s.boardCount<=count));
    assert.deepEqual(v.players[1].cards,['Ks','Kh']);
    if(now<23000){assert.deepEqual(v.pots,[]);assert.deepEqual(v.bonus,[]);assert.equal(v.stage,'runout');assert.equal(v.players[0].stack,0);}
    else assert.equal(v.stage,'done');
    assert.equal('deck' in v,false);
    assert.equal('stacks' in v.presentation!,false);
  }
});
test('flop and turn all-ins only animate remaining cards',()=>{
  const flop=allin(3), turn=allin(4);
  assert.deepEqual(flop.presentation!.revealAt,[10000,10000,10000,12000,17000]);
  assert.deepEqual(turn.presentation!.revealAt,[10000,10000,10000,10000,15000]);
});
test('three players and side pots conserve chips throughout presentation',()=>{
  const h=allin(4,true); assert.equal(h.pots.length,2); assertConservation(h);
  assert.equal(publicHand(h,'p0',14999).pots.length,0);
  assert.equal(publicHand(h,'p1',15000).pots.length,2);
});
test('two clients and reconnect get the same clock and board; no client needed for expiry',()=>{
  const h=allin(4); const t=createTournament('p0','Test'); t.status='playing';t.players=players();t.tables=[{id:'table',players:['p0','p1'],button:0,hand:h,ghostPot:0,deadline:0}];
  const a=view(t,'p0',14000), b=view(JSON.parse(JSON.stringify(t)),'p1',14000);
  assert.deepEqual(a.tables[0].hand!.presentation,b.tables[0].hand!.presentation);
  assert.deepEqual(a.tables[0].hand!.board,b.tables[0].hand!.board);
  tick(t,15000); assert.equal(view(t,'p0',15000).tables[0].hand!.board.length,5);
  assert.equal(t.roundReadyAt,23500);
});
test('7/2 reveal on fold is independent of bounty qualification; only winner is public',()=>{
  const h=startHand(players(),0,10,2,'sevenTwo',0,rig([['As','Ah'],['7s','2c']]));
  act(h,'p0',{type:'fold'});
  assert.equal(h.bonus.length,0); // preserve existing rule: no aggressive action, no bounty
  assert.deepEqual(publicHand(h,'p0').players[1].cards,['7s','2c']);
  assert.deepEqual(publicHand(h,'p1').players[0].cards,[]);
});
test('7/2 aggression earns unchanged bounty and synchronized revelation',()=>{
  const h=startHand(players(),0,10,2,'sevenTwo',0,rig([['7s','2c'],['As','Ah']]));
  act(h,'p0',{type:'raise',amount:30});act(h,'p1',{type:'fold'});
  assert.equal(h.bonus.reduce((n,b)=>n+b.amount,0),10);
  for(const id of ['p0','p1'])assert.deepEqual(publicHand(h,id).players[0].cards,['7s','2c']);
  assertConservation(h);
});
test('ordinary fold winner and losing 7/2 stay private',()=>{
  for(const holes of [[['As','Ah'],['Ks','Kh']],[['As','Ah'],['7s','2c']]]){
    const h=startHand(players(),0,10,2,'sevenTwo',0,rig(holes));act(h,'p0',{type:'raise',amount:30});act(h,'p1',{type:'fold'});
    assert.deepEqual(publicHand(h,'p1').players[0].cards,[]);assert.deepEqual(publicHand(h,'p0').players[1].cards,[]);
  }
});
