"""Construit mobile/src/data/gto-solved.ts à partir des résultats calculés (gto-lab)."""
import json, sys, os
lab, out = sys.argv[1], sys.argv[2]
nash = json.load(open(os.path.join(lab, "nash.json")))
names = nash["names"]
grid = {p["stack"]: p for p in nash["grid"]}
results = {}
for f in ("result-fast.json", "result-flop.json"):
    p = os.path.join(lab, f)
    if os.path.exists(p):
        for r in json.load(open(p)):
            results[r["id"]] = r
specs = {s["id"]: s for f in ("spots-fast.json", "spots-flop.run.json") if os.path.exists(os.path.join(lab, f)) for s in json.load(open(os.path.join(lab, f)))}

def grade(freq):
    m = max(freq)
    best = [i for i, f in enumerate(freq) if f >= 0.40 or f == m]
    ok = [i for i, f in enumerate(freq) if 0.15 <= f < 0.40 and i not in best]
    return best, ok
def pct(x): return round(x * 100, 1)
def fr(n): return f"{n:.1f}".replace(".0", "").replace(".", ",")

# ───────── Préflop : push/fold Nash HU ─────────
PF = [
    ("nash-sb-a8o-10", "SB", "As8c", 10, "push", "Tapis en SB à 10 BB", 3),
    ("nash-sb-k5o-8", "SB", "Kd5c", 8, "push", "Roi faible à 8 BB", 1),
    ("nash-sb-97o-12", "SB", "9h7c", 12, "push", "Connecteurs dépareillés à 12 BB", 2),
    ("nash-sb-t7o-15", "SB", "Ts7d", 15, "push", "Trop profond pour pousser ?", 2),
    ("nash-sb-22-15", "SB", "2c2d", 15, "push", "Petite paire à 15 BB", 1),
    ("nash-sb-j5s-13", "SB", "Jh5h", 13, "push", "Valet assorti à 13 BB", 3),
    ("nash-bb-q6o-10", "BB", "Qc6d", 10, "call", "Payer un tapis avec Q6", 2),
    ("nash-bb-k2o-8", "BB", "Kh2s", 8, "call", "Défendre la BB à 8 BB", 2),
    ("nash-bb-a2o-15", "BB", "Ad2h", 15, "call", "As faible contre un tapis de 15 BB", 3),
]
def threshold(hand, kind):
    i = names.index(hand); best = None
    for s in sorted(grid):
        if grid[s][kind][i] > 0.5: best = s
    return best
def canon(cards):
    R = "23456789TJQKA"
    a, b = cards[:2], cards[2:]
    hi, lo = (a, b) if R.index(a[0]) >= R.index(b[0]) else (b, a)
    if hi[0] == lo[0]: return hi[0] * 2
    return hi[0] + lo[0] + ("s" if hi[1] == lo[1] else "o")

