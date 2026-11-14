//! Résolution de spots postflop tête-à-tête avec native-solver (MIT/Apache-2.0).
use native_solver::{build_tree, Action, Card, CardAbstraction, CardSet, Chips, GameConfig, Node, Player, Range, Trainer, TrainerOptions};
use serde::Deserialize;
use std::fs;

#[derive(Deserialize)]
struct Spot {
    id: String,
    board: Vec<String>,
    pot: f64,
    stack: f64,
    sizes: Vec<f64>,
    #[serde(default = "one")]
    max_raises: u32,
    oop: String,
    ip: String,
    path: Vec<String>,
    hero: String,
    iterations: u32,
    #[serde(default)]
    buckets: Option<usize>,
}
fn one() -> u32 {
    1
}

fn label(a: &Action) -> (String, Option<f64>) {
    match a {
        Action::Check => ("check".into(), None),
        Action::Call => ("call".into(), None),
        Action::Fold => ("fold".into(), None),
        Action::Bet(c) => ("bet".into(), Some(c.to_f64())),
        Action::Raise(c) => ("raise".into(), Some(c.to_f64())),
    }
}

/// Suit le chemin d'actions depuis la racine ; retourne l'id du nœud atteint.
fn walk<'a>(mut node: &'a Node, path: &[String]) -> &'a Node {
    for step in path {
        let Node::Decision { actions, children, .. } = node else { panic!("chemin invalide : {step}") };
        let (kind, idx) = step.split_once(':').map(|(k, i)| (k, i.parse::<usize>().unwrap())).unwrap_or((step.as_str(), 0));
        let pos = actions
            .iter()
            .enumerate()
            .filter(|(_, a)| label(a).0 == kind)
            .nth(idx)
            .unwrap_or_else(|| panic!("action {step} introuvable parmi {actions:?}"))
            .0;
        node = &children[pos];
    }
    node
}

pub fn run(input: &str, output: &str) {
    let spots: Vec<Spot> = serde_json::from_str(&fs::read_to_string(input).unwrap()).unwrap();
    let mut results = vec![];
    for s in spots {
        let t = std::time::Instant::now();
        let board: Vec<Card> = s.board.iter().map(|c| c.parse().unwrap()).collect();
        let cfg = GameConfig::new(board.clone(), Chips::from_f64(s.pot).unwrap(), Chips::from_f64(s.stack).unwrap())
            .with_bet_sizes(s.sizes.clone())
            .with_max_raises(s.max_raises)
            .with_suit_isomorphism(true);
        let dead = CardSet::from_cards(&board);
        let oop = s.oop.parse::<Range>().unwrap().combos(dead);
        let ip = s.ip.parse::<Range>().unwrap().combos(dead);
        let tree = build_tree(&cfg).unwrap();
        let mut opts = TrainerOptions::default();
        if let Some(b) = s.buckets {
            opts.abstraction = CardAbstraction { flop: Some(b), turn: Some(b), river: Some(b) };
        }
        let mut trainer = Trainer::new(tree, [oop, ip], opts).unwrap();
        trainer.train(s.iterations);
        let expl = trainer.exploitability();
        let game = trainer.game().clone();
        let node = walk(game.tree(), &s.path);
        let Node::Decision { id, player, actions, .. } = node else { panic!("{} : le chemin ne mène pas à une décision", s.id) };
        let strategy = trainer.average_strategy(*id);
        let combos = game.combos(*player);
        let hero_cards: Vec<Card> = vec![s.hero[0..2].parse().unwrap(), s.hero[2..4].parse().unwrap()];
        let hi = combos
            .iter()
            .position(|c| (c.cards[0] == hero_cards[0] && c.cards[1] == hero_cards[1]) || (c.cards[0] == hero_cards[1] && c.cards[1] == hero_cards[0]))
            .unwrap_or_else(|| panic!("{} : main du héros absente de la range", s.id));
        // Fréquences de la range entière à ce nœud (pondérées par le poids des combos).
        let total_w: f64 = combos.iter().map(|c| c.weight).sum();
        let range_freq: Vec<f64> = strategy.iter().map(|row| row.iter().zip(combos).map(|(f, c)| f * c.weight).sum::<f64>() / total_w).collect();
        let eval = trainer.evaluate();
        let ev = eval.nodes[*id].ev[hi];
        let acts: Vec<_> = actions.iter().map(label).collect();
        eprintln!(
            "{:<28} {:>6.1?}  expl {:.3} ({:.2}% pot)  héros {:?}",
            s.id,
            t.elapsed(),
            expl.total,
            100.0 * expl.total / s.pot,
            acts.iter().zip(&strategy).map(|((k, a), row)| format!("{k}{} {:.0}%", a.map(|x| format!(" {x:.1}")).unwrap_or_default(), row[hi] * 100.0)).collect::<Vec<_>>()
        );
        results.push(serde_json::json!({
            "id": s.id,
            "player": if *player == Player::Oop { "oop" } else { "ip" },
            "actions": acts.iter().map(|(k, a)| serde_json::json!({ "kind": k, "amount": a })).collect::<Vec<_>>(),
            "hero": s.hero,
            "hero_freq": strategy.iter().map(|row| row[hi]).collect::<Vec<_>>(),
            "range_freq": range_freq,
            "hero_ev": ev,
            "exploitability": expl.total,
            "exploitability_pct_pot": 100.0 * expl.total / s.pot,
            "iterations": s.iterations,
            "pot": s.pot, "stack": s.stack, "sizes": s.sizes, "max_raises": s.max_raises,
            "oop_range": s.oop, "ip_range": s.ip, "board": s.board, "path": s.path,
            "buckets": s.buckets,
            "seconds": t.elapsed().as_secs_f64(),
        }));
    }
    fs::write(output, serde_json::to_string_pretty(&results).unwrap()).unwrap();
}
