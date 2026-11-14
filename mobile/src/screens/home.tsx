import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, font, radius, shadow, space, type } from "../theme";
import { Button, CoinGlyph, Empty, FadeIn, Field, Icon, ProgressBar, Row, SectionHeader, Surface, T, Tap, formatCoins, useToast } from "../ui";
import { PlayingCard } from "../poker/cards";
import { useApp } from "../app-context";
import { VARIANTS } from "../data/rules";
import { Screen } from "./shell";
import type { Mission, Summary } from "../types";

export const variantMeta = (id: string) => VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
export const statusLabel = (s: string) => (s === "playing" ? "En cours" : s === "finished" ? "Terminé" : "Inscriptions");

export function TournamentRow({ t, onPress }: { t: Summary; onPress: () => void }) {
  const v = variantMeta(t.variant);
  const live = t.status === "playing";
  return (
    <Surface onPress={onPress} label={`${t.name}, ${statusLabel(t.status)}`} padded={false}>
      <Row style={{ padding: space.md }} gap={space.md}>
        <View style={st.variantBadge}><Text style={st.variantSymbol}>{v.symbol}</Text></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Row gap={6}>
            {live && <View style={st.liveDot} />}
            <Text style={[type.eyebrow, { fontSize: 10, color: live ? color.success : t.status === "finished" ? color.muted : color.gold }]}>{statusLabel(t.status)}</Text>
          </Row>
          <T v="headline" numberOfLines={1}>{t.name}</T>
          <T v="caption">{v.name} · {t.count} joueur{t.count > 1 ? "s" : ""}</T>
        </View>
        <Icon name="chevron-forward" size={18} tint={color.faint} />
      </Row>
    </Surface>
  );
}

export function MissionRow({ m, onClaim }: { m: Mission; onClaim: () => void }) {
  const done = m.progress >= m.target;
  return (
    <Row gap={space.sm} style={{ paddingVertical: 12 }}>
      <View style={[st.missionIcon, done && { backgroundColor: color.goldTint }]}>
        <Icon name={m.claimed ? "checkmark" : done ? "gift-outline" : m.period === "daily" ? "sunny-outline" : "calendar-outline"} size={17} tint={done ? color.gold : color.textSoft} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Row between>
          <T v="callout" style={{ flex: 1 }} numberOfLines={1}>{m.label}</T>
          <T v="caption">{m.progress}/{m.target}</T>
        </Row>
        <ProgressBar value={m.progress / m.target} tint={m.claimed ? color.faint : color.gold} height={4} />
      </View>
      {done && !m.claimed ? (
        <Tap onPress={onClaim} label={`Récupérer ${m.coins} StackCoins`} style={st.claim}>
          <CoinGlyph size={14} />
          <Text style={st.claimText}>+{m.coins}</Text>
        </Tap>
      ) : (
        <Row gap={4} style={{ minWidth: 58, justifyContent: "flex-end", opacity: m.claimed ? 0.4 : 1 }}>
          <CoinGlyph size={13} />
          <Text style={[type.caption, { fontFamily: font.semibold }]}>{m.coins}</Text>
        </Row>
      )}
    </Row>
  );
}

