import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Game, Hand, Player, PublicLook } from "../types";
import { color, font, radius, shadow, space, type } from "../theme";
import { useSettings } from "../settings";
import { haptic, sound } from "../feedback";
import { Avatar, Confirm, Icon, Row, T, Tap, type Look } from "../ui";
import { Chip, ChipStack, PlayingCard, SUIT, type BackLook, type ChipLook, type FaceLook } from "./cards";
import { handLabel, winningCards } from "./evaluate";

type Looks = { table: Record<string, any>; face: FaceLook; chips: ChipLook; resolve: (id?: string) => Record<string, any> | undefined };
const ACTION_LABEL: Record<string, string> = { fold: "Passe", check: "Parole", call: "Suit", SB: "SB", BB: "BB" };
const actionLabel = (a?: string) => (!a ? "" : a.startsWith("Relance") ? "Relance" : (ACTION_LABEL[a] ?? a));

/** Horloge synchronisée sur le serveur, rafraîchie localement. */
function useServerNow(serverNow: number | undefined, every = 250) {
  const offset = useRef(0);
  useEffect(() => {
    if (serverNow) offset.current = serverNow - Date.now();
  }, [serverNow]);
  const [now, setNow] = useState(Date.now() + offset.current);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

function Slider({ min, max, value, change }: { min: number; max: number; value: number; change: (n: number) => void }) {
  const width = useRef(1);
  const current = useRef({ min, max, change });
  current.current = { min, max, change };
  const set = (x: number) => {
    const p = current.current;
    p.change(Math.round(p.min + Math.max(0, Math.min(1, x / width.current)) * (p.max - p.min)));
  };
  const responder = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: (e) => set(e.nativeEvent.locationX), onPanResponderMove: (e) => set(e.nativeEvent.locationX), onPanResponderTerminationRequest: () => false })).current;
  const pct = max === min ? 100 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  if (Platform.OS === "web")
    return React.createElement("input", { type: "range", "aria-label": "Montant total de la mise", min, max, value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => change(Number(e.target.value)), style: { width: "100%", minHeight: 44, accentColor: color.gold } });
  return (
    <View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Montant total de la mise" accessibilityValue={{ min, max, now: value }} accessibilityActions={[{ name: "increment" }, { name: "decrement" }]} onAccessibilityAction={(e) => change(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === "increment" ? 1 : -1) * Math.max(1, Math.round((max - min) / 20)))))} onLayout={(e) => (width.current = e.nativeEvent.layout.width)} style={{ height: 44, justifyContent: "center" }}>
      <View style={{ height: 6, backgroundColor: color.surface3, borderRadius: 3 }}>
        <LinearGradient colors={[color.goldDeep, color.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 6, width: `${pct}%`, borderRadius: 3 }} />
      </View>
      <View pointerEvents="none" style={[{ position: "absolute", left: `${pct}%`, marginLeft: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: "#FBF3E2", borderWidth: 3, borderColor: color.gold }, shadow(1)]} />
    </View>
  );
}

/** Jeton qui vole d'un point à un autre (mise → pot, pot → gagnant). */
function Flight({ from, to, delay = 0, look, onDone }: { from: { x: number; y: number }; to: { x: number; y: number }; delay?: number; look?: ChipLook; onDone?: () => void }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(p, { toValue: 1, duration: 520, delay, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => onDone?.());
  }, [p, delay, onDone]);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: from.x - 9, top: from.y - 9, zIndex: 30, opacity: p.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }), transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, to.x - from.x] }) }, { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, to.y - from.y] }) }] }}>
      <Chip size={18} look={look} />
    </Animated.View>
  );
}

