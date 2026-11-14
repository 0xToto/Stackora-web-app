import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, font, radius, space, type } from "../theme";
import { durable } from "../storage";
import { haptic, sound } from "../feedback";
import { Button, FadeIn, Group, Icon, Pill, ProgressBar, Row, SectionHeader, Segmented, SettingRow, Surface, T, Tap, useToast } from "../ui";
import { PlayingCard } from "../poker/cards";
import { POSITION_NAME, actionOrder, positionsFor, type Position } from "../poker/positions";
import { SCENARIOS, isSolved, type Scenario } from "../data/gto";
import { NASH_HANDS, NASH_TABLE, NASH_THRESHOLDS } from "../data/gto-solved";
import { useApp } from "../app-context";
import { Screen } from "./shell";

// ───────── Stockage local de progression (le serveur garde les agrégats récompensés) ─────────
type Store = { stats: Record<string, { ok: number; n: number }>; errors: string[]; history: { at: number; module: string; correct: number; total: number }[] };
const KEY = "stackora-training-v1";
const EMPTY: Store = { stats: {}, errors: [], history: [] };
function useTrainingStore() {
  const [store, setStore] = useState<Store>(EMPTY);
  useEffect(() => {
    void durable.get(KEY).then((v) => v && setStore({ ...EMPTY, ...JSON.parse(v) }));
  }, []);
  const update = (fn: (s: Store) => Store) =>
    setStore((s) => {
      const next = fn(s);
      void durable.set(KEY, JSON.stringify(next));
      return next;
    });
  return { store, update };
}
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// ───────── Mini-table pédagogique ─────────
function MiniTable({ size, button, onSeat, marks, labels, target, hero }: { size: number; button: number; onSeat?: (s: number) => void; marks?: Record<number, "ok" | "bad" | "answer">; labels?: Record<number, string>; target?: number; hero?: number }) {
  const W = 300, H = 200;
  return (
    <View style={{ width: W, height: H + 40, alignSelf: "center" }}>
      <View style={[st.miniRail, { left: 30, top: 30, width: W - 60, height: H - 30 }]}>
        <LinearGradient colors={["#17493D", "#0A251F"]} style={{ flex: 1, borderRadius: 200, borderWidth: 1, borderColor: "rgba(217,172,99,0.25)" }} />
      </View>
      {Array.from({ length: size }, (_, s) => {
        const ang = Math.PI / 2 + (s * 2 * Math.PI) / size;
        const x = W / 2 + (W / 2 - 22) * Math.cos(ang), y = (H + 30) / 2 + 10 + (H / 2 - 4) * Math.sin(ang);
        const m = marks?.[s];
        const bg = m === "ok" || m === "answer" ? color.success : m === "bad" ? color.danger : s === target ? color.accent : color.surface3;
        const dx = (W / 2 - x) * 0.32, dy = ((H + 30) / 2 + 10 - y) * 0.32;
        return (
          <React.Fragment key={s}>
            {s === button && <View style={[st.miniDealer, { left: x + dx - 9, top: y + dy - 9 }]}><Text style={st.miniDealerText}>D</Text></View>}
            <Tap onPress={() => onSeat?.(s)} disabled={!onSeat} feedback="select" label={`Siège ${s + 1}${labels?.[s] ? `, ${labels[s]}` : ""}`} style={[st.miniSeat, { left: x - 22, top: y - 22, backgroundColor: bg, borderColor: s === hero ? color.gold : "rgba(255,255,255,0.15)" }]}>
              <Text style={[st.miniSeatText, (m || s === target) && { color: "#0B0D10" }]}>{labels?.[s] ?? (s === hero ? "Vous" : s + 1)}</Text>
            </Tap>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ───────── Quiz des positions ─────────
type Level = "beginner" | "intermediate" | "expert";
type Q = { size: number; button: number; text: string; kind: "seat" | "choice"; answer: number; target?: number; choices?: string[]; answerLabel: string; explain: string; positions: Map<number, Position> };
function makeQuestion(level: Level, sizes: number[]): Q {
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const seats = Array.from({ length: size }, (_, i) => i);
  const button = Math.floor(Math.random() * size);
  const pos = positionsFor(seats, button, size);
  const seatOf = (p: Position) => seats.find((s) => pos.get(s) === p)!;
  const pre = actionOrder(seats, button, "preflop", size), post = actionOrder(seats, button, "postflop", size);
  const ask = (p: Position, text?: string): Q => ({ size, button, positions: pos, kind: "seat", answer: seatOf(p), text: text ?? `Touchez le siège ${p === "BTN" ? "du bouton" : `en ${POSITION_NAME[p]} (${p})`}.`, answerLabel: `${POSITION_NAME[p]} · siège ${seatOf(p) + 1}`, explain: explainFor(p, size) });
  const pool: (() => Q)[] = [() => ask("BTN"), () => ask("SB"), () => ask("BB")];
  if (level !== "beginner") {
    pool.push(() => ask("UTG"), () => ask("CO"));
    if (size >= 6) pool.push(() => ask("HJ"));
    pool.push(() => ({ ...ask(pos.get(pre[0])!), text: "Qui parle en premier avant le flop ?", explain: "Avant le flop, l'action commence juste après la grosse blinde : c'est UTG." }));
    pool.push(() => ({ ...ask("BTN"), text: "Qui parle en dernier après le flop ?", explain: "Après le flop, le bouton parle toujours en dernier : c'est l'avantage de position." }));
  }
  if (level === "expert") {
    if (size === 8) pool.push(() => ask("LJ"), () => ask("UTG+1"));
    pool.push(() => ({ ...ask(pos.get(post[0])!), text: "Qui parle en premier après le flop (si tout le monde a suivi) ?", explain: "Après le flop, l'action commence au premier joueur actif à gauche du bouton : la small blind." }));
    for (let k = 0; k < 3; k++)
      pool.push(() => {
        const target = seats.filter((s) => s !== button)[Math.floor(Math.random() * (size - 1))];
        const correct = pos.get(target)!;
        const others = shuffle([...new Set([...pos.values()])].filter((p) => p !== correct)).slice(0, 3);
        const choices = shuffle([correct, ...others]).map((p) => p as string);
        return { size, button, positions: pos, kind: "choice", target, choices, answer: choices.indexOf(correct), text: "Quelle est la position du siège surligné ?", answerLabel: `${POSITION_NAME[correct]} (${correct})`, explain: explainFor(correct, size) };
      });
  }
  return pool[Math.floor(Math.random() * pool.length)]();
}
function explainFor(p: Position, size: number) {
  const m: Partial<Record<Position, string>> = {
    BTN: "Le bouton porte le jeton D. Il parle en dernier sur le flop, la turn et la river.",
    SB: "La small blind est le premier siège à gauche du bouton.",
    BB: "La big blind est le deuxième siège à gauche du bouton.",
    UTG: "UTG est juste après la big blind : premier à parler avant le flop.",
    "UTG+1": "UTG+1 est le siège après UTG (à 8 joueurs).",
    LJ: "Le Lojack est trois sièges avant le bouton.",
    HJ: "Le Hijack est deux sièges avant le bouton.",
    CO: "Le Cutoff est juste avant le bouton.",
  };
  return `${m[p] ?? ""} Table ${size}-max.`;
}

function PositionsQuiz({ onExit }: { onExit: () => void }) {
  const a = useApp();
  const toast = useToast();
  const { update } = useTrainingStore();
  const [level, setLevel] = useState<Level>("beginner");
  const [format, setFormat] = useState<"6" | "8" | "mix">("8");
  const [length, setLength] = useState(12);
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState<Q | null>(null);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ text: string; answer: string }[]>([]);
  const [done, setDone] = useState(false);
  const sizes = format === "6" ? [6] : format === "8" ? [8] : [6, 8];
  const start = () => {
    setStarted(true);
    setDone(false);
    setN(0);
    setScore(0);
    setErrors([]);
    setPicked(null);
    setQ(makeQuestion(level, sizes));
  };
  const answer = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.answer;
    haptic(ok ? "success" : "warning");
    sound(ok ? "tap" : "alert");
    if (ok) setScore((s) => s + 1);
    else setErrors((e) => [...e, { text: q.text, answer: q.answerLabel }]);
  };
  const next = async () => {
    if (n + 1 >= length) {
      setDone(true);
      const correct = score;
      update((s) => ({ ...s, history: [{ at: Date.now(), module: "positions", correct, total: length }, ...s.history].slice(0, 50), stats: { ...s.stats, [`positions-${level}`]: { ok: (s.stats[`positions-${level}`]?.ok ?? 0) + correct, n: (s.stats[`positions-${level}`]?.n ?? 0) + length } } }));
      try {
        const r = await a.submitTraining({ sessionId: uid(), module: "positions", category: `${level}-${format}`, correct, total: length });
        if (r.coins || r.xp) toast(`Session terminée · +${r.coins} StackCoins · +${r.xp} XP`, "reward");
        else if (r.reason) toast(r.reason, "info");
      } catch {
        toast("Progression enregistrée sur l'appareil (serveur injoignable).", "info");
      }
      return;
    }
    setN(n + 1);
    setPicked(null);
    setQ(makeQuestion(level, sizes));
  };
  if (!started)
    return (
      <Screen title="Quiz des positions" back={onExit}>
        <T v="body">Une table s'affiche avec le bouton dealer. Touchez le bon siège ou choisissez la bonne position. Les noms s'adaptent au nombre de joueurs.</T>
        <Group title="Niveau"><View style={{ padding: space.md }}><Segmented label="Niveau" value={level} onChange={setLevel} options={[{ value: "beginner", label: "Débutant" }, { value: "intermediate", label: "Intermédiaire" }, { value: "expert", label: "Expert" }]} /></View></Group>
        <Group title="Table"><View style={{ padding: space.md }}><Segmented label="Format" value={format} onChange={setFormat} options={[{ value: "6", label: "6-max" }, { value: "8", label: "8-max" }, { value: "mix", label: "Mélange" }]} /></View></Group>
        <Group title="Questions"><View style={{ padding: space.md }}><Segmented label="Nombre de questions" value={length} onChange={setLength} options={[{ value: 10, label: "10" }, { value: 12, label: "12" }, { value: 15, label: "15" }, { value: 20, label: "20" }]} /></View></Group>
        <Button kind="gold" title="Commencer" icon="play" onPress={start} />
      </Screen>
    );
  if (done)
    return (
      <Screen title="Bilan" back={onExit}>
        <Surface tone={score / length >= 0.8 ? "gold" : "default"} style={{ alignItems: "center", gap: 6, paddingVertical: space.xl }}>
          <Text style={[type.number, { fontSize: 48 }]}>{score}/{length}</Text>
          <T v="headline">{score === length ? "Sans faute !" : score / length >= 0.8 ? "Très solide" : score / length >= 0.5 ? "En bonne voie" : "On continue"}</T>
          <T v="caption">{Math.round((score / length) * 100)} % de bonnes réponses</T>
        </Surface>
        {errors.length > 0 && (
          <Group title="À retravailler">
            {errors.map((e, i) => <SettingRow key={i} icon="refresh-outline" title={e.text} subtitle={`Réponse : ${e.answer}`} last={i === errors.length - 1} />)}
          </Group>
        )}
        <Button kind="gold" title="Nouvelle session" icon="refresh" onPress={start} />
        <Button kind="secondary" title="Changer de niveau" onPress={() => setStarted(false)} />
      </Screen>
    );
  if (!q) return null;
  const marks: Record<number, "ok" | "bad" | "answer"> = {};
  const revealed = picked !== null;
  if (revealed && q.kind === "seat") {
    marks[q.answer] = "answer";
    if (picked !== q.answer) marks[picked!] = "bad";
  }
  const labels: Record<number, string> | undefined = revealed ? Object.fromEntries([...q.positions.entries()].map(([s, p]) => [s, p === "BTN/SB" ? "BTN" : p])) : undefined;
  return (
    <Screen title="Quiz des positions" eyebrow={`Question ${n + 1} / ${length} · ${q.size}-max`} back={onExit}>
      <Row gap={10}>
        <View style={{ flex: 1 }}><ProgressBar value={(n + (revealed ? 1 : 0)) / length} /></View>
        <T v="callout">{score} pt{score > 1 ? "s" : ""}</T>
      </Row>
      <T v="title" style={{ fontSize: 22 }}>{q.text}</T>
      <MiniTable size={q.size} button={q.button} onSeat={q.kind === "seat" && !revealed ? answer : undefined} marks={marks} labels={labels} target={q.target} />
      {q.kind === "choice" && (
        <View style={{ gap: 8 }}>
          {q.choices!.map((c, i) => {
            const state = revealed ? (i === q.answer ? "ok" : i === picked ? "bad" : null) : null;
            return (
              <Tap key={c} onPress={() => answer(i)} label={c} style={[st.choice, state === "ok" && { borderColor: color.success, backgroundColor: color.successTint }, state === "bad" && { borderColor: color.danger, backgroundColor: color.dangerTint }]}>
                <T v="callout">{POSITION_NAME[c as Position]} ({c})</T>
              </Tap>
            );
          })}
        </View>
      )}
      {revealed && (
        <FadeIn>
          <Surface style={{ gap: 8 }}>
            <Row gap={8}>
              <Icon name={picked === q.answer ? "checkmark-circle" : "close-circle"} size={22} tint={picked === q.answer ? color.success : color.danger} />
              <T v="headline" tint={picked === q.answer ? color.success : color.danger}>{picked === q.answer ? "Bonne réponse" : "Mauvaise réponse"}</T>
            </Row>
            <T v="callout">{q.answerLabel}</T>
            <T v="body">{q.explain}</T>
            <Button kind="gold" title={n + 1 >= length ? "Voir le bilan" : "Question suivante"} icon="arrow-forward" onPress={() => void next()} />
          </Surface>
        </FadeIn>
      )}
    </Screen>
  );
}

// ───────── Entraîneur de décisions ─────────
const ACT_ICON = { fold: "close", check: "remove", call: "checkmark", bet: "arrow-up", raise: "trending-up", allin: "flame" } as const;
function ScenarioView({ s, picked, onPick }: { s: Scenario; picked: number | null; onPick: (i: number) => void }) {
  const revealed = picked !== null;
  const verdict = !revealed ? null : s.best.includes(picked!) ? "best" : s.acceptable?.includes(picked!) ? "ok" : "bad";
  return (
    <View style={{ gap: space.md }}>
      <Surface tone="felt" style={{ gap: space.sm }}>
        <Row between>
          <T v="eyebrow">{s.type} · {s.street === "preflop" ? "Préflop" : "Postflop"}</T>
          <Row gap={2}>{[1, 2, 3].map((d) => <Icon key={d} name={d <= s.difficulty ? "star" : "star-outline"} size={12} tint={color.gold} />)}</Row>
        </Row>
        <T v="headline">{s.title}</T>
        <Row gap={6} wrap>
          <View style={st.chip}><Text style={st.chipText}>{s.players} joueurs</Text></View>
          <View style={st.chip}><Text style={st.chipText}>Vous : {s.hero.pos}</Text></View>
          {s.villains.map((v) => <View key={v.pos} style={st.chip}><Text style={st.chipText}>{v.pos} · {v.stackBB} BB</Text></View>)}
          <View style={st.chip}><Text style={st.chipText}>Tapis {s.stackBB} BB</Text></View>
          <View style={st.chip}><Text style={st.chipText}>Blindes {s.blinds}</Text></View>
        </Row>
        <Row gap={space.md} style={{ alignItems: "flex-end", marginTop: 4 }}>
          <View style={{ gap: 4 }}>
            <T v="caption" style={{ color: "#B5C8BF" }}>Votre main</T>
            <Row gap={4}>{s.hero.cards.map((c) => <PlayingCard key={c} code={c} size={50} />)}</Row>
          </View>
          {s.board.length > 0 && (
            <View style={{ gap: 4, flex: 1 }}>
              <T v="caption" style={{ color: "#B5C8BF" }}>Board</T>
              <Row gap={3} wrap>{s.board.map((c) => <PlayingCard key={c} code={c} size={34} />)}</Row>
            </View>
          )}
        </Row>
        <Row between style={{ marginTop: 4 }}>
          <T v="caption" style={{ color: "#B5C8BF" }}>Pot</T>
          <Text style={[type.number, { fontSize: 16 }]}>{s.potBB.toLocaleString("fr-FR")} BB</Text>
        </Row>
      </Surface>
      {s.history.length > 0 && (
        <View style={{ gap: 4 }}>
          {s.history.map((h, i) => <Row key={i} gap={8}><View style={st.dot} /><T v="caption" style={{ color: color.textSoft }}>{h}</T></Row>)}
        </View>
      )}
      <T v="callout" style={{ color: color.gold }}>{s.facing}</T>
      <View style={{ gap: 8 }}>
        {s.options.map((o, i) => {
          const isBest = revealed && s.best.includes(i);
          const isOk = revealed && s.acceptable?.includes(i);
          const isMine = picked === i;
          return (
            <Tap key={i} onPress={() => !revealed && onPick(i)} label={o.label} style={[st.option, isBest && { borderColor: color.success, backgroundColor: color.successTint }, isOk && !isBest && { borderColor: color.warning }, isMine && !isBest && !isOk && { borderColor: color.danger, backgroundColor: color.dangerTint }]}>
              <Icon name={ACT_ICON[o.act]} size={18} tint={color.textSoft} />
              <T v="callout" style={{ flex: 1 }}>{o.label}</T>
              {revealed && s.frequencies && <Text style={[type.number, { fontSize: 13 }]}>{s.frequencies[i]} %</Text>}
              {isMine && <T v="caption">Votre choix</T>}
            </Tap>
          );
        })}
      </View>
      {revealed && (
        <FadeIn style={{ gap: space.md }}>
          <Surface style={{ gap: 10 }}>
            <Row gap={8}>
              <Icon name={verdict === "best" ? "checkmark-circle" : verdict === "ok" ? "ellipse-outline" : "close-circle"} size={22} tint={verdict === "best" ? color.success : verdict === "ok" ? color.warning : color.danger} />
              <T v="headline" tint={verdict === "best" ? color.success : verdict === "ok" ? color.warning : color.danger}>{verdict === "best" ? "Décision recommandée" : verdict === "ok" ? "Acceptable" : "À revoir"}</T>
            </Row>
            <T v="caption">Référence : {s.best.map((i) => s.options[i].label).join(" ou ")}{s.acceptable?.length ? ` · acceptable : ${s.acceptable.map((i) => s.options[i].label).join(", ")}` : ""}</T>
            <T v="body">{s.explanation}</T>
            <View style={{ gap: 6 }}>
              {s.keyPoints.map((k) => <Row key={k} gap={8} style={{ alignItems: "flex-start" }}><Icon name="key-outline" size={14} tint={color.gold} /><T v="caption" style={{ flex: 1, color: color.textSoft, fontSize: 13.5 }}>{k}</T></Row>)}
            </View>
          </Surface>
          {s.frequencies && <FrequencyBars s={s} picked={picked!} />}
          <Row gap={8} style={st.source}>
            <Icon name={s.source.kind === "solver" ? "hardware-chip-outline" : "school-outline"} size={16} tint={color.muted} />
            <T v="caption" style={{ flex: 1 }}>
              {s.source.kind === "solver"
                ? `${s.source.solver} ${s.source.solverVersion} · ${s.source.settings} ${s.source.license}`
                : `${s.source.note} (pack ${s.source.pack}, v${s.version}).`}
            </T>
          </Row>
          {s.model && <ModelDetails s={s} />}
        </FadeIn>
      )}
    </View>
  );
}

/** Fréquences du héros et de toute sa range, action par action. */
function FrequencyBars({ s, picked }: { s: Scenario; picked: number }) {
  return (
    <Surface style={{ gap: 12 }}>
      <Row between><T v="headline">Fréquences de la solution</T><T v="caption">votre main · range</T></Row>
      {s.options.map((o, i) => (
        <View key={i} style={{ gap: 5 }}>
          <Row between>
            <T v="callout" style={{ flex: 1, color: i === picked ? color.text : color.textSoft }} numberOfLines={1}>{o.label}{i === picked ? " · votre choix" : ""}</T>
            <Text style={[type.number, { fontSize: 13 }]}>{s.frequencies![i].toLocaleString("fr-FR")} %{s.rangeFrequencies ? <Text style={{ color: color.muted }}> · {s.rangeFrequencies[i].toLocaleString("fr-FR")} %</Text> : null}</Text>
          </Row>
          <View style={st.barTrack}>
            <View style={[st.barFill, { width: `${Math.max(0.5, s.frequencies![i])}%`, backgroundColor: s.best.includes(i) ? color.success : s.acceptable?.includes(i) ? color.warning : color.faint }]} />
            {s.rangeFrequencies && <View style={[st.barMark, { left: `${Math.min(99, s.rangeFrequencies[i])}%` }]} />}
          </View>
        </View>
      ))}
      <T v="caption">Juste : action jouée au moins 40 % du temps par la solution. Acceptable : entre 15 et 40 %. Le trait vertical indique la fréquence de toute la range.</T>
    </Surface>
  );
}
function ModelDetails({ s }: { s: Scenario }) {
  const [open, setOpen] = useState(false);
  const m = s.model!;
  const heroIsOop = m.hero === "oop";
  return (
    <Surface style={{ gap: 8 }}>
      <Tap onPress={() => setOpen(!open)} label="Hypothèses du modèle" style={{ minHeight: 32, justifyContent: "center" }}>
        <Row between><T v="callout">Hypothèses du modèle</T><Icon name={open ? "chevron-up" : "chevron-down"} size={16} tint={color.muted} /></Row>
      </Tap>
      {open && (
        <>
          <T v="caption">Exploitabilité : {m.exploitabilityPct.toLocaleString("fr-FR")} % du pot ({m.iterations} itérations). Plus c'est bas, plus la solution est proche de l'équilibre.</T>
          <T v="caption">Mises autorisées : {m.sizes.map((x) => Math.round(x * 100) + " %").join(", ")} du pot · {m.maxRaises} relance max{m.buckets ? ` · mains regroupées en ${m.buckets} groupes par street` : ""}.</T>
          <T v="caption" style={{ color: color.textSoft }}>Range hors de position{heroIsOop ? " (vous)" : ""} : {m.oop}</T>
          <T v="caption" style={{ color: color.textSoft }}>Range en position{!heroIsOop ? " (vous)" : ""} : {m.ip}</T>
          <T v="caption">Les ranges d'entrée sont des choix de modélisation : la solution est exacte pour ces ranges et ces tailles, pas pour toutes les tables.</T>
        </>
      )}
    </Surface>
  );
}

const RANKS = "AKQJT98765432";
/** Tableau Nash push/fold tête-à-tête calculé par STACKORA. */
function NashChart({ onExit }: { onExit: () => void }) {
  const [stack, setStack] = useState("10");
  const [mode, setMode] = useState<"push" | "call">("push");
  const [sel, setSel] = useState<string | null>("A8o");
  const row = NASH_TABLE[stack][mode];
  const freqOf = (hand: string) => Number(row[NASH_HANDS.indexOf(hand)]) / 9;
  const name = (r: number, c: number) => (r === c ? RANKS[r] + RANKS[c] : r < c ? RANKS[r] + RANKS[c] + "s" : RANKS[c] + RANKS[r] + "o");
  const share = NASH_HANDS.reduce((acc, h) => acc + freqOf(h) * (h.length === 2 ? 6 : h.endsWith("s") ? 4 : 12), 0) / 1326;
  const t = sel ? NASH_THRESHOLDS[sel] : null;
  return (
    <Screen title="Tableau Nash" eyebrow="Push / fold tête-à-tête" back={onExit}>
      <Segmented label="Joueur" value={mode} onChange={setMode} options={[{ value: "push", label: "SB : pousser" }, { value: "call", label: "BB : payer" }]} />
      <Row gap={6} wrap>{Object.keys(NASH_TABLE).map((k) => <Pill key={k} label={`${k} BB`} active={stack === k} onPress={() => setStack(k)} />)}</Row>
      <T v="caption">{Math.round(share * 100)} % des mains {mode === "push" ? "poussées" : "payées"} à {stack} BB effectives.</T>
      <View style={st.chart}>
        {Array.from({ length: 13 }, (_, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {Array.from({ length: 13 }, (_, c) => {
              const h = name(r, c), f = freqOf(h);
              return (
                <Tap key={c} onPress={() => setSel(h)} feedback="select" label={`${h} ${Math.round(f * 100)} %`} style={[st.cell, { backgroundColor: f > 0.05 ? (mode === "push" ? `rgba(217,172,99,${0.2 + 0.8 * f})` : `rgba(125,139,255,${0.2 + 0.8 * f})`) : color.surface2 }, sel === h && { borderColor: color.text, borderWidth: 1.5 }]}>
                  <Text style={[st.cellText, f > 0.5 && { color: "#0B0D10" }]}>{h}</Text>
                </Tap>
              );
            })}
          </View>
        ))}
      </View>
      {sel && t && (
        <Surface style={{ gap: 4 }}>
          <T v="headline">{sel}</T>
          <T v="caption">Pousser en SB jusqu'à : {t[0] === null ? "jamais" : t[0] >= 25 ? "25 BB et plus" : `${t[0].toLocaleString("fr-FR")} BB`}</T>
          <T v="caption">Payer en BB jusqu'à : {t[1] === null ? "jamais" : t[1] >= 25 ? "25 BB et plus" : `${t[1].toLocaleString("fr-FR")} BB`}</T>
        </Surface>
      )}
      <T v="caption">Équilibre de Nash calculé par STACKORA (sans ante, retrait des cartes). Vérifié contre un tableau Nash gratuit publié en ligne : écarts de l'ordre de 0,1 à 0,2 BB sur les seuils comparés.</T>
    </Screen>
  );
}

function GtoTrainer({ onExit }: { onExit: () => void }) {
  const a = useApp();
  const toast = useToast();
  const { store, update } = useTrainingStore();
  const [street, setStreet] = useState<"all" | "preflop" | "postflop" | "errors">("all");
  const [diff, setDiff] = useState<0 | 1 | 2 | 3>(0);
  const [origin, setOrigin] = useState<"solved" | "fundamentals" | "all">("solved");
  const [queue, setQueue] = useState<Scenario[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const pool = useMemo(() => SCENARIOS.filter((s) => (street === "errors" ? store.errors.includes(s.id) : street === "all" || s.street === street) && (!diff || s.difficulty === diff) && (origin === "all" || (origin === "solved") === isSolved(s))), [street, diff, store.errors, origin]);
  const start = () => {
    setQueue(shuffle(pool).slice(0, 10));
    setI(0);
    setPicked(null);
    setScore(0);
    setMissed([]);
  };
  const pick = (k: number) => {
    const s = queue![i];
    setPicked(k);
    const ok = s.best.includes(k) || !!s.acceptable?.includes(k);
    haptic(ok ? "success" : "warning");
    if (ok) setScore((v) => v + 1);
    else setMissed((m) => [...m, s.id]);
    update((st) => ({
      ...st,
      stats: { ...st.stats, [s.type]: { ok: (st.stats[s.type]?.ok ?? 0) + (ok ? 1 : 0), n: (st.stats[s.type]?.n ?? 0) + 1 }, [s.street]: { ok: (st.stats[s.street]?.ok ?? 0) + (ok ? 1 : 0), n: (st.stats[s.street]?.n ?? 0) + 1 } },
      errors: ok ? st.errors.filter((e) => e !== s.id) : [...new Set([...st.errors, s.id])],
    }));
  };
  const finish = async () => {
    const total = queue!.length;
    update((st) => ({ ...st, history: [{ at: Date.now(), module: "gto", correct: score, total }, ...st.history].slice(0, 50) }));
    setQueue([]);
    try {
      const r = await a.submitTraining({ sessionId: uid(), module: "gto", category: street, correct: score, total });
      if (r.coins || r.xp) toast(`+${r.coins} StackCoins · +${r.xp} XP`, "reward");
      else if (r.reason) toast(r.reason, "info");
    } catch {
      toast("Progression enregistrée sur l'appareil.", "info");
    }
  };
  if (!queue)
    return (
      <Screen title="Décisions" eyebrow="Entraîneur stratégique" back={onExit}>
        <T v="body">Des situations réalistes de cash-game et de tournoi. Choisissez l'action, puis comparez-la à la ligne de référence et à son explication.</T>
        <Row gap={8} style={st.source}>
          <Icon name="hardware-chip-outline" size={16} tint={color.gold} />
          <T v="caption" style={{ flex: 1 }}>Solutions calculées : push/fold par équilibre de Nash (vérifié contre un tableau public gratuit) et spots postflop résolus avec native-solver, un solveur open source (MIT / Apache-2.0). Chaque situation affiche ses fréquences, ses hypothèses et son exploitabilité. Les « Fondamentaux » couvrent les spots multijoueurs non résolus ici, sans fréquences.</T>
        </Row>
        <Group title="Source"><View style={{ padding: space.md }}><Segmented label="Source" value={origin} onChange={setOrigin} options={[{ value: "solved", label: `Solveur (${SCENARIOS.filter(isSolved).length})` }, { value: "fundamentals", label: "Fondamentaux" }, { value: "all", label: "Tout" }]} /></View></Group>
        <Group title="Situations"><View style={{ padding: space.md }}><Segmented label="Situations" value={street} onChange={setStreet} options={[{ value: "all", label: "Tout" }, { value: "preflop", label: "Préflop" }, { value: "postflop", label: "Postflop" }, { value: "errors", label: `Erreurs (${store.errors.length})` }]} /></View></Group>
        <Group title="Difficulté"><View style={{ padding: space.md }}><Segmented label="Difficulté" value={diff} onChange={setDiff} options={[{ value: 0, label: "Toutes" }, { value: 1, label: "★" }, { value: 2, label: "★★" }, { value: 3, label: "★★★" }]} /></View></Group>
        <Button kind="gold" title={pool.length ? `Commencer · ${Math.min(10, pool.length)} situations` : "Aucune situation"} icon="play" onPress={start} disabled={!pool.length} />
      </Screen>
    );
  if (i >= queue.length || queue.length === 0)
    return (
      <Screen title="Bilan" back={onExit}>
        <Surface tone="accent" style={{ alignItems: "center", gap: 6, paddingVertical: space.xl }}>
          <Text style={[type.number, { fontSize: 44 }]}>{score} / {queue.length || score + missed.length}</Text>
          <T v="caption">décisions correctes ou acceptables</T>
        </Surface>
        {missed.length > 0 && (
          <Group title="Ajoutées à la révision">
            {missed.map((id, k) => <SettingRow key={id} icon="refresh-outline" title={SCENARIOS.find((s) => s.id === id)?.title ?? id} subtitle={SCENARIOS.find((s) => s.id === id)?.type} last={k === missed.length - 1} />)}
          </Group>
        )}
        <Button kind="gold" title="Nouvelle session" onPress={() => setQueue(null)} />
      </Screen>
    );
  const s = queue[i];
  return (
    <Screen title="Décisions" eyebrow={`Situation ${i + 1} / ${queue.length}`} back={onExit}>
      <ProgressBar value={(i + (picked !== null ? 1 : 0)) / queue.length} tint={color.accent} />
      <ScenarioView key={s.id} s={s} picked={picked} onPick={pick} />
      {picked !== null && <Button kind="gold" title={i + 1 >= queue.length ? "Voir le bilan" : "Situation suivante"} icon="arrow-forward" onPress={() => (i + 1 >= queue.length ? void finish().then(() => setI(i + 1)) : (setI(i + 1), setPicked(null)))} />}
    </Screen>
  );
}

export function TrainingScreen() {
  const [mode, setMode] = useState<null | "positions" | "gto" | "nash">(null);
  const { store } = useTrainingStore();
  if (mode === "positions") return <PositionsQuiz onExit={() => setMode(null)} />;
  if (mode === "gto") return <GtoTrainer onExit={() => setMode(null)} />;
  if (mode === "nash") return <NashChart onExit={() => setMode(null)} />;
  const pct = (k: string) => (store.stats[k]?.n ? Math.round((store.stats[k].ok / store.stats[k].n) * 100) : null);
  const types = Object.entries(store.stats).filter(([k]) => !k.startsWith("positions") && k !== "preflop" && k !== "postflop");
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="eyebrow">Exercices</T>
        <T v="title">Progresser, une main à la fois</T>
      </View>
      <Surface onPress={() => setMode("positions")} label="Quiz des positions" tone="felt" style={{ gap: 10, minHeight: 150 }}>
        <Row between>
          <View style={st.modIcon}><Icon name="locate" size={22} tint={color.gold} /></View>
          <Row gap={6}><Pill label="6-max" /><Pill label="8-max" /></Row>
        </Row>
        <T v="title" style={{ fontSize: 22 }}>Quiz des positions</T>
        <T v="caption" style={{ color: "#B5C8BF" }}>Bouton, blindes, UTG, Hijack, Cutoff… en 10 à 20 questions.</T>
      </Surface>
      <Surface onPress={() => setMode("gto")} label="Entraîneur de décisions" tone="accent" style={{ gap: 10, minHeight: 150 }}>
        <Row between>
          <View style={[st.modIcon, { backgroundColor: color.accentTint }]}><Icon name="git-branch-outline" size={22} tint={color.accent} /></View>
          <T v="caption">{SCENARIOS.filter(isSolved).length} solutions calculées</T>
        </Row>
        <T v="title" style={{ fontSize: 22 }}>Décisions préflop & postflop</T>
        <T v="caption">RFI, 3-bet, push or fold, c-bet, value, bluff, SPR…</T>
      </Surface>
      <Surface onPress={() => setMode("nash")} label="Tableau Nash push/fold" style={{ gap: 6 }}>
        <Row gap={10}>
          <View style={[st.modIcon, { width: 38, height: 38 }]}><Icon name="grid-outline" size={18} tint={color.gold} /></View>
          <View style={{ flex: 1 }}>
            <T v="headline">Tableau Nash push/fold</T>
            <T v="caption">Les 169 mains, de 2 à 25 BB, en SB et en BB.</T>
          </View>
          <Icon name="chevron-forward" size={18} tint={color.faint} />
        </Row>
      </Surface>
      <SectionHeader title="Statistiques" />
      <Row gap={space.sm}>
        {(["preflop", "postflop"] as const).map((k) => (
          <Surface key={k} style={{ flex: 1, gap: 4, alignItems: "center" }}>
            <Text style={[type.number, { fontSize: 26 }]}>{pct(k) ?? "—"}{pct(k) !== null ? " %" : ""}</Text>
            <T v="caption">{k === "preflop" ? "Préflop" : "Postflop"} · {store.stats[k]?.n ?? 0} décisions</T>
          </Surface>
        ))}
      </Row>
      {types.length > 0 && (
        <Group title="Par type de décision">
          {types.map(([k, v], i) => (
            <SettingRow key={k} title={k} subtitle={`${v.n} décision${v.n > 1 ? "s" : ""}`} right={<Text style={[type.number, { color: v.ok / v.n >= 0.7 ? color.success : color.warning }]}>{Math.round((v.ok / v.n) * 100)} %</Text>} last={i === types.length - 1} />
          ))}
        </Group>
      )}
      {store.history.length > 0 && (
        <Group title="Dernières sessions">
          {store.history.slice(0, 6).map((h, i) => (
            <SettingRow key={i} icon={h.module === "gto" ? "git-branch-outline" : "locate-outline"} title={h.module === "gto" ? "Décisions" : "Positions"} subtitle={new Date(h.at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} right={<T v="callout">{h.correct}/{h.total}</T>} last={i === Math.min(5, store.history.length - 1)} />
          ))}
        </Group>
      )}
      {store.errors.length > 0 && <Button kind="secondary" icon="refresh" title={`Revoir mes ${store.errors.length} erreur${store.errors.length > 1 ? "s" : ""}`} onPress={() => setMode("gto")} />}
    </Screen>
  );
}

const st = StyleSheet.create({
  miniRail: { position: "absolute", borderRadius: 200, padding: 6, backgroundColor: "#141416" },
  miniSeat: { position: "absolute", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  miniSeatText: { fontFamily: font.semibold, fontSize: 11.5, color: color.text },
  miniDealer: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#FBF3E2", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: color.gold },
  miniDealerText: { fontFamily: font.black, fontSize: 9, color: "#1A1206" },
  choice: { minHeight: 52, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: color.surface },
  chip: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: font.medium, fontSize: 11.5, color: "#D6E3DC" },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.faint },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: color.surface },
  source: { alignItems: "flex-start", padding: space.md, borderRadius: radius.md, backgroundColor: color.surface },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: color.surface3, overflow: "visible" },
  barFill: { height: 8, borderRadius: 4 },
  barMark: { position: "absolute", top: -3, width: 2, height: 14, backgroundColor: color.text, opacity: 0.6 },
  chart: { alignSelf: "center", borderRadius: 8, overflow: "hidden" },
  cell: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: color.bg },
  cellText: { fontFamily: font.semibold, fontSize: 7.5, color: color.textSoft },
  modIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: color.goldTint, alignItems: "center", justifyContent: "center" },
});