scenarios = []
for sid, pos, cards, stack, kind, title, diff in PF:
    hand = canon(cards)
    f = grid[stack][kind][names.index(hand)]
    t = threshold(hand, kind)
    pushpct = sum(grid[stack]["push"][i] * w for i, w in enumerate([sum(r) for r in json.load(open(os.path.join(lab, "equity.json")))["w"]]))
    if kind == "push":
        options = [{"act": "fold", "label": "Passer"}, {"act": "allin", "sizeBB": stack, "label": f"Tapis {fr(stack)} BB"}]
        freq = [1 - f, f]
        facing = f"Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, {fr(stack)} BB effectives."
        history = ["Tous passent jusqu'à la SB"]
        verb = "pousser"
    else:
        options = [{"act": "fold", "label": "Passer"}, {"act": "call", "sizeBB": stack - 1, "label": f"Payer {fr(stack - 1)} BB"}]
        freq = [1 - f, f]
        facing = f"La SB part à tapis pour {fr(stack)} BB. Il vous en coûte {fr(stack - 1)} BB."
        history = ["Tous passent jusqu'à la SB", f"SB : tapis {fr(stack)} BB"]
        verb = "payer"
    best, ok = grade(freq)
    if t is None:
        limit = f"À l'équilibre, {hand} ne doit jamais {verb} entre 1 et 25 BB."
    elif t >= 25:
        limit = f"À l'équilibre, {hand} se joue à {verb} jusqu'à au moins 25 BB."
    else:
        limit = f"À l'équilibre, {hand} se joue à {verb} jusqu'à environ {fr(t)} BB (seuil calculé)."
    decision = "pousser" if kind == "push" else "payer"
    text = (f"{limit} À {fr(stack)} BB, la solution choisit de {decision} {pct(f)} % du temps. "
            + ("La SB gagne souvent les 1,5 BB sans abattage, et reste rarement très derrière quand elle est payée." if kind == "push" and f > 0.5 else "")
            + ("Plus le tapis est profond, plus le risque devient grand pour un gain fixe de 1,5 BB : la range se resserre." if kind == "push" and f <= 0.5 else "")
            + ("La BB paie avec un prix favorable : seulement " + fr(stack - 1) + " BB pour un pot de " + fr(2 * stack) + " BB." if kind == "call" and f > 0.5 else "")
            + ("Même avec un bon prix, cette main est trop souvent dominée par la range de tapis de la SB." if kind == "call" and f <= 0.5 else ""))
    scenarios.append({
        "id": sid, "version": 1, "street": "preflop", "type": "Push/fold", "difficulty": diff, "title": title,
        "players": 2, "hero": {"pos": pos, "cards": [cards[:2], cards[2:]]},
        "villains": [{"pos": "BB" if pos == "SB" else "SB", "stackBB": stack}], "stackBB": stack, "blinds": "0,5 / 1 (sans ante)",
        "board": [], "potBB": 1.5 if kind == "push" else stack + 1, "history": history, "facing": facing,
        "options": options, "best": best, "acceptable": ok, "frequencies": [pct(x) for x in freq],
        "explanation": text,
        "keyPoints": [f"Push/fold tête-à-tête : la SB pousse ≈ {pct(pushpct / sum(sum(r) for r in json.load(open(os.path.join(lab, 'equity.json')))['w']))} % des mains à {fr(stack)} BB.", "Équilibre de Nash : aucun joueur ne gagne à dévier seul.", "Sans ante. Avec ante, toutes les ranges s'élargissent."],
        "source": {"kind": "solver", "pack": "stackora-nash-hu-v1", "solver": "Nash push/fold STACKORA (fictitious play)", "solverVersion": "1.0",
                   "settings": f"Tête-à-tête SB contre BB, push ou fold, sans ante, {nash['iterations']} itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité {grid[stack]['exploitability_bb']:.4f} BB.",
                   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."},
    })

# ───────── Postflop : native-solver ─────────
META = {
 "po-value-river": dict(type="Value bet", diff=2, title="Valeur à la river", players=2, hero=("BTN", ["Kc", "Jd"]), vil="BB", blinds="0,5 / 1",
   history=["Préflop : vous relancez, BB suit", "Flop : mise, BB suit", "Turn : check, check", "River : BB checke"], facing="Pot de 20 BB, la BB checke.",
   expl="La solution mise presque toujours avec la double paire : surtout 70 % du pot (79 %), parfois en surmise à 150 % (20 %), presque jamais petit. Les Rois avec un moins bon kicker, les 9 et les tirages ratés qui paient trop sont les mains qui donnent de la valeur. La range entière, elle, checke 52 % du temps : vous êtes dans sa partie forte.",
   keys=["Une main forte mais pas imbattable mise gros, sans forcément surmiser.", "Les surmises sont réservées à une petite part de la range.", "Checker la turn rend la range moins lisible à la river."]),
 "po-bluff-missed-flush": dict(type="Bluff", diff=3, title="Tirage raté à la river", players=2, hero=("BTN", ["Qs", "Js"]), vil="BB", blinds="0,5 / 1",
   history=["Préflop : vous relancez, BB suit", "Flop : mise, BB suit", "Turn : check, check", "River : BB checke"], facing="Votre couleur ne rentre pas. Vous avez hauteur Dame.",
   expl="Surprise : la solution checke Q♠J♠ à 99 %. La range bluffe bien (29 %), mais avec ses tirages ratés les plus faibles, 7-6, 6-5, 5-4 assortis, qui ne gagnent jamais à l'abattage. Hauteur Dame bat une partie de ces mains : elle garde une petite valeur d'abattage, donc mieux vaut checker.",
   keys=["On bluffe avec les pires mains, pas avec celles qui gagnent parfois.", "Un tirage raté n'est pas automatiquement un bluff.", "Fréquence de réussite nécessaire = mise / (pot + mise)."]),
 "po-bluffcatch": dict(type="Bluff catch", diff=2, title="Bluff catcher à la river", players=2, hero=("BB", ["Ah", "Td"]), vil="BTN", blinds="0,5 / 1",
   history=["Flop : check, mise, suivi", "Turn : check, check", "River : vous checkez, BTN mise 12 BB"], facing="Il vous en coûte 12 BB pour un pot de 36 BB.",
   expl="A-T est pile à la limite : la solution passe 51 % du temps et paie 46 %. Les deux choix ont la même valeur à l'équilibre. La range de la BB paie 62 % du temps : les As avec un meilleur kicker et les doubles paires paient, les As plus faibles servent de limite.",
   keys=["À l'équilibre, la main limite est indifférente entre payer et passer.", "Cotes du pot : 12 / (36 + 12) = 25 %.", "Relancer un bluff catcher ne fait payer que mieux."]),
 "po-river-overbet": dict(type="River", diff=3, title="Surmise à la river", players=2, hero=("BB", ["9h", "8h"]), vil="BTN", blinds="0,5 / 1",
   history=["Flop : check, mise, suivi", "Turn : check, mise, suivi", "River : vous checkez, BTN mise 30 BB"], facing="Il vous en coûte 30 BB pour un pot de 48 BB.",
   expl="Passer à 100 %. Face à une surmise (167 % du pot), la range de la BB passe 66 % du temps et ne paie qu'avec des mains plus fortes que la deuxième paire. 9-8 ne bat que les bluffs, et il en faut au moins 38 % pour rentabiliser le call.",
   keys=["Plus la mise est grosse, plus la range qui paie se resserre.", "Une surmise représente une range polarisée.", "Passer une main moyenne est souvent la bonne réponse."]),
 "po-turn-barrel": dict(type="Turn barrel", diff=2, title="Deuxième barrel avec tirage", players=2, hero=("BTN", ["Qh", "Jh"]), vil="BB", blinds="0,5 / 1",
   history=["Préflop : vous relancez, BB suit", "Flop : check, vous misez, BB suit", "Turn : BB checke"], facing="Pot de 9 BB. Vous avez un tirage à suite par les deux bouts.",
   expl="Stratégie mixte : checker 55 %, miser 66 % du pot 45 %. Les deux lignes rapportent autant à l'équilibre. Le tirage ouvert a assez d'équité pour miser, mais il profite aussi d'une carte gratuite. La range du bouton mise 57 % du temps sur cette turn.",
   keys=["Les mixtes signifient que plusieurs actions ont la même valeur.", "Semi-bluff = fold equity + équité du tirage.", "Checker un tirage protège aussi la range qui checke."]),
 "po-spr-low": dict(type="SPR", diff=2, title="SPR faible avec top paire", players=2, hero=("SB", ["As", "Kd"]), vil="BTN", blinds="0,5 / 1",
   history=["Préflop : vous faites un 3-bet, BTN suit", "Flop : vous checkez, BTN mise 8 BB"], facing="Pot de 28 BB, il vous reste 25 BB (SPR au flop ≈ 1,25).",
   expl="La solution relance presque toujours (98 %) : tapis direct 56 %, ou relance qui laisse moins de 3 BB derrière 42 %. Payer : 2 %. Avec un tapis à peine supérieur au pot, la top paire meilleur kicker est une main de tapis.",
   keys=["SPR = tapis effectif / pot au début de la street.", "SPR bas : top paire = engagé.", "Ne laissez pas une carte gratuite aux tirages."]),
 "po-cbet-a72": dict(type="C-bet", diff=1, title="Continuation bet sur board sec", players=2, hero=("BTN", ["Kh", "Qh"]), vil="BB", blinds="0,5 / 1",
   history=["Préflop : vous relancez à 2,5 BB, BB suit", "Flop : BB checke"], facing="Pot de 5,5 BB, la BB a checké.", expl=None,
   keys=["Board sec avec un As : avantage de range au relanceur.", "Petite mise fréquente sur ce type de flop.", "Avec plusieurs streets à jouer, les solutions convergent plus lentement."]),
 "po-vscbet-k83": dict(type="vs C-bet", diff=1, title="Défendre avec une paire", players=2, hero=("BB", ["8h", "7h"]), vil="BTN", blinds="0,5 / 1",
   history=["BTN relance à 2,5 BB", "BB (vous) suit", "Flop : vous checkez", "BTN mise 1,8 BB"], facing="Il vous en coûte 1,8 BB pour un pot de 7,3 BB.", expl=None,
   keys=["Petite mise adverse = défense large.", "Une main moyenne préfère garder le pot petit.", "Cotes : 1,8 / 9,1 ≈ 20 %."]),
 "po-xr-set": dict(type="Check-raise", diff=2, title="Brelan face à une c-bet", players=2, hero=("BB", ["4d", "4c"]), vil="CO", blinds="0,5 / 1",
   history=["CO relance à 2,5 BB", "BB (vous) suit", "Flop : vous checkez", "CO mise 3,6 BB"], facing="Il vous en coûte 3,6 BB.", expl=None,
   keys=["Construire le pot quand on est loin devant.", "Un board connecté pousse à protéger sa main.", "Le check-raise mélange valeur et tirages."]),
 "po-wet-oop": dict(type="Board texture", diff=3, title="Board connecté hors de position", players=2, hero=("UTG", ["Ac", "Ad"]), vil="BTN", blinds="0,5 / 1",
   history=["Préflop : vous ouvrez, BTN suit"], facing="Vous parlez en premier sur un flop très connecté.", expl=None,
   keys=["Board connecté = avantage à celui qui a payé.", "Hors de position, checker protège la range.", "Les grosses paires restent fortes mais vulnérables."]),
}
LABEL = {"check": "Checker", "call": "Payer", "fold": "Passer"}
for sid, m in META.items():
    r = results.get(sid)
    if not r:
        continue
    pot = r["pot"]
    opts = []
    for a in r["actions"]:
        k, amt = a["kind"], a["amount"]
        if k in LABEL:
            opts.append({"act": k, "label": LABEL[k] + (f" {fr(pot * 0 + amt)} BB" if k == "call" and amt else "")})
        elif k == "bet":
            allin = abs(amt - r["stack"]) < 0.01
            opts.append({"act": "allin" if allin else "bet", "sizeBB": round(amt, 1), "label": f"Miser {fr(round(amt, 1))} BB ({round(100 * amt / pot)} % du pot)" if not allin else f"Tapis {fr(amt)} BB"})
        else:
            opts.append({"act": "raise", "sizeBB": round(amt, 1), "label": f"Relancer de {fr(round(amt, 1))} BB"})
    freq = r["hero_freq"]
    best, ok = grade(freq)
    expl_pct = r["exploitability_pct_pot"]
    if m["expl"] is None:
        parts = [f"{o['label']} {pct(f)} %" for o, f in zip(opts, freq) if f >= 0.01]
        text = "Solution calculée : " + ", ".join(parts) + ". La range entière : " + ", ".join(f"{o['label'].split(' (')[0]} {pct(f)} %" for o, f in zip(opts, r["range_freq"])) + "."
    else:
        text = m["expl"]
    spec = specs[sid]
    hero, cards = m["hero"]
    scenarios.append({
        "id": sid, "version": 2, "street": "postflop", "type": m["type"], "difficulty": m["diff"], "title": m["title"],
        "players": 2, "hero": {"pos": hero, "cards": cards}, "villains": [{"pos": m["vil"], "stackBB": r["stack"]}], "stackBB": r["stack"], "blinds": m["blinds"],
        "board": r["board"], "potBB": pot, "history": m["history"], "facing": m["facing"],
        "options": opts, "best": best, "acceptable": ok, "frequencies": [pct(x) for x in freq], "rangeFrequencies": [pct(x) for x in r["range_freq"]],
        "explanation": text, "keyPoints": m["keys"],
        "model": {"hero": r["player"], "oop": spec["oop"], "ip": spec["ip"], "sizes": spec["sizes"], "maxRaises": spec.get("max_raises", 1), "iterations": r["iterations"], "exploitabilityPct": round(expl_pct, 3), "buckets": r.get("buckets")},
        "source": {"kind": "solver", "pack": "stackora-solved-v1", "solver": "native-solver", "solverVersion": "0.1.0 (MIT / Apache-2.0)",
                   "settings": f"DCFR, {r['iterations']} itérations, mises {', '.join(str(round(s * 100)) + ' %' for s in spec['sizes'])} du pot, {spec.get('max_raises', 1)} relance max, isomorphie des couleurs" + (f", {r['buckets']} groupes de mains par street" if r.get("buckets") else "") + f". Exploitabilité {expl_pct:.2f} % du pot.",
                   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."},
    })

# ───────── Tableau Nash complet (chiffres 0-9 par main) ─────────
stacks = [s for s in sorted(grid) if s in (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 25)]
table = {str(int(s)): {"push": "".join(str(min(9, round(x * 9))) for x in grid[s]["push"]), "call": "".join(str(min(9, round(x * 9))) for x in grid[s]["call"])} for s in stacks}
thresholds = {h: [threshold(h, "push"), threshold(h, "call")] for h in names}

with open(out, "w") as f:
    f.write("// Généré par tools/build_gto.py à partir des calculs du dossier gto-lab. Ne pas modifier à la main.\n")
    f.write('import type { Scenario } from "./gto";\n\n')
    f.write("export const SOLVED: Scenario[] = " + json.dumps(scenarios, ensure_ascii=False, indent=1) + ";\n\n")
    f.write("/** Mains dans l'ordre de native-solver (all_canonical_hands). */\nexport const NASH_HANDS: string[] = " + json.dumps(names) + ";\n")
    f.write("/** Fréquences (0 à 9) de push SB et de call BB par profondeur, tête-à-tête sans ante. */\nexport const NASH_TABLE: Record<string, { push: string; call: string }> = " + json.dumps(table) + ";\n")
    f.write("/** Seuils [push, call] en BB : profondeur maximale (1 à 25) où la main est jouée majoritairement. */\nexport const NASH_THRESHOLDS: Record<string, [number | null, number | null]> = " + json.dumps(thresholds) + ";\n")
print(len(scenarios), "scénarios ;", ", ".join(s["id"] for s in scenarios))