export function HomeScreen({ openTournament, join }: { openTournament: (id: string) => void; join: (code: string) => void }) {
  const a = useApp();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const active = a.list.filter((t) => t.status !== "finished");
  const playing = active.find((t) => t.status === "playing");
  const daily = a.missions.filter((m) => m.period === "daily");
  const p = a.profile?.progress;
  const featured = a.catalog?.items.find((i) => i.rarity === "legendary" && !a.catalog?.owned.includes(i.id));
  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([a.refresh(), a.loadProfile(), a.loadMissions()]);
    setRefreshing(false);
  };
  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <FadeIn>
        <T v="eyebrow">{new Date().getHours() < 5 || new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}, {a.user?.name}</T>
        <T v="hero" style={{ marginTop: 6 }}>La prochaine main{"\n"}vous attend.</T>
      </FadeIn>

      {/* Action principale : Jouer */}
      <FadeIn delay={60}>
        <Tap onPress={() => (playing ? openTournament(playing.id) : a.nav.go("play"))} label={playing ? `Reprendre ${playing.name}` : "Jouer"} style={[{ borderRadius: radius.xl }, shadow(3)]}>
          <LinearGradient colors={["#17493D", "#0B2A23", "#071A15"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.playCard}>
            <View style={st.playRing} />
            <View style={st.playCards} pointerEvents="none">
              <PlayingCard code="Ah" size={58} style={{ transform: [{ rotate: "-10deg" }] }} />
              <PlayingCard size={58} style={{ marginLeft: -26, transform: [{ rotate: "8deg" }, { translateY: 6 }] }} />
            </View>
            <View style={{ gap: 6, maxWidth: "62%" }}>
              <Text style={[type.eyebrow, { color: color.goldBright }]}>{playing ? "Partie en cours" : "Jouer"}</Text>
              <Text style={[type.title, { fontSize: 28 }]}>{playing ? playing.name : "Rejoindre une table"}</Text>
              <T v="caption" style={{ color: "#B5C8BF" }}>{playing ? "Reprenez votre place, le temps tourne." : "Vos tournois, vos amis, vos règles."}</T>
            </View>
            <Row gap={8} style={st.playCta}>
              <Text style={st.playCtaText}>{playing ? "Reprendre" : "Jouer"}</Text>
              <Icon name="arrow-forward" size={18} tint="#1A1206" />
            </Row>
          </LinearGradient>
        </Tap>
      </FadeIn>

      <FadeIn delay={120}>
        <Row gap={space.sm}>
          <Surface onPress={() => a.nav.open("create")} label="Créer un tournoi" style={{ flex: 1, gap: 10 }}>
            <View style={[st.quickIcon, { backgroundColor: color.goldTint }]}><Icon name="add" size={22} tint={color.gold} /></View>
            <T v="headline">Créer</T>
            <T v="caption">Un tournoi privé, 2 à 32 joueurs.</T>
          </Surface>
          <Surface style={{ flex: 1, gap: 8 }}>
            <View style={[st.quickIcon, { backgroundColor: color.accentTint }]}><Icon name="key-outline" size={20} tint={color.accent} /></View>
            <Field label="Code d'invitation" value={code} onChange={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={12} mono placeholder="XXXX" onSubmit={() => code && join(code)} />
            <Button size="sm" kind="secondary" title="Rejoindre" onPress={() => join(code)} disabled={!code.trim()} />
          </Surface>
        </Row>
      </FadeIn>

      <SectionHeader title="Vos tournois" action={active.length ? "Tout voir" : undefined} onAction={() => a.nav.go("play")} />
      {active.length === 0 ? (
        <Empty icon="trophy-outline" title="Aucun tournoi à venir" body="Créez votre table, partagez le code, ou ajoutez des bots pour vous entraîner en solo." action="Créer un tournoi" onAction={() => a.nav.open("create")} />
      ) : (
        active.slice(0, 3).map((t) => <TournamentRow key={t.id} t={t} onPress={() => openTournament(t.id)} />)
      )}

      <SectionHeader title="Progression" eyebrow={`Niveau ${p?.level ?? 1}`} action="Profil" onAction={() => a.nav.open("profile")} />
      <Surface style={{ gap: space.sm }}>
        <Row between>
          <T v="callout">{p ? `${(p.xp - p.current).toLocaleString("fr-FR")} / ${(p.next - p.current).toLocaleString("fr-FR")} XP` : "—"}</T>
          <T v="caption">Niveau {(p?.level ?? 1) + 1}</T>
        </Row>
        <ProgressBar value={p ? (p.xp - p.current) / Math.max(1, p.next - p.current) : 0} tint={color.accent} />
        <View style={{ marginTop: 4 }}>
          {daily.map((m) => (
            <MissionRow key={m.id} m={m} onClaim={() => void a.claimMission(m.id).then((r) => toast(r.coins ? `+${r.coins} StackCoins · +${r.xp} XP` : `+${r.xp} XP (plafond quotidien atteint)`, "reward")).catch((e) => toast(e.message, "error"))} />
          ))}
        </View>
        <T v="caption">Le niveau mesure votre activité. Il ne donne aucun avantage en jeu.</T>
      </Surface>

      <Row gap={space.sm}>
        <Surface onPress={() => a.nav.go("train")} label="Exercices" tone="accent" style={{ flex: 1, gap: 8, minHeight: 150 }}>
          <Icon name="barbell-outline" size={24} tint={color.accent} />
          <T v="headline">S'entraîner</T>
          <T v="caption">Positions et décisions, en 5 minutes.</T>
        </Surface>
        <Surface onPress={() => a.nav.go("shop")} label="Boutique" tone="gold" style={{ flex: 1, gap: 8, minHeight: 150 }}>
          <Icon name="sparkles-outline" size={24} tint={color.gold} />
          <T v="headline">Boutique</T>
          <T v="caption" numberOfLines={2}>{featured ? `À la une : ${featured.name} · ${formatCoins(featured.price)}` : "Tables, cartes et effets."}</T>
        </Surface>
      </Row>
      <T v="caption" center style={{ marginTop: space.sm }}>STACKORA 0.2 · Jeu sans argent réel</T>
    </Screen>
  );
}

const st = StyleSheet.create({
  variantBadge: { width: 46, height: 46, borderRadius: 14, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center" },
  variantSymbol: { color: color.gold, fontFamily: font.display, fontSize: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.success },
  playCard: { borderRadius: radius.xl, padding: space.xl, minHeight: 210, justifyContent: "space-between", overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(217,172,99,0.3)" },
  playRing: { position: "absolute", right: -80, top: -60, width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "rgba(217,172,99,0.18)" },
  playCards: { position: "absolute", right: 24, top: 30, flexDirection: "row" },
  playCta: { alignSelf: "flex-start", backgroundColor: color.goldBright, paddingHorizontal: 18, height: 44, borderRadius: radius.pill, marginTop: space.md },
  playCtaText: { fontFamily: font.bold, fontSize: 15, color: "#1A1206" },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  missionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center" },
  claim: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: color.goldTint, borderRadius: radius.pill, paddingHorizontal: 11, height: 34, borderWidth: 1, borderColor: "rgba(217,172,99,0.4)" },
  claimText: { fontFamily: font.bold, fontSize: 13, color: color.goldBright },
});
