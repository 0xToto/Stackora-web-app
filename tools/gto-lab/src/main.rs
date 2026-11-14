mod postflop;
mod preflop;
use std::fs;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("equity") => {
            let samples: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(20000);
            let cl = preflop::classes();
            let t = std::time::Instant::now();
            let (eq, w) = preflop::equity(&cl, samples);
            eprintln!("équités calculées en {:?}", t.elapsed());
            fs::write("equity.json", serde_json::to_string(&serde_json::json!({ "names": cl.names, "samples": samples, "eq": eq, "w": w })).unwrap()).unwrap();
        }
        Some("nash") => {
            let v: serde_json::Value = serde_json::from_str(&fs::read_to_string("equity.json").unwrap()).unwrap();
            let names: Vec<String> = serde_json::from_value(v["names"].clone()).unwrap();
            let eq: Vec<Vec<f64>> = serde_json::from_value(v["eq"].clone()).unwrap();
            let w: Vec<Vec<f64>> = serde_json::from_value(v["w"].clone()).unwrap();
            let iters: usize = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(600);
            let grid: Vec<f64> = (4..=100).map(|k| k as f64 * 0.25).collect(); // 1 à 25 BB
            let mut out = vec![];
            for &s in &grid {
                let (p, c, expl) = preflop::nash(&eq, &w, s, iters);
                out.push(serde_json::json!({ "stack": s, "push": p, "call": c, "exploitability_bb": expl }));
            }
            fs::write("nash.json", serde_json::to_string(&serde_json::json!({ "names": names, "iterations": iters, "grid": out })).unwrap()).unwrap();
            eprintln!("nash.json écrit");
        }
        Some("spots") => postflop::run(&args[2], &args[3]),
        _ => eprintln!("usage: gto-lab equity [samples] | nash [iters] | spots in.json out.json"),
    }
}