/** Effet de victoire public, identique pour toute la table (dérivé de l'état serveur). */
function WinEffect({ kind, tint, size }: { kind?: string; tint?: string; size: number }) {
  const { reduceMotion } = useSettings();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return a.setValue(1);
    Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(a, { toValue: 0.35, duration: 900, useNativeDriver: true })]), { iterations: 3 }).start();
  }, [a, reduceMotion]);
  const c = tint ?? color.gold;
  if (kind === "confetti" && !reduceMotion)
    return (
      <View pointerEvents="none" style={{ position: "absolute", width: size * 2.4, height: size * 2.6, top: -size * 0.9, left: -size * 0.7 }}>
        {Array.from({ length: 14 }, (_, i) => <Confetto key={i} i={i} w={size * 2.4} />)}
      </View>
    );
  const scale = kind === "nova" ? a.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.9] }) : a.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.15] });
  return <Animated.View pointerEvents="none" style={{ position: "absolute", width: size + 14, height: size + 14, borderRadius: size, borderWidth: kind === "nova" ? 3 : 2, borderColor: c, opacity: kind === "nova" ? a.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }) : a, transform: [{ scale }] }} />;
}
const CONFETTI = ["#F1CC86", "#7D8BFF", "#F07D7D", "#5FC89A", "#FFFFFF"];
function Confetto({ i, w }: { i: number; w: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 1, duration: 1400 + (i % 5) * 160, delay: (i % 7) * 60, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [y, i]);
  return <Animated.View style={{ position: "absolute", left: ((i * 37) % 100) / 100 * w, top: 0, width: 5, height: 9, backgroundColor: CONFETTI[i % 5], opacity: y.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 90] }) }, { rotate: y.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${(i % 2 ? 1 : -1) * 280}deg`] }) }] }} />;
}

function Banner({ text, tone = "gold" }: { text: string; tone?: "gold" | "accent" | "danger" }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }), Animated.delay(1800), Animated.timing(a, { toValue: 0, duration: 260, useNativeDriver: true })]).start();
  }, [a, text]);
  const c = tone === "gold" ? color.gold : tone === "accent" ? color.accent : color.danger;
  return (
    <Animated.View pointerEvents="none" style={[st.banner, { borderColor: c + "66", opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <Text style={[type.eyebrow, { color: c, fontSize: 12 }]}>{text}</Text>
    </Animated.View>
  );
}

/** River : révélation interactive (maintenir pour soulever le coin). Le timing reste celui du serveur. */
function RiverReveal({ deadline, serverNow, size, code, interactive }: { deadline: number; serverNow?: number; size: number; code?: string; interactive: boolean }) {
  const now = useServerNow(serverNow, 100);
  const peel = useRef(new Animated.Value(0)).current;
  const [holding, hold] = useState(false);
  const animate = (down: boolean) => {
    hold(down);
    if (down) haptic("tap");
    Animated.timing(peel, { toValue: down ? 1 : 0, duration: down ? 1200 : 220, useNativeDriver: true }).start();
  };
  return (
    <View style={st.shade}>
      <T v="eyebrow">La river</T>
      <Pressable disabled={!interactive || !!code} accessibilityRole="button" accessibilityLabel="Maintenir pour soulever le coin de la river" onPressIn={() => animate(true)} onPressOut={() => animate(false)} style={{ marginVertical: 18 }}>
        {code ? (
          <PlayingCard code={code} size={size} />
        ) : (
          <View style={{ width: size, height: size * 1.4, borderRadius: size * 0.12, overflow: "hidden" }}>
            <PlayingCard size={size} />
            <Animated.View pointerEvents="none" style={{ position: "absolute", right: -size * 0.14, top: -size * 0.14, width: size * 0.6, height: size * 0.6, backgroundColor: "#FBF8F1", borderBottomLeftRadius: size * 0.5, transform: [{ translateX: peel.interpolate({ inputRange: [0, 1], outputRange: [size * 0.62, 0] }) }, { rotate: "-12deg" }] }} />
          </View>
        )}
      </Pressable>
      <T v="callout">{code ? "La river est dévoilée" : interactive ? (holding ? "Gardez le doigt appuyé…" : "Maintenez pour soulever le coin") : "Révélation de la river…"}</T>
      <T v="caption" style={{ marginTop: 6 }}>Révélation commune · {Math.max(0, (deadline - now) / 1000).toFixed(1)} s</T>
    </View>
  );
}

function TimerBar({ deadline, total, serverNow, compact }: { deadline: number; total: number; serverNow?: number; compact?: boolean }) {
  const now = useServerNow(serverNow, 200);
  const left = Math.max(0, (deadline - now) / 1000);
  const ratio = Math.min(1, left / total);
  const urgent = left < 6;
  useEffect(() => {
    if (Math.ceil(left) === 5 && !compact) haptic("warning");
  }, [Math.ceil(left) === 5]); // eslint-disable-line react-hooks/exhaustive-deps
  return compact ? (
    <View style={{ height: 3, width: "100%", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
      <View style={{ height: 3, width: `${ratio * 100}%`, backgroundColor: urgent ? color.danger : color.gold }} />
    </View>
  ) : (
    <Row gap={10}>
      <View style={{ flex: 1, height: 4, backgroundColor: color.surface3, borderRadius: 2, overflow: "hidden" }}>
        <View style={{ height: 4, width: `${ratio * 100}%`, backgroundColor: urgent ? color.danger : color.gold }} />
      </View>
      <Text style={[type.number, { fontSize: 13, color: urgent ? color.danger : color.gold, minWidth: 30, textAlign: "right" }]}>{Math.ceil(left)} s</Text>
    </Row>
  );
}

export function PokerTable({ game, userId, busy, play, looks, onLeave }: { game: Game; userId: string; busy: boolean; play: (type: string, amount?: number) => Promise<void>; looks: Looks; onLeave: () => void }) {
  const { prefs, set, reduceMotion } = useSettings();
  const window = useWindowDimensions();
  const own = Math.max(0, game.tables.findIndex((t) => t.players.includes(userId)));
  const [selected, select] = useState<number | null>(null);
  const table = game.tables[selected ?? own] ?? game.tables[own];
  const h = table?.hand as Hand | null;
  const [area, setArea] = useState({ w: Math.min(window.width, 940), h: 420 });
  const [history, showHistory] = useState(false);
  const [raiseOpen, openRaise] = useState(false);
  const [raise, setRaise] = useState("0");
  const [confirmAllIn, setConfirmAllIn] = useState<number | null>(null);
  const [pre, setPre] = useState<null | "checkFold" | "check">(null);
  const [banner, setBanner] = useState<{ text: string; tone?: "gold" | "accent" | "danger"; key: number } | null>(null);
  const [flights, setFlights] = useState<{ key: string; from: { x: number; y: number }; to: { x: number; y: number }; delay: number }[]>([]);
  const legal = h?.legal ?? null;
  const me = h?.players.find((p) => p.id === userId);
  const looksOf = (id: string): PublicLook | undefined => game.cosmetics?.[id];

  // Géométrie : ellipse proportionnée à la zone disponible.
  const W = area.w, H = area.h;
  const cx = W / 2, cy = H * 0.47;
  const feltW = Math.min(W - 24, H * 1.1), feltH = Math.min(H * 0.86, W * 1.35);
  const seatRx = Math.min(W / 2 - 42, feltW / 2 + 6), seatRy = feltH / 2 - 4;
  // Répartition uniforme : le héros en bas, les autres dans l'ordre des sièges (sens horaire).
  const rel = (p: Player) => (me ? (p.seat - me.seat + 8) % 8 : p.seat);
  const ordered = h ? [...h.players].sort((x, y) => rel(x) - rel(y)) : [];
  const seatPos = (p: Player) => {
    const n = Math.max(1, ordered.length);
    const k = Math.max(0, ordered.findIndex((q) => q.id === p.id));
    const a = Math.PI / 2 + (k * 2 * Math.PI) / n + (me ? 0 : Math.PI / n);
    const r = Math.round((k * 8) / n) % 8;
    return { x: cx + seatRx * Math.cos(a), y: cy + seatRy * Math.sin(a), r };
  };
  const toward = (p: { x: number; y: number }, k: number) => ({ x: p.x + (cx - p.x) * k, y: p.y + (cy - p.y) * k });
  const center = { x: cx, y: cy - 6 };

  // Bascule de main : réinitialisation des contrôles, bannières de blindes.
  const lastBB = useRef<number | null>(null);
  const lastHandId = useRef<number | null>(null);
  useEffect(() => {
    openRaise(false);
    showHistory(false);
  }, [table?.id, h?.id]);
  useEffect(() => {
    if (!h) return;
    if (lastHandId.current !== h.id) {
      if (lastBB.current !== null && h.bb !== lastBB.current) setBanner({ text: `Blindes ${h.sb.toLocaleString("fr-FR")} / ${h.bb.toLocaleString("fr-FR")}`, tone: "accent", key: Date.now() });
      lastBB.current = h.bb;
      lastHandId.current = h.id;
      setPre(null);
    }
  }, [h?.id, h?.bb, h?.sb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setRaise(String(Math.min(legal?.minTo ?? 0, legal?.maxTo ?? 0)));
  }, [legal?.minTo, legal?.maxTo, h?.turn]);

  // Mises : son + vol de jeton du siège vers la zone de mise.
  const lastBets = useRef(new Map<string, number>());
  const lastStage = useRef<string | null>(null);
  useEffect(() => {
    if (!h) return;
    const newFlights: typeof flights = [];
    for (const p of h.players) {
      const prev = lastBets.current.get(p.id) ?? 0;
      const bet = p.bet ?? 0;
      const pos = seatPos(p);
      if (bet > prev && !reduceMotion) newFlights.push({ key: `${h.id}-${p.id}-${bet}`, from: pos, to: toward(pos, 0.42), delay: 0 });
      if (bet < prev && !reduceMotion) newFlights.push({ key: `${h.id}-${p.id}-collect-${prev}`, from: toward(pos, 0.42), to: center, delay: 80 });
      lastBets.current.set(p.id, bet);
    }
    if (h.stage === "done" && lastStage.current !== "done") {
      const winners = new Set(h.pots.flatMap((pot) => pot.winners));
      h.players.filter((p) => winners.has(p.id)).forEach((p, i) => {
        if (!reduceMotion) for (let k = 0; k < 3; k++) newFlights.push({ key: `${h.id}-win-${p.id}-${k}`, from: center, to: seatPos(p), delay: 150 + i * 120 + k * 70 });
      });
      if (winners.has(userId)) sound("win"), haptic("success");
      if (h.bonus.length) setBanner({ text: `Prime 7/2 · ${h.bonus.reduce((n, b) => n + b.amount, 0).toLocaleString("fr-FR")}`, key: Date.now() });
    }
    lastStage.current = h.stage;
    if (newFlights.length) {
      sound("chip");
      setFlights((f) => [...f.slice(-24), ...newFlights]);
    }
  }, [h?.players.map((p) => p.bet).join(","), h?.stage, h?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mon tour : alerte discrète + exécution d'une préaction légale.
  const wasMyTurn = useRef(false);
  const maxBet = h ? Math.max(...h.players.map((p) => p.bet ?? 0)) : 0;
  const lastMax = useRef(maxBet);
  useEffect(() => {
    if (maxBet > lastMax.current && pre === "check") setPre(null);
    lastMax.current = maxBet;
  }, [maxBet, pre]);
  useEffect(() => {
    const mine = !!legal;
    if (mine && !wasMyTurn.current) {
      if (pre && prefs.preactions) {
        const p = pre;
        setPre(null);
        if (p === "checkFold") void play(legal!.canCheck ? "check" : "fold");
        else if (p === "check" && legal!.canCheck) void play("check");
        else {
          sound("alert");
          haptic("heavy");
        }
      } else {
        sound("alert");
        haptic("heavy");
      }
    }
    wasMyTurn.current = mine;
  }, [!!legal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!h || !table) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><T v="body">Préparation des tables…</T></View>;
  const bbOf = h.bb;
  const money = (n: number, unit = prefs.stackUnit) => (unit === "bb" ? `${(n / bbOf).toFixed(n % bbOf ? 1 : 0)} BB` : n.toLocaleString("fr-FR"));
  const pot = h.stage === "done" ? h.pots.reduce((n, p) => n + p.amount, 0) : h.players.reduce((n, p) => n + (p.total ?? 0), 0);
  const settledPot = pot - h.players.reduce((n, p) => n + (p.bet ?? 0), 0);
  const min = Math.min(legal?.minTo ?? 0, legal?.maxTo ?? 0), max = legal?.maxTo ?? 0;
  const amount = Number(raise);
  const valid = Number.isSafeInteger(amount) && amount >= min && amount <= max;
  const myBet = me?.bet ?? 0;
  const currentBet = myBet + (legal?.call ?? 0);
  const winners = new Set(h.stage === "done" ? h.pots.flatMap((p) => p.winners) : []);
  const odds = prefs.showEquity ? (h.allIn?.streets?.at(-1)?.odds ?? h.allIn?.odds ?? []) : [];
  const boardSize = Math.max(30, Math.min(54, (feltW * 0.8) / 5.5));
  const seatSize = W < 360 ? 36 : 42;
  const myLabel = me?.cards?.length ? handLabel(me.cards, h.board) : null;
  const highlightCards = h.stage === "done" && me?.cards?.length && winners.has(userId) && h.board.length >= 3 ? winningCards(me.cards, h.board) : [];
  const tableLook = looks.table;

  const presets: { label: string; to: number }[] = (() => {
    if (!legal?.canRaise) return [];
    const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));
    const preflop = h.stage === "preflop" && h.board.length === 0;
    if (prefs.presetStyle === "smart" && preflop) {
      const unopened = currentBet <= h.bb;
      return unopened
        ? [{ label: "2 BB", to: clamp(2 * h.bb) }, { label: "2,5 BB", to: clamp(2.5 * h.bb) }, { label: "3 BB", to: clamp(3 * h.bb) }]
        : [{ label: "×2,5", to: clamp(currentBet * 2.5) }, { label: "×3", to: clamp(currentBet * 3) }];
    }
    const f = (k: number) => clamp(currentBet + k * (pot + (legal?.call ?? 0)));
    return [{ label: "⅓", to: f(1 / 3) }, { label: "½", to: f(0.5) }, { label: "¾", to: f(0.75) }, { label: "Pot", to: f(1) }];
  })();

  const act = (t: string, n?: number) => {
    showHistory(false);
    haptic(t === "fold" ? "tap" : "select");
    if (t === "raise" && n !== undefined && prefs.confirmAllIn && n >= max) return setConfirmAllIn(n);
    if (t === "raise" && n !== undefined && prefs.confirmLargeBet && me && n - myBet > (me.stack + myBet) * 0.5 && n < max) return setConfirmAllIn(n);
    void play(t, n);
  };
  const historyLines = [
    ...game.events.map((e) => `${new Date(e.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · ${e.text}`),
    ...h.log.map((l) => l.replace(/ · (fold|check|call)$/, (_, a) => " · " + actionLabel(a))),
    ...h.pots.map((p, i) => `Pot ${i + 1} · ${money(p.amount, prefs.potUnit)} → ${p.ghost ? "Ghost" : p.winners.map((id) => h.players.find((q) => q.id === id)?.name).join(" / ")}`),
    ...h.bonus.map((b) => `Prime 7/2 · ${h.players.find((p) => p.id === b.from)?.name} → ${h.players.find((p) => p.id === b.to)?.name} · ${money(b.amount)}`),
  ];

  return (
    <View style={{ flex: 1, width: "100%", maxWidth: 940, alignSelf: "center" }}>
      {/* Barre supérieure : quitter, tables, historique, unités */}
      <Row style={st.topbar} gap={6}>
        <Tap onPress={onLeave} label="Quitter la vue de table" style={st.topBtn}><Icon name="chevron-back" size={20} /></Tap>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: "center" }} style={{ flex: 1 }}>
          <View style={st.levelPill}>
            <Text style={st.levelText}>{h.sb.toLocaleString("fr-FR")}/{h.bb.toLocaleString("fr-FR")}</Text>
            <Text style={[st.levelText, { color: color.muted }]}>#{h.id}</Text>
          </View>
          {game.tables.length > 1 && game.tables.map((t, i) => (
            <Tap key={t.id} onPress={() => select(i)} feedback="select" label={`Table ${i + 1}`} style={[st.tablePill, t.id === table.id && { backgroundColor: color.surface3, borderColor: color.hairlineStrong }]}>
              <Text style={{ fontFamily: font.medium, fontSize: 12, color: t.id === table.id ? color.text : color.muted }}>T{i + 1}{i === own ? " · vous" : ""} · {t.players.length}</Text>
            </Tap>
          ))}
        </ScrollView>
        <Tap onPress={() => set("stackUnit", prefs.stackUnit === "bb" ? "chips" : "bb")} label="Basculer jetons / BB" style={st.topBtn}><Text style={{ fontFamily: font.semibold, fontSize: 12, color: color.textSoft }}>{prefs.stackUnit === "bb" ? "BB" : "123"}</Text></Tap>
        <Tap onPress={() => showHistory(true)} label="Historique des actions" style={st.topBtn}><Icon name="list" size={19} tint={color.textSoft} /></Tap>
      </Row>

      {/* Table */}
      <View style={{ flex: 1, minHeight: 300 }} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {prefs.ambientGlow && <View pointerEvents="none" style={[st.glow, { left: cx - feltW * 0.6, top: cy - feltH * 0.6, width: feltW * 1.2, height: feltH * 1.2, borderRadius: feltW, backgroundColor: (tableLook.glow as string) ?? (tableLook.felt as string) ?? color.felt }]} />}
        <View style={[st.rail, { left: cx - feltW / 2, top: cy - feltH / 2, width: feltW, height: feltH, borderRadius: feltW / 2, backgroundColor: (tableLook.rail as string) ?? "#141416" }]}>
          <LinearGradient colors={[(tableLook.felt as string) ?? color.felt, (tableLook.felt2 as string) ?? "#0A221C"]} start={{ x: 0.5, y: 0.25 }} end={{ x: 0.5, y: 1 }} style={[st.felt, { borderRadius: feltW / 2 }]}>
            <View style={[st.feltLine, { borderRadius: feltW / 2, borderColor: ((tableLook.line as string) ?? color.gold) + "55" }]} />
            {tableLook.double && <View style={[st.feltLine, { top: 22, left: 22, right: 22, bottom: 22, borderRadius: feltW / 2, borderColor: ((tableLook.line as string) ?? color.gold) + "33" }]} />}
            <Text style={[st.watermark, { color: ((tableLook.line as string) ?? color.gold) + "22", top: feltH * 0.66 }]}>STACKORA</Text>
          </LinearGradient>
        </View>

        {/* Centre : pot + board */}
        <View pointerEvents="none" style={[st.center, { top: cy - boardSize * 1.4 / 2 - 42, width: feltW * 0.9, left: cx - feltW * 0.45 }]}>
          <Row gap={6} style={st.potPill}>
            <Chip size={14} look={looks.chips} />
            <Text style={[type.number, { fontSize: 15 }]}>{money(h.stage === "done" ? pot : Math.max(pot, 0), prefs.potUnit)}</Text>
            {h.stage !== "done" && settledPot !== pot && settledPot > 0 && <Text style={[type.caption, { fontSize: 11 }]}>· {money(settledPot, prefs.potUnit)} au centre</Text>}
          </Row>
          <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            {Array.from({ length: Math.max(5, h.board.length) }, (_, i) => h.board[i] ? (
              <PlayingCard key={`${table.id}-${h.id}-b${i}`} code={h.board[i]} size={h.board.length > 5 ? boardSize * 0.78 : boardSize} face={looks.face} highlight={highlightCards.includes(h.board[i])} dim={h.stage === "done" && highlightCards.length > 0 && !highlightCards.includes(h.board[i])} />
            ) : (
              <View key={`slot-${i}`} style={[st.slot, { width: boardSize, height: boardSize * 1.4, borderRadius: boardSize * 0.12 }]} />
            ))}
          </View>
          {h.stage === "runout" && <Text style={[type.eyebrow, { marginTop: 8, fontSize: 10 }]}>{game.variant === "redRiver" ? "Tapis payé · équité Hold'em 5 cartes" : "Tapis payé · équité exacte"}</Text>}
          {game.variant === "ghost" && (
            <Row gap={6} style={{ marginTop: 6 }}>
              <Text style={[type.caption, { color: "#B9B4FF" }]}>◈ Ghost pot · {money(h.ghostPot, prefs.potUnit)}</Text>
              {h.ghostCards.map((c) => <PlayingCard key={c} code={c} size={22} face={looks.face} />)}
            </Row>
          )}
        </View>

        {/* Sièges */}
        {h.players.map((p) => {
          const pos = seatPos(p);
          const isMe = p.id === userId;
          const active = p.id === h.turn && h.stage !== "done";
          const won = winners.has(p.id);
          const look = looksOf(p.id);
          const avatarLook = looks.resolve(look?.avatar) as Look | undefined;
          const frameLook = looks.resolve(look?.frame) as Look | undefined;
          const badgeLook = looks.resolve(look?.badge) as Look | undefined;
          const backLook = looks.resolve(look?.cardBack) as BackLook | undefined;
          const winLook = looks.resolve(look?.winFx);
          const equity = odds.find((o) => o.id === p.id);
          const allIn = p.stack === 0 && !p.folded && h.stage !== "done";
          const eliminated = h.stage === "done" && p.stack === 0;
          const shown = !isMe && p.cards && p.cards.length > 0;
          const bet = p.bet ?? 0;
          const betPos = toward(pos, pos.r === 4 || pos.r === 0 ? 0.5 : 0.42);
          const dealer = h.button === p.seat;
          const dPos = toward({ x: pos.x + (pos.x < cx ? 16 : -16), y: pos.y + (pos.y < cy ? 14 : -14) }, 0.24);
          return (
            <React.Fragment key={p.id}>
              {prefs.showBets && bet > 0 && h.stage !== "done" && (
                <View pointerEvents="none" style={[st.bet, { left: betPos.x - 40, top: betPos.y - 11 }]}>
                  <ChipStack amount={bet} bb={h.bb} size={14} look={looks.chips} />
                  <Text style={[type.number, { fontSize: 11.5 }]}>{money(bet)}</Text>
                </View>
              )}
              {dealer && <View pointerEvents="none" accessibilityLabel="Bouton dealer" style={[st.dealer, { left: dPos.x - 10, top: dPos.y - 10 }]}><Text style={st.dealerText}>D</Text></View>}
              <View style={[st.seat, { left: pos.x - 46, top: pos.y - (isMe ? 40 : 34), opacity: p.folded ? 0.42 : 1 }]} accessibilityLabel={`${isMe ? "Vous" : p.name}, ${money(p.stack)}${p.folded ? ", couché" : ""}${active ? ", à la parole" : ""}`}>
                {/* Cartes adverses (fermées avec le dos public du joueur, ou révélées) */}
                {!isMe && !p.folded && (
                  <View style={[st.seatCards, shown && (pos.y < cy - seatRy * 0.6 ? { top: 2, right: undefined, left: -48 } : { top: -seatSize * 0.95 })]}>
                    {(shown ? p.cards! : ["", ""]).map((c, i) => (
                      <PlayingCard key={`${h.id}-${p.id}-${i}`} code={c || undefined} size={shown ? 30 : 20} back={backLook} face={looks.face} dealFrom={!shown ? { x: cx - pos.x, y: cy - pos.y } : undefined} delay={(pos.r * 2 + i) * 40} silent={i > 0 || pos.r > 0} style={{ marginLeft: i ? -6 : 0, transform: [{ rotate: i ? "6deg" : "-6deg" }] }} />
                    ))}
                  </View>
                )}
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  {won && <WinEffect kind={(winLook?.kind as string) ?? "halo"} tint={winLook?.color as string} size={seatSize} />}
                  {active && prefs.highlightActive && <View style={[st.activeRing, { width: seatSize + 8, height: seatSize + 8, borderRadius: seatSize }]} />}
                  <Avatar name={p.name} size={seatSize} look={avatarLook} frame={frameLook} badge={badgeLook} ring={won ? color.gold : undefined} />
                </View>
                <View style={[st.plate, active && prefs.highlightActive && { borderColor: color.gold + "AA" }, won && { borderColor: color.gold, backgroundColor: "#2A2215" }]}>
                  <Text numberOfLines={1} style={st.plateName}>{isMe ? "Vous" : p.name}</Text>
                  <Text style={[st.plateStack, allIn && { color: color.danger }]}>{allIn ? "TAPIS" : money(p.stack)}</Text>
                  {active && prefs.showTimer && <TimerBar compact deadline={table.deadline} total={game.decisionSeconds} serverNow={game.serverNow} />}
                </View>
                {equity && !p.folded ? (
                  <Text style={st.equity}>{equity.percent.toFixed(1)} %</Text>
                ) : eliminated ? (
                  <Text style={[st.tag, { color: color.danger, backgroundColor: color.dangerTint }]}>ÉLIMINÉ</Text>
                ) : p.lastAction && !active && h.stage !== "done" ? (
                  <Text style={st.tag}>{actionLabel(p.lastAction)}</Text>
                ) : null}
              </View>
            </React.Fragment>
          );
        })}
        {flights.map((f) => <Flight key={f.key} from={f.from} to={f.to} delay={f.delay} look={looks.chips} onDone={() => setFlights((all) => all.filter((x) => x.key !== f.key))} />)}
        {banner && <View pointerEvents="none" style={{ position: "absolute", top: cy - feltH / 2 + 40, left: 0, right: 0, alignItems: "center" }}><Banner key={banner.key} text={banner.text} tone={banner.tone} /></View>}
      </View>

      {/* Main du héros : toujours lisible, jamais recouverte */}
      {me && (
        <View style={st.hero}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {(me.cards?.length ? me.cards : ["", ""]).map((c, i) => (
              <PlayingCard key={`${h.id}-me-${i}`} code={c || undefined} size={window.height < 700 ? 50 : 60} face={looks.face} back={looks.resolve(looksOf(userId)?.cardBack) as BackLook} highlight={highlightCards.includes(c)} dim={me.folded} dealFrom={{ x: 0, y: -160 }} delay={i * 90} style={{ transform: [{ rotate: i ? "4deg" : "-4deg" }] }} />
            ))}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T v="caption" numberOfLines={1}>{me.folded ? "Vous êtes couché" : (myLabel ?? (h.stage === "done" ? "Main terminée" : "Votre main"))}</T>
            <Text style={[type.number, { fontSize: 22 }]}>{money(me.stack)}</Text>
            {h.revealed?.includes(userId) && <Text style={[type.eyebrow, { fontSize: 10 }]}>7/2 révélé automatiquement</Text>}
          </View>
        </View>
      )}

      {/* Dock de décision */}
      <View style={st.dock}>
        {legal ? (
          <>
            {prefs.showTimer && <TimerBar deadline={table.deadline} total={game.decisionSeconds} serverNow={game.serverNow} />}
            {raiseOpen && legal.canRaise && (
              <View style={st.raise}>
                <Row gap={10}>
                  <View style={{ flex: 1 }}>
                    <T v="caption">Total · à ajouter {money(Math.max(0, (valid ? amount : min) - myBet))}</T>
                    <T v="caption" style={{ fontSize: 11.5 }}>de {money(min)} à {money(max)}</T>
                  </View>
                  <TextInput accessibilityLabel="Montant total" keyboardType="number-pad" value={raise} onChangeText={setRaise} style={[st.raiseInput, !valid && { borderColor: color.danger }]} />
                  <Tap onPress={() => openRaise(false)} label="Annuler la mise" style={st.raiseClose}><Icon name="close" size={18} tint={color.textSoft} /></Tap>
                </Row>
                {prefs.showSlider && <Slider min={min} max={max} value={valid ? amount : min} change={(n) => setRaise(String(n))} />}
                <Row gap={6}>
                  {presets.map((p) => (
                    <Tap key={p.label} feedback="select" label={`Mise ${p.label}`} onPress={() => setRaise(String(p.to))} style={[st.preset, amount === p.to && { borderColor: color.gold, backgroundColor: color.goldTint }]}>
                      <Text style={st.presetText}>{p.label}</Text>
                    </Tap>
                  ))}
                  <Tap feedback="select" label="Tapis" onPress={() => setRaise(String(max))} style={[st.preset, amount === max && { borderColor: color.danger, backgroundColor: color.dangerTint }]}>
                    <Text style={[st.presetText, { color: color.danger }]}>Tapis</Text>
                  </Tap>
                </Row>
              </View>
            )}
            <Row gap={8}>
              <ActionButton label="Passer" onPress={() => act("fold")} disabled={busy} kind="fold" />
              <ActionButton label={legal.canCheck ? "Parole" : `Suivre ${money(legal.call)}`} onPress={() => act(legal.canCheck ? "check" : "call")} disabled={busy} kind="call" />
              {legal.canRaise && (raiseOpen ? (
                <ActionButton label={valid && amount >= max ? "Tapis !" : `${legal.canCheck && !myBet ? "Miser" : "Relancer"} ${money(valid ? amount : min)}`} onPress={() => { if (!valid) return; openRaise(false); act("raise", amount); }} disabled={busy || !valid} kind="raise" />
              ) : (
                <ActionButton label={legal.canCheck && !myBet ? "Miser" : "Relancer"} onPress={() => openRaise(true)} disabled={busy} kind="raise" />
              ))}
            </Row>
          </>
        ) : h.stage === "done" ? (
          <View style={{ gap: 4, alignItems: "center", paddingVertical: 6 }}>
            <Text style={[type.eyebrow, { fontSize: 12 }]}>{h.bonus.length ? `★ Prime 7/2 · ${money(h.bonus.reduce((n, b) => n + b.amount, 0))}` : h.revealed?.length ? "7/2 · main révélée" : winners.has(userId) ? "Vous remportez le pot" : "Main terminée"}</Text>
            <T v="caption" numberOfLines={2} center>{h.pots.map((p) => `${money(p.amount, prefs.potUnit)} → ${p.ghost ? "Ghost" : p.winners.map((id) => (id === userId ? "vous" : h.players.find((q) => q.id === id)?.name)).join(" / ")}`).join(" · ")}</T>
          </View>
        ) : me && !me.folded && h.stage !== "runout" && prefs.preactions ? (
          <View style={{ gap: 8 }}>
            <T v="caption" center>{h.players.find((p) => p.id === h.turn)?.name ?? "La table"} réfléchit…</T>
            <Row gap={8}>
              <PreButton label="Parole / Passe" on={pre === "checkFold"} onPress={() => setPre(pre === "checkFold" ? null : "checkFold")} />
              <PreButton label="Parole" on={pre === "check"} onPress={() => setPre(pre === "check" ? null : "check")} />
            </Row>
          </View>
        ) : (
          <T v="caption" center style={{ paddingVertical: 12 }}>{h.stage === "runout" ? "Les cartes décident · révélation synchronisée" : `${h.players.find((p) => p.id === h.turn)?.name ?? "La table"} réfléchit…`}</T>
        )}
      </View>

      {history && <HistoryDrawer lines={historyLines} close={() => showHistory(false)} />}
      {h.presentation?.river && h.presentation.nextAt && (
        <RiverReveal key={`${h.id}-${h.presentation.count}`} deadline={h.presentation.nextAt} serverNow={game.serverNow} interactive={prefs.riverPeel} size={Math.min(window.width * 0.62, (window.height - 260) * 0.6, 300)} />
      )}
      <Confirm
        visible={confirmAllIn !== null}
        title={confirmAllIn !== null && confirmAllIn >= max ? "Tapis ?" : "Grosse mise"}
        body={confirmAllIn !== null ? `Vous misez ${money(confirmAllIn)} au total${confirmAllIn >= max ? ", soit tout votre tapis" : ""}.` : ""}
        confirm="Confirmer"
        onCancel={() => setConfirmAllIn(null)}
        onConfirm={() => {
          const n = confirmAllIn!;
          setConfirmAllIn(null);
          haptic("heavy");
          void play("raise", n);
        }}
      />
    </View>
  );
}

function ActionButton({ label, onPress, disabled, kind }: { label: string; onPress: () => void; disabled?: boolean; kind: "fold" | "call" | "raise" }) {
  const colors: [string, string] = kind === "raise" ? [color.goldBright, "#C0904A"] : kind === "call" ? ["#9AA5FF", "#6573F0"] : [color.surface3, color.surface2];
  return (
    <Tap onPress={onPress} disabled={disabled} label={label} feedback="none" style={{ flex: 1, borderRadius: radius.md, overflow: "hidden" }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[st.action, kind === "fold" && { borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong }]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[st.actionText, { color: kind === "fold" ? color.text : kind === "call" ? "#0B0D1E" : "#1A1206" }]}>{label}</Text>
      </LinearGradient>
    </Tap>
  );
}
function PreButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} feedback="select" label={`Préaction ${label}`} style={[st.pre, on && { borderColor: color.accent, backgroundColor: color.accentTint }]}>
      <View style={[st.check, on && { backgroundColor: color.accent, borderColor: color.accent }]}>{on && <Icon name="checkmark" size={12} tint="#0B0D1E" />}</View>
      <Text style={[type.callout, { fontSize: 13 }]}>{label}</Text>
    </Tap>
  );
}
function HistoryDrawer({ lines, close }: { lines: string[]; close: () => void }) {
  const slide = useRef(new Animated.Value(-340)).current;
  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [slide]);
  return (
    <View style={st.drawerLayer}>
      <Pressable accessibilityLabel="Fermer l'historique" onPress={close} style={StyleSheet.absoluteFill} />
      <Animated.View style={[st.drawer, { transform: [{ translateX: slide }] }]}>
        <Row between style={{ marginBottom: space.sm }}>
          <T v="eyebrow">Historique</T>
          <Tap onPress={close} label="Fermer" style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 6 }}><Icon name="close" size={20} /></Tap>
        </Row>
        <ScrollView>
          {lines.length === 0 && <T v="caption">Aucune action pour l'instant.</T>}
          {lines.map((line, i) => <Text key={i} style={[type.caption, { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.hairline, color: color.textSoft }]}>{line}</Text>)}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  topbar: { height: 50, paddingHorizontal: 8 },
  topBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: color.surface },
  levelPill: { flexDirection: "row", gap: 8, paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: "center", backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  levelText: { fontFamily: font.semibold, fontSize: 12.5, color: color.text, fontVariant: ["tabular-nums"] },
  tablePill: { paddingHorizontal: 11, height: 32, borderRadius: 16, justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "transparent" },
  glow: { position: "absolute", opacity: 0.16 },
  rail: { position: "absolute", padding: 9, ...shadow(3) },
  felt: { flex: 1, overflow: "hidden" },
  feltLine: { position: "absolute", top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1 },
  watermark: { position: "absolute", alignSelf: "center", fontFamily: font.display, fontSize: 20, letterSpacing: 6 },
  center: { position: "absolute", alignItems: "center" },
  potPill: { backgroundColor: "rgba(0,0,0,0.38)", paddingHorizontal: 12, height: 28, borderRadius: 14 },
  slot: { borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(0,0,0,0.1)" },
  seat: { position: "absolute", width: 92, alignItems: "center", zIndex: 5 },
  seatCards: { position: "absolute", top: -14, right: 2, flexDirection: "row", zIndex: 6 },
  activeRing: { position: "absolute", borderWidth: 2, borderColor: color.gold },
  plate: { marginTop: -6, minWidth: 78, maxWidth: 92, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: "rgba(12,13,16,0.92)", borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, alignItems: "center" },
  plateName: { fontFamily: font.medium, fontSize: 11, color: color.textSoft, maxWidth: 80 },
  plateStack: { fontFamily: font.bold, fontSize: 13, color: color.text, fontVariant: ["tabular-nums"] },
  tag: { marginTop: 3, fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.5, color: color.textSoft, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  equity: { marginTop: 3, fontFamily: font.bold, fontSize: 11, color: color.goldBright, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden", fontVariant: ["tabular-nums"] },
  bet: { position: "absolute", width: 80, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, zIndex: 4 },
  dealer: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#FBF3E2", alignItems: "center", justifyContent: "center", zIndex: 4, borderWidth: 1.5, borderColor: color.gold, ...shadow(1) },
  dealerText: { fontFamily: font.black, fontSize: 10, color: "#1A1206" },
  banner: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: "rgba(10,11,13,0.92)", borderWidth: 1 },
  hero: { flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 8 },
  dock: { paddingHorizontal: space.md, paddingTop: 10, paddingBottom: 12, gap: 10, backgroundColor: color.bgRaised, borderTopWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, minHeight: 86 },
  action: { height: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, borderRadius: radius.md },
  actionText: { fontFamily: font.bold, fontSize: 15.5, letterSpacing: -0.2 },
  raiseClose: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: color.surface2 },
  raise: { gap: 6, padding: 12, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  raiseInput: { color: color.text, fontFamily: font.semibold, fontSize: 17, height: 44, width: 110, borderWidth: 1, borderColor: color.hairlineStrong, borderRadius: radius.sm, paddingHorizontal: 10, textAlign: "right", fontVariant: ["tabular-nums"] },
  preset: { flex: 1, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: color.surface2, borderWidth: 1, borderColor: color.hairline },
  presetText: { fontFamily: font.semibold, fontSize: 13.5, color: color.text },
  pre: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", height: 46, borderRadius: radius.md, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: color.surface },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: color.muted, alignItems: "center", justifyContent: "center" },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,6,8,0.92)", zIndex: 40, alignItems: "center", justifyContent: "center" },
  drawerLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: color.overlay, zIndex: 30 },
  drawer: { width: "86%", maxWidth: 360, height: "100%", padding: space.md, paddingTop: space.lg, backgroundColor: color.bgRaised, borderRightWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
});
export { SUIT };
