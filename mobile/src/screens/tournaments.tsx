import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, Share, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, font, radius, space, type } from "../theme";
import { useSettings } from "../settings";
import { haptic, sound } from "../feedback";
import { Avatar, Button, Empty, FadeIn, Field, Group, Icon, Pill, Row, SectionHeader, Segmented, SettingRow, Skeleton, Surface, T, Tap, useToast, type Look } from "../ui";
import { useApp } from "../app-context";
import { VARIANTS } from "../data/rules";
import { PokerTable } from "../poker/PokerTable";
import type { Variant } from "../types";
import { Screen } from "./shell";
import { TournamentRow, variantMeta } from "./home";

async function shareTournament(name: string, code: string) {
  const message = `Rejoins « ${name} » sur STACKORA ! Code : ${code}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const nav = navigator as Navigator & { share?: (d: object) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Invitation STACKORA", text: message, url: window.location.origin });
      } catch {
        /* annulé */
      }
      return "shared";
    }
    await navigator.clipboard?.writeText(`${message} ${window.location.origin}`);
    return "copied";
  }
  await Share.share({ message: `${message}. Ouvre l'application et saisis ce code.` });
  return "shared";
}

export function PlayScreen({ openTournament, join }: { openTournament: (id: string) => void; join: (code: string) => void }) {
  const a = useApp();
  const [filter, setFilter] = useState<"active" | "lobby" | "playing" | "finished">("active");
  const [code, setCode] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    void a.refresh().finally(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const list = a.list.filter((t) => (filter === "active" ? t.status !== "finished" : t.status === filter));
  return (
    <Screen onRefresh={() => { setRefreshing(true); void a.refresh().finally(() => setRefreshing(false)); }} refreshing={refreshing}>
      <View style={{ gap: 6 }}>
        <T v="eyebrow">Tournois</T>
        <T v="title">Vos tables</T>
      </View>
      <Row gap={space.sm}>
        <Button kind="gold" icon="add" title="Créer un tournoi" onPress={() => a.nav.open("create")} style={{ flex: 1 }} />
      </Row>
      <Surface style={{ gap: space.sm }}>
        <T v="headline">Vous avez une invitation ?</T>
        <Row gap={space.sm} style={{ alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field label="Code du tournoi" value={code} onChange={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" mono maxLength={12} placeholder="EX : 4F2A9C1B7D" onSubmit={() => code && join(code)} />
          </View>
          <Button size="lg" kind="primary" title="Rejoindre" onPress={() => join(code)} disabled={!code.trim()} style={{ width: 120 }} />
        </Row>
      </Surface>
      <Row gap={8} wrap>
        {([["active", "À venir & en cours"], ["lobby", "Inscriptions"], ["playing", "En cours"], ["finished", "Terminés"]] as const).map(([v, l]) => (
          <Pill key={v} label={l} active={filter === v} onPress={() => setFilter(v)} />
        ))}
      </Row>
      {!loaded && a.list.length === 0 ? (
        <>
          <Skeleton />
          <Skeleton />
        </>
      ) : list.length === 0 ? (
        <Empty icon={filter === "finished" ? "time-outline" : "trophy-outline"} title={filter === "finished" ? "Pas encore d'historique" : "Aucun tournoi ici"} body={filter === "finished" ? "Vos tournois terminés et vos classements apparaîtront ici." : "Créez un tournoi ou rejoignez celui d'un ami avec son code."} action={filter === "finished" ? undefined : "Créer un tournoi"} onAction={() => a.nav.open("create")} />
      ) : (
        list.map((t) => <TournamentRow key={t.id} t={t} onPress={() => openTournament(t.id)} />)
      )}
    </Screen>
  );
}

const STRUCTURES = [
  { id: "turbo", label: "Turbo", stack: 1500, bb: 50, level: 120, decision: 15, desc: "≈ 20 min · niveaux de 2 min" },
  { id: "standard", label: "Standard", stack: 2000, bb: 50, level: 300, decision: 20, desc: "≈ 45 min · niveaux de 5 min" },
  { id: "deep", label: "Deep", stack: 5000, bb: 50, level: 480, decision: 25, desc: "≈ 1 h 30 · niveaux de 8 min" },
] as const;

export function CreateScreen({ onCreated }: { onCreated: (id: string) => void }) {
  const a = useApp();
  const toast = useToast();
  const [title, setTitle] = useState("La table des amis");
  const [variant, setVariant] = useState<Variant>("classic");
  const [structure, setStructure] = useState<string>("standard");
  const [capacity, setCapacity] = useState("16");
  const [stack, setStack] = useState("2000");
  const [bb, setBB] = useState("50");
  const [duration, setDuration] = useState("300");
  const [decision, setDecision] = useState("20");
  const [advanced, setAdvanced] = useState(false);
  const pick = (id: string) => {
    const s = STRUCTURES.find((x) => x.id === id)!;
    setStructure(id);
    setStack(String(s.stack));
    setBB(String(s.bb));
    setDuration(String(s.level));
    setDecision(String(s.decision));
  };
  const n = (v: string) => Number(v);
  const errors = {
    title: title.trim().length < 3 ? "3 caractères minimum" : undefined,
    capacity: !(n(capacity) >= 2 && n(capacity) <= 32) ? "Entre 2 et 32" : undefined,
    stack: !(n(stack) >= 100 && n(stack) <= 100000) ? "Entre 100 et 100 000" : n(stack) < n(bb) * 2 ? "Au moins 2 BB" : undefined,
    bb: !(n(bb) >= 2 && n(bb) <= 10000) ? "Entre 2 et 10 000" : undefined,
    duration: !(n(duration) >= 30 && n(duration) <= 3600) ? "Entre 30 et 3600 s" : undefined,
    decision: !(n(decision) >= 5 && n(decision) <= 120) ? "Entre 5 et 120 s" : undefined,
  };
  const valid = Object.values(errors).every((e) => !e);
  const create = async () => {
    if (!valid) return;
    try {
      const g = await a.api("/tournaments", { name: title.trim(), variant, maxPlayers: n(capacity), startingStack: n(stack), initialBB: n(bb), levelSeconds: n(duration), decisionSeconds: n(decision) });
      a.update(g);
      haptic("success");
      onCreated(g.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Création impossible", "error");
    }
  };
  return (
    <Screen title="Nouveau tournoi" eyebrow="Votre table, vos règles" back={a.nav.close} bottomInset={false}>
      <Field label="Nom du tournoi" value={title} onChange={setTitle} autoCapitalize="words" maxLength={60} error={errors.title} />
      <SectionHeader title="Variante" />
      <View style={{ gap: space.sm }}>
        {VARIANTS.map((v) => {
          const on = variant === v.id;
          return (
            <Surface key={v.id} onPress={() => setVariant(v.id)} label={v.name} padded={false} tone={on ? "gold" : "default"}>
              <Row style={{ padding: space.md }} gap={space.md}>
                <View style={[st.variantIcon, on && { backgroundColor: color.goldTint }]}><Text style={st.variantSymbol}>{v.symbol}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="headline">{v.name}</T>
                  <T v="caption">{v.tagline}</T>
                </View>
                <View style={[st.radio, on && { borderColor: color.gold }]}>{on && <View style={st.radioDot} />}</View>
              </Row>
            </Surface>
          );
        })}
      </View>
      <SectionHeader title="Structure" />
      <Segmented label="Structure" value={structure} onChange={pick} options={STRUCTURES.map((s) => ({ value: s.id, label: s.label }))} />
      <T v="caption">{STRUCTURES.find((s) => s.id === structure)?.desc ?? "Structure personnalisée"} · tapis {Number(stack).toLocaleString("fr-FR")} · blindes {Math.floor(n(bb) / 2)}/{bb}</T>
      <Group>
        <SettingRow title="Joueurs maximum" subtitle="8 par table, tables équilibrées automatiquement" right={<Stepper value={n(capacity)} min={2} max={32} onChange={(v) => setCapacity(String(v))} />} last={!advanced} />
        {advanced && (
          <View style={{ padding: space.md, gap: space.md }}>
            <Field label="Tapis de départ" value={stack} onChange={(v) => { setStack(v); setStructure("custom"); }} numeric error={errors.stack} />
            <Field label="Grosse blinde initiale" value={bb} onChange={(v) => { setBB(v); setStructure("custom"); }} numeric error={errors.bb} />
            <Field label="Durée d'un niveau (secondes)" value={duration} onChange={(v) => { setDuration(v); setStructure("custom"); }} numeric error={errors.duration} hint="Les blindes doublent à chaque niveau, jusqu'au niveau 13." />
            <Field label="Temps de décision (secondes)" value={decision} onChange={(v) => { setDecision(v); setStructure("custom"); }} numeric error={errors.decision} />
          </View>
        )}
      </Group>
      <Tap onPress={() => setAdvanced(!advanced)} label="Réglages avancés" style={{ minHeight: 44, justifyContent: "center" }}>
        <Row gap={6}><Icon name={advanced ? "chevron-up" : "options-outline"} size={16} tint={color.accent} /><T v="callout" tint={color.accent}>{advanced ? "Masquer les réglages avancés" : "Réglages avancés"}</T></Row>
      </Tap>
      <Button kind="gold" title="Créer le tournoi" icon="arrow-forward" onPress={() => void create()} disabled={!valid} loading={a.busy} />
      <T v="caption" center>Aucune inscription ni modification des règles n'est possible après le lancement.</T>
    </Screen>
  );
}
function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <Row gap={4} style={st.stepper}>
      <Tap onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} label="Moins" feedback="select" style={st.stepBtn}><Icon name="remove" size={18} /></Tap>
      <Text style={[type.number, { minWidth: 30, textAlign: "center", fontSize: 16 }]}>{value}</Text>
      <Tap onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} label="Plus" feedback="select" style={st.stepBtn}><Icon name="add" size={18} /></Tap>
    </Row>
  );
}

/** Salle d'attente, table ou résultats selon l'état du tournoi. */
export function TournamentScreen({ onBack }: { onBack: () => void }) {
  const a = useApp();
  const toast = useToast();
  const g = a.game!;
  const [bots, setBots] = useState(3);
  const looks = useMemo(
    () => ({ table: a.mine("table")?.look ?? {}, face: (a.mine("cardFace")?.look ?? {}) as object, chips: (a.mine("chips")?.look ?? {}) as object, resolve: a.lookOf }),
    [a.catalog, a.profile], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (g.status === "playing")
    return g.tables.some((t) => t.hand) ? (
      <PokerTable game={g} userId={a.user!.id} busy={a.busy} play={a.play} looks={looks} onLeave={onBack} />
    ) : (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Skeleton h={200} style={{ width: "80%" }} />
        <T v="caption">Préparation des tables…</T>
      </View>
    );
  if (g.status === "finished") return <Finished onBack={onBack} />;
  const host = g.owner === a.user?.id;
  const v = variantMeta(g.variant);
  const room = g.maxPlayers - g.players.length;
  return (
    <Screen title={g.name} eyebrow={`${v.name} · salle d'attente`} back={onBack} bottomInset={false} right={<Row gap={6}><View style={[st.liveDot, { backgroundColor: a.online ? color.success : color.warning }]} /><T v="caption">{a.online ? "En direct" : "Synchro"}</T></Row>}>
      <FadeIn>
        <Surface tone="felt" style={{ gap: space.sm, alignItems: "center", paddingVertical: space.xl }}>
          <T v="eyebrow">Code d'invitation</T>
          <Text selectable style={st.code}>{g.code}</Text>
          <T v="caption" center>Vos amis saisissent ce code dans « Rejoindre ».</T>
          <Button size="md" kind="gold" icon="share-outline" title="Partager l'invitation" onPress={() => void shareTournament(g.name, g.code).then((r) => r === "copied" && toast("Invitation copiée", "success"))} style={{ marginTop: space.xs, alignSelf: "stretch" }} />
        </Surface>
      </FadeIn>
      <SectionHeader title={`${g.players.length} / ${g.maxPlayers} joueurs`} eyebrow="À la table" />
      <View style={st.grid}>
        {g.players.map((p, i) => {
          const look = g.cosmetics?.[p.id];
          return (
            <FadeIn key={p.id} delay={i * 30} style={st.player}>
              <Avatar name={p.name} size={52} look={a.lookOf(look?.avatar) as Look} frame={a.lookOf(look?.frame) as Look} badge={a.lookOf(look?.badge) as Look} />
              <T v="callout" numberOfLines={1} center>{p.id === a.user?.id ? "Vous" : p.name}</T>
              <Text style={[type.eyebrow, { fontSize: 9, color: p.bot ? color.muted : p.id === g.owner ? color.gold : color.accent }]}>{p.bot ? "Bot" : p.id === g.owner ? "Hôte" : look?.level ? `Niv. ${look.level}` : "Joueur"}</Text>
            </FadeIn>
          );
        })}
        {Array.from({ length: Math.min(room, 3) }, (_, i) => (
          <View key={`empty-${i}`} style={[st.player, { opacity: 0.5 }]}>
            <View style={st.emptySeat}><Icon name="person-add-outline" size={20} tint={color.faint} /></View>
            <T v="caption">Place libre</T>
          </View>
        ))}
      </View>
      <Group title="Structure">
        <SettingRow icon="layers-outline" title="Tapis de départ" right={<T v="callout">{g.startingStack.toLocaleString("fr-FR")}</T>} />
        <SettingRow icon="ellipse-outline" title="Blindes initiales" right={<T v="callout">{Math.floor(g.initialBB / 2)} / {g.initialBB}</T>} />
        <SettingRow icon="time-outline" title="Niveaux" subtitle="Les blindes doublent à chaque niveau" right={<T v="callout">{Math.round(g.levelSeconds / 60) || "<1"} min</T>} />
        <SettingRow icon="hourglass-outline" title="Temps de décision" right={<T v="callout">{g.decisionSeconds} s</T>} last />
      </Group>
      {host ? (
        <Surface style={{ gap: space.md }}>
          <Row between>
            <View style={{ flex: 1 }}>
              <T v="headline">Compléter avec des bots</T>
              <T v="caption">Pour tester ou jouer en solo. Les tournois contre bots ne rapportent que la récompense de participation.</T>
            </View>
          </Row>
          <Row gap={space.sm}>
            <Stepper value={bots} min={1} max={Math.max(1, room)} onChange={setBots} />
            <Button size="md" kind="secondary" title={`Ajouter ${bots} bot${bots > 1 ? "s" : ""}`} onPress={() => void a.mutate(`/tournaments/${g.id}/bots`, { count: Math.min(bots, room) })} disabled={room < 1 || a.busy} style={{ flex: 1 }} />
          </Row>
          <Button kind="gold" icon="play" title="Lancer le tournoi" onPress={() => { haptic("heavy"); void a.mutate(`/tournaments/${g.id}/start`, {}); }} disabled={g.players.length < 2 || a.busy} />
          {g.players.length < 2 && <T v="caption" center>Il faut au moins deux joueurs.</T>}
        </Surface>
      ) : (
        <Surface style={{ alignItems: "center", gap: 8 }}>
          <Icon name="hourglass-outline" size={22} tint={color.gold} />
          <T v="headline">En attente de l'hôte</T>
          <T v="caption" center>Le tournoi démarrera dès que l'organisateur le lance. Restez sur cet écran.</T>
        </Surface>
      )}
    </Screen>
  );
}

function Finished({ onBack }: { onBack: () => void }) {
  const a = useApp();
  const g = a.game!;
  const { reduceMotion } = useSettings();
  const mine = g.results.find((r) => r.id === a.user?.id);
  const winner = g.results[0];
  const won = mine?.rank === 1;
  const crown = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (won) sound("win");
    if (!reduceMotion) Animated.spring(crown, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 12 }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const podium = [g.results[1], g.results[0], g.results[2]].filter(Boolean);
  return (
    <Screen title="Résultats" eyebrow={g.name} back={onBack} bottomInset={false}>
      <LinearGradient colors={won ? ["#3A2C14", "#17120A"] : ["#1B1E23", "#121418"]} style={st.finish}>
        <Animated.View style={{ transform: [{ scale: crown.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], opacity: crown }}>
          <Text style={{ fontSize: 58, color: color.goldBright }}>♛</Text>
        </Animated.View>
        <T v="eyebrow">{won ? "Victoire" : "Tournoi terminé"}</T>
        <T v="hero" center>{won ? "Vous remportez le tournoi" : `${winner?.name} l'emporte`}</T>
        {mine && !won && <T v="body" center>Vous terminez {mine.rank}{mine.rank === 1 ? "er" : "e"} sur {g.players.length}.</T>}
        <T v="caption" center>Les récompenses StackCoins et XP sont attribuées par le serveur, une seule fois par tournoi.</T>
      </LinearGradient>
      <View style={st.podium}>
        {podium.map((r) => {
          const h = r.rank === 1 ? 110 : r.rank === 2 ? 84 : 64;
          const look = g.cosmetics?.[r.id];
          return (
            <View key={r.id} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <Avatar name={r.name} size={r.rank === 1 ? 52 : 42} look={a.lookOf(look?.avatar) as Look} frame={a.lookOf(look?.frame) as Look} />
              <T v="callout" numberOfLines={1}>{r.id === a.user?.id ? "Vous" : r.name}</T>
              <LinearGradient colors={r.rank === 1 ? [color.goldBright, color.goldDeep] : [color.surface3, color.surface]} style={[st.step, { height: h }]}>
                <Text style={[type.title, { color: r.rank === 1 ? "#1A1206" : color.text }]}>{r.rank}</Text>
              </LinearGradient>
            </View>
          );
        })}
      </View>
      <Group title="Classement complet">
        {g.results.map((r, i) => (
          <SettingRow key={r.id} title={r.id === a.user?.id ? `${r.name} (vous)` : r.name} right={<Text style={[type.number, { color: r.rank <= 3 ? color.gold : color.muted }]}>#{r.rank}</Text>} last={i === g.results.length - 1} />
        ))}
      </Group>
      <Button kind="gold" title="Nouveau tournoi" icon="add" onPress={() => { onBack(); a.nav.open("create"); }} />
      <Button kind="secondary" title="Retour aux tournois" onPress={onBack} />
    </Screen>
  );
}

const st = StyleSheet.create({
  variantIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center" },
  variantSymbol: { color: color.gold, fontFamily: font.display, fontSize: 20 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.faint, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.gold },
  stepper: { backgroundColor: color.surface2, borderRadius: radius.md, padding: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  stepBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: color.surface3 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  code: { fontFamily: font.semibold, fontSize: 30, letterSpacing: 5, color: color.goldBright, fontVariant: ["tabular-nums"] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  player: { width: "31%", minWidth: 96, flexGrow: 1, alignItems: "center", gap: 6, paddingVertical: space.md, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  emptySeat: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderStyle: "dashed", borderColor: color.hairlineStrong, alignItems: "center", justifyContent: "center" },
  finish: { borderRadius: radius.xl, padding: space.xl, alignItems: "center", gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(217,172,99,0.3)" },
  podium: { flexDirection: "row", alignItems: "flex-end", gap: space.sm, paddingTop: space.md },
  step: { width: "100%", borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, alignItems: "center", justifyContent: "flex-start", paddingTop: 10 },
});
