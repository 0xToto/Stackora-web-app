import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExactEquity, verifyRank } from '../src/equity.js';
import { shuffled } from '../src/cards.js';

test('rank evaluator agrees with canonical evaluator on 5, 6 and 7 cards', () => {
  for (let i = 0; i < 2000; i++) assert.equal(verifyRank(shuffled().slice(0, 5 + i % 3)), true);
});
test('JJ vs KK preflop: full enumeration, not the rule of 2', () => {
  const e = calculateExactEquity([{id:'JJ',cards:['Js','Jh']},{id:'KK',cards:['Ks','Kh']}], []);
  assert.deepEqual(e.odds.map(x=>x.percent), [17.78, 82.22]);
});
test('turn: exact two winning jacks among 44 unseen cards', () => {
  const e = calculateExactEquity([{id:'JJ',cards:['Js','Jh']},{id:'KK',cards:['Ks','Kh']}], ['2c','3d','8h','9s']);
  assert.deepEqual(e.odds.map(x=>x.percent), [4.55,95.45]);
  assert.deepEqual(e.odds[0].outs, ['Jd','Jc']);
});
test('flop: draws to trips evaluated against full turn-river combinations', () => {
  const e = calculateExactEquity([{id:'JJ',cards:['Js','Jh']},{id:'KK',cards:['Ks','Kh']}], ['2c','3d','8h']);
  assert.deepEqual(e.odds.map(x=>x.percent), [8.38,91.62]);
  assert.deepEqual(e.odds[0].outs, ['Jd','Jc']);
});
test('board royal flush splits equity exactly between two players', () => {
  const e = calculateExactEquity([{id:'A',cards:['2c','3d']},{id:'B',cards:['4c','5d']}], ['As','Ks','Qs','Js','Ts']);
  assert.deepEqual(e.odds.map(x=>x.percent), [50,50]);
});
test('multiway equity sums to 100% including split pots', () => {
  const e = calculateExactEquity([
    {id:'A',cards:['As','Ah']}, {id:'B',cards:['Ks','Kh']}, {id:'C',cards:['Qs','Qh']},
  ],['2c','3d','8h']);
  assert.ok(Math.abs(e.odds.reduce((s,o)=>s+o.percent,0)-100)<0.02);
});
test('flush completes on river and updates exact winner to 100%', () => {
  const seats=[{id:'A',cards:['Ah','Kh']},{id:'B',cards:['Qs','Qd']}];
  const before=calculateExactEquity(seats,['2h','7h','Jc','8s']);
  assert.ok(before.odds[0].percent>0 && before.odds[0].percent<100);
  assert.ok(before.odds[0].outs.includes('3h'));
  const after=calculateExactEquity(seats,['2h','7h','Jc','8s','3h']);
  assert.equal(after.odds[0].percent, 100);
});
