//! Heads-up push/fold (SB pousse ou passe, BB suit ou passe), sans ante.
//! 1) Équités classe contre classe par Monte-Carlo (évaluateur native-solver).
//! 2) Équilibre de Nash par fictitious play, avec retrait des cartes
//!    (poids = nombre de paires de combos compatibles).
use native_solver::{all_canonical_hands, evaluate_7, Card, CardSet, Range};
use rand::{rngs::SmallRng, Rng, SeedableRng};
use rayon::prelude::*;

pub struct Classes {
    pub names: Vec<String>,
    pub combos: Vec<Vec<[Card; 2]>>,
}
pub fn classes() -> Classes {
    let names = all_canonical_hands();
    let combos = names
        .iter()
        .map(|n| n.parse::<Range>().unwrap().combos(CardSet::default()).into_iter().map(|c| c.cards).collect())
        .collect();
    Classes { names, combos }
}
fn bits(c: &[Card; 2]) -> u64 {
    (1u64 << c[0].index()) | (1u64 << c[1].index())
}

/// eq[i][j] = équité de i contre j ; w[i][j] = paires de combos compatibles.
pub fn equity(cl: &Classes, samples: usize) -> (Vec<Vec<f64>>, Vec<Vec<f64>>) {
    let n = cl.names.len();
    let all: Vec<Card> = Card::all().collect();
    let pairs: Vec<(usize, usize)> = (0..n).flat_map(|i| (i..n).map(move |j| (i, j))).collect();
    let res: Vec<(usize, usize, f64, f64)> = pairs
        .par_iter()
        .map(|&(i, j)| {
            let mut compat = vec![];
            for a in &cl.combos[i] {
                for b in &cl.combos[j] {
                    if bits(a) & bits(b) == 0 {
                        compat.push((*a, *b));
                    }
                }
            }
            let w = compat.len() as f64;
            if compat.is_empty() {
                return (i, j, 0.5, 0.0);
            }
            let mut rng = SmallRng::seed_from_u64((i * 1000 + j) as u64);
            let mut score = 0.0;
            for _ in 0..samples {
                let (a, b) = compat[rng.gen_range(0..compat.len())];
                let dead = bits(&a) | bits(&b);
                let mut board = [all[0]; 5];
                let mut used = dead;
                let mut k = 0;
                while k < 5 {
                    let c = all[rng.gen_range(0..52)];
                    let bit = 1u64 << c.index();
                    if used & bit == 0 {
                        used |= bit;
                        board[k] = c;
                        k += 1;
                    }
                }
                let h = |x: [Card; 2]| evaluate_7([x[0], x[1], board[0], board[1], board[2], board[3], board[4]]);
                let (sa, sb) = (h(a), h(b));
                score += if sa > sb { 1.0 } else if sa == sb { 0.5 } else { 0.0 };
            }
            (i, j, score / samples as f64, w)
        })
        .collect();
    let mut eq = vec![vec![0.5; n]; n];
    let mut w = vec![vec![0.0; n]; n];
    for (i, j, e, ww) in res {
        eq[i][j] = e;
        eq[j][i] = 1.0 - e;
        w[i][j] = ww;
        w[j][i] = ww;
    }
    (eq, w)
}

/// Nash push/fold pour une profondeur effective `s` (en BB, avant blindes).
/// Retourne (fréquences de push SB, fréquences de call BB, exploitabilité en BB).
pub fn nash(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, iters: usize) -> (Vec<f64>, Vec<f64>, f64) {
    let n = eq.len();
    let mut push_avg = vec![0.5; n];
    let mut call_avg = vec![0.5; n];
    for t in 1..=iters {
        let br_push = best_push(eq, w, s, &call_avg);
        let br_call = best_call(eq, w, s, &push_avg);
        let k = 1.0 / (t as f64 + 1.0);
        for i in 0..n {
            push_avg[i] += k * (br_push[i] - push_avg[i]);
            call_avg[i] += k * (br_call[i] - call_avg[i]);
        }
    }
    // Exploitabilité : gain moyen d'une meilleure réponse pour chaque joueur.
    let ev_sb = |p: &[f64]| ev_sb(eq, w, s, p, &call_avg);
    let gap_sb = ev_sb(&best_push(eq, w, s, &call_avg)) - ev_sb(&push_avg);
    let gap_bb = ev_bb(eq, w, s, &push_avg, &best_call(eq, w, s, &push_avg)) - ev_bb(eq, w, s, &push_avg, &call_avg);
    (push_avg, call_avg, (gap_sb + gap_bb) / 2.0)
}
fn push_value(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, call: &[f64], i: usize) -> f64 {
    let (mut v, mut tot) = (0.0, 0.0);
    for j in 0..eq.len() {
        let ww = w[i][j];
        v += ww * ((1.0 - call[j]) * 1.0 + call[j] * (eq[i][j] * 2.0 * s - s));
        tot += ww;
    }
    v / tot
}
fn best_push(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, call: &[f64]) -> Vec<f64> {
    (0..eq.len()).map(|i| if push_value(eq, w, s, call, i) > -0.5 { 1.0 } else { 0.0 }).collect()
}
fn call_value(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, push: &[f64], j: usize) -> Option<f64> {
    let (mut v, mut tot) = (0.0, 0.0);
    for i in 0..eq.len() {
        let ww = w[i][j] * push[i];
        v += ww * (eq[j][i] * 2.0 * s - s);
        tot += ww;
    }
    if tot > 0.0 { Some(v / tot) } else { None }
}
fn best_call(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, push: &[f64]) -> Vec<f64> {
    (0..eq.len()).map(|j| match call_value(eq, w, s, push, j) { Some(v) if v > -1.0 => 1.0, _ => 0.0 }).collect()
}
fn class_weight(w: &[Vec<f64>], i: usize) -> f64 {
    w[i].iter().sum()
}
fn ev_sb(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, push: &[f64], call: &[f64]) -> f64 {
    let (mut v, mut tot) = (0.0, 0.0);
    for i in 0..eq.len() {
        let cw = class_weight(w, i);
        v += cw * (push[i] * push_value(eq, w, s, call, i) + (1.0 - push[i]) * -0.5);
        tot += cw;
    }
    v / tot
}
fn ev_bb(eq: &[Vec<f64>], w: &[Vec<f64>], s: f64, push: &[f64], call: &[f64]) -> f64 {
    // Valeur BB moyenne sur toutes les donnes (SB passe : BB gagne 0,5).
    let (mut v, mut tot) = (0.0, 0.0);
    for i in 0..eq.len() {
        for j in 0..eq.len() {
            let ww = w[i][j];
            tot += ww;
            let pushed = push[i];
            let showdown = eq[j][i] * 2.0 * s - s;
            v += ww * ((1.0 - pushed) * 0.5 + pushed * (call[j] * showdown + (1.0 - call[j]) * -1.0));
        }
    }
    v / tot
}
