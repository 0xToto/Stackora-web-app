import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, font, radius, rarity as rarityTokens, space, type } from "../theme";
import { useSettings } from "../settings";
import { haptic, sound } from "../feedback";
import { Avatar, Button, CoinBalance, CoinGlyph, Confirm, Empty, FadeIn, Group, Icon, Pill, ProgressBar, RarityTag, Row, SectionHeader, SettingRow, Sheet, Skeleton, Surface, T, Tap, formatCoins, useToast, type Look } from "../ui";
import { Chip, PlayingCard } from "../poker/cards";
import { useApp } from "../app-context";
import type { Item, Slot } from "../types";
import { Screen } from "./shell";
import { variantMeta } from "./home";

export const SLOT_LABEL: Record<Slot, string> = { table: "Tapis", cardBack: "Dos de cartes", cardFace: "Faces", chips: "Jetons", avatar: "Avatar", frame: "Cadre", badge: "Badge", winFx: "Victoire", showdownFx: "Showdown" };
const CATEGORIES: { id: string; label: string; slots: Slot[] }[] = [
  { id: "tables", label: "Tables", slots: ["table"] },
  { id: "cards", label: "Cartes", slots: ["cardBack", "cardFace"] },
  { id: "chips", label: "Jetons", slots: ["chips"] },
  { id: "avatars", label: "Avatars", slots: ["avatar", "frame", "badge"] },
  { id: "fx", label: "Animations", slots: ["winFx", "showdownFx"] },
];

/** Aperçu dessiné de chaque cosmétique. */
export function Preview({ item, size = 1 }: { item: Item; size?: number }) {
  const l = item.look as Record<string, any>;
  const s = (n: number) => n * size;
  switch (item.slot) {
    case "table":
      return (
        <View style={{ width: s(120), height: s(74), borderRadius: s(40), backgroundColor: l.rail, padding: s(5) }}>
          <LinearGradient colors={[l.felt, l.felt2]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: s(36), alignItems: "center", justifyContent: "center" }}>
            <View style={{ position: "absolute", top: s(5), left: s(5), right: s(5), bottom: s(5), borderRadius: s(32), borderWidth: 1, borderColor: l.line + "88" }} />
            {l.glow && <View style={{ width: s(50), height: s(24), borderRadius: s(20), backgroundColor: l.glow, opacity: 0.35 }} />}
          </LinearGradient>
        </View>
      );
    case "cardBack":
      return <PlayingCard size={s(48)} back={l} />;
    case "cardFace":
      return (
        <Row gap={s(4)}>
          <PlayingCard code="Kd" size={s(42)} face={l} />
          <PlayingCard code="Qc" size={s(42)} face={l} />
        </Row>
      );
    case "chips":
      return (
        <Row gap={s(-6)}>
          <Chip size={s(34)} look={l} />
          <View style={{ marginLeft: -s(10), marginTop: -s(10) }}><Chip size={s(34)} look={l} /></View>
        </Row>
      );
    case "avatar":
      return <Avatar name="?" size={s(60)} look={l as Look} />;
    case "frame":
      return <Avatar name="S" size={s(60)} frame={l as Look} />;
    case "badge":
      return <Avatar name="S" size={s(60)} badge={l as Look} />;
    default:
      return (
        <View style={{ width: s(64), height: s(64), borderRadius: s(32), alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: (l.color as string) ?? color.gold, backgroundColor: ((l.color as string) ?? color.gold) + "1A" }}>
          <Icon name={l.kind === "confetti" ? "sparkles" : l.kind === "nova" ? "planet-outline" : l.kind === "spark" ? "flash" : l.kind === "none" ? "remove" : "sunny-outline"} size={s(26)} tint={(l.color as string) ?? color.textSoft} />
        </View>
      );
  }
}

function ItemCard({ item, owned, equipped, onPress }: { item: Item; owned: boolean; equipped: boolean; onPress: () => void }) {
  const r = rarityTokens[item.rarity];
  return (
    <Tap onPress={onPress} label={`${item.name}, ${r.label}${owned ? ", possédé" : `, ${item.price} StackCoins`}`} style={st.itemCard}>
      <LinearGradient colors={[r.tint, "rgba(0,0,0,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={st.itemPreview}>
        <Preview item={item} size={0.9} />
      </LinearGradient>
      <View style={{ padding: 12, gap: 6 }}>
        <RarityTag r={item.rarity} />
        <T v="callout" numberOfLines={1}>{item.name}</T>
        {equipped ? (
          <Row gap={4}><Icon name="checkmark-circle" size={14} tint={color.success} /><T v="caption" tint={color.success}>Équipé</T></Row>
        ) : owned ? (
          <T v="caption">Possédé</T>
        ) : (
          <Row gap={5}><CoinGlyph size={13} /><Text style={[type.number, { fontSize: 13.5 }]}>{formatCoins(item.price)}</Text></Row>
        )}
      </View>
    </Tap>
  );
}

/** Fenêtre de détail : aperçu, achat confirmé, équipement. */
export function ItemSheet({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const a = useApp();
  const toast = useToast();
  const { reduceMotion } = useSettings();
  const [confirm, setConfirm] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setUnlocked(false);
    burst.setValue(0);
  }, [item?.id, burst]);
  if (!item) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;
  const owned = !!a.catalog?.owned.includes(item.id);
  const equipped = a.catalog?.equipped[item.slot] === item.id;
  const balance = a.balance ?? 0;
  const missing = Math.max(0, item.price - balance);
  const buy = async () => {
    setConfirm(false);
    try {
      await a.buy(item.id);
      setUnlocked(true);
      sound("win");
      haptic("success");
      if (!reduceMotion) Animated.timing(burst, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Achat impossible", "error");
    }
  };
  const equip = async () => {
    try {
      await a.equip(item.slot, item.id);
      toast(`${item.name} équipé`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Impossible d'équiper", "error");
    }
  };
  const r = rarityTokens[item.rarity];
  return (
    <Sheet visible onClose={onClose} title={item.name}>
      <LinearGradient colors={[r.tint, color.surface]} style={st.bigPreview}>
        <Animated.View pointerEvents="none" style={[st.burst, { borderColor: r.color, opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }), transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] }) }] }]} />
        <Preview item={item} size={1.7} />
      </LinearGradient>
      <Row gap={8}>
        <RarityTag r={item.rarity} />
        <T v="caption">{item.collection}</T>
        <View style={{ flex: 1 }} />
        <Row gap={4}><Icon name={item.visibility === "public" ? "eye-outline" : "phone-portrait-outline"} size={14} tint={color.muted} /><T v="caption">{item.visibility === "public" ? "Visible par la table" : "Visible par vous seul"}</T></Row>
      </Row>
      <T v="body">{item.description}</T>
      {unlocked && <Surface tone="gold" style={{ alignItems: "center", gap: 4 }}><T v="eyebrow">Débloqué</T><T v="headline">{item.name} rejoint votre collection</T></Surface>}
      {owned || unlocked ? (
        <Button kind={equipped ? "secondary" : "gold"} title={equipped ? "Équipé" : "Équiper"} icon={equipped ? "checkmark" : "shirt-outline"} onPress={() => void equip()} disabled={equipped} />
      ) : (
        <>
          <Button kind="gold" title={missing ? `Il manque ${formatCoins(missing)} StackCoins` : `Acheter · ${formatCoins(item.price)}`} onPress={() => setConfirm(true)} disabled={missing > 0} />
          <T v="caption" center>Solde : {formatCoins(balance)} StackCoins. Les cosmétiques n'apportent aucun avantage de jeu.</T>
        </>
      )}
      <Confirm visible={confirm} title="Confirmer l'achat" body={`${item.name} pour ${formatCoins(item.price)} StackCoins. Il vous restera ${formatCoins(balance - item.price)} StackCoins.`} confirm="Acheter" onCancel={() => setConfirm(false)} onConfirm={() => void buy()} />
    </Sheet>
  );
}

export function ShopScreen() {
  const a = useApp();
  const [cat, setCat] = useState("tables");
  const [open, setOpen] = useState<Item | null>(null);
  const [packsInfo, setPacksInfo] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const toast = useToast();
  // Sur iPhone/Android, les biens numériques passent par les achats intégrés (règles des stores).
  const web = Platform.OS === "web";
  const webPay = web && !!a.catalog?.webPayments?.enabled;
  const buyPack = async (productId: string) => {
    if (!webPay) return setPacksInfo(true);
    setPaying(productId);
    try {
      const r = await a.checkout(productId);
      globalThis.location?.assign(r.url);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Paiement indisponible", "error");
      setPaying(null);
    }
  };
  useEffect(() => {
    void a.loadCatalog().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const c = a.catalog;
  const featured = c?.items.find((i) => i.rarity === "legendary" && !c.owned.includes(i.id)) ?? c?.items.find((i) => i.rarity === "legendary");
  const slots = CATEGORIES.find((x) => x.id === cat)!.slots;
  const items = (c?.items ?? []).filter((i) => slots.includes(i.slot) && !(i.free && i.look.kind === "none"));
  return (
    <Screen onRefresh={() => void a.loadCatalog()}>
      <Row between>
        <View style={{ gap: 6 }}>
          <T v="eyebrow">Boutique</T>
          <T v="title">Votre style à table</T>
        </View>
        <CoinBalance amount={a.balance} size="lg" />
      </Row>
      {!c ? (
        <>
          <Skeleton h={200} />
          <Skeleton h={160} />
        </>
      ) : (
        <>
          {featured && (
            <FadeIn>
              <Tap onPress={() => setOpen(featured)} label={`À la une : ${featured.name}`} style={{ borderRadius: radius.xl, overflow: "hidden" }}>
                <LinearGradient colors={["#2B2140", "#14101F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.featured}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <RarityTag r={featured.rarity} />
                    <T v="title" style={{ fontSize: 24 }}>{featured.name}</T>
                    <T v="caption" numberOfLines={3}>{featured.description}</T>
                    <Row gap={6} style={{ marginTop: 4 }}><CoinGlyph size={16} /><Text style={[type.number, { fontSize: 17 }]}>{formatCoins(featured.price)}</Text></Row>
                  </View>
                  <Preview item={featured} size={1.15} />
                </LinearGradient>
              </Tap>
            </FadeIn>
          )}
          <Row gap={8} wrap>
            {CATEGORIES.map((x) => <Pill key={x.id} label={x.label} active={cat === x.id} onPress={() => setCat(x.id)} />)}
          </Row>
          {slots.map((slot) => {
            const list = items.filter((i) => i.slot === slot);
            if (!list.length) return null;
            return (
              <View key={slot} style={{ gap: space.sm }}>
                {slots.length > 1 && <T v="eyebrow" style={{ color: color.muted }}>{SLOT_LABEL[slot]}</T>}
                <View style={st.grid}>
                  {list.map((i, k) => (
                    <FadeIn key={i.id} delay={k * 25} style={{ width: "48%", flexGrow: 1, maxWidth: "50%" }}>
                      <ItemCard item={i} owned={c.owned.includes(i.id)} equipped={c.equipped[i.slot] === i.id} onPress={() => setOpen(i)} />
                    </FadeIn>
                  ))}
                </View>
              </View>
            );
          })}
          <SectionHeader title="StackCoins" eyebrow="Recharger" />
          <View style={st.grid}>
            {c.packs.map((p, i) => (
              <Surface key={p.productId} onPress={() => void buyPack(p.productId)} label={`Acheter le pack ${p.name}, ${p.coins} StackCoins pour ${p.displayPrice}`} style={{ width: "48%", flexGrow: 1, maxWidth: "50%", gap: 8, alignItems: "center" }} tone={i === 2 ? "gold" : "default"}>
                {i === 2 && <Text style={[type.eyebrow, { fontSize: 9 }]}>Le plus choisi</Text>}
                <Row gap={-4}>{Array.from({ length: Math.min(4, i + 1) }, (_, k) => <View key={k} style={{ marginLeft: k ? -8 : 0 }}><CoinGlyph size={24} /></View>)}</Row>
                <Text style={[type.number, { fontSize: 20 }]}>{formatCoins(p.coins)}</Text>
                <T v="caption">{p.name}</T>
                <View style={[st.price, webPay && { backgroundColor: color.gold }]}>
                  <Text style={[type.callout, { fontFamily: font.semibold, color: webPay ? "#1A1206" : color.text }]}>{paying === p.productId ? "Redirection…" : p.displayPrice}</Text>
                </View>
              </Surface>
            ))}
          </View>
          {webPay && (
            <Row gap={8} style={{ alignItems: "flex-start", padding: space.md, borderRadius: radius.md, backgroundColor: color.surface }}>
              <Icon name="lock-closed-outline" size={16} tint={color.gold} />
              <T v="caption" style={{ flex: 1 }}>
                Paiement sécurisé par Stripe. Vos StackCoins sont crédités après vérification du paiement par le serveur.
                {a.catalog?.webPayments?.test ? " Mode test : aucune somme réelle n'est débitée. Carte 4242 4242 4242 4242, date future, CVC au choix." : ""}
              </T>
            </Row>
          )}
          <T v="caption" center>Monnaie virtuelle non convertible en argent réel. Elle ne sert qu'aux cosmétiques : jamais aux mises, aux buy-ins ni à un avantage de jeu.</T>
          <Sheet visible={packsInfo} onClose={() => setPacksInfo(false)} title={web ? "Paiement web" : "Achats intégrés"}>
            <T v="body">{web ? "Le paiement web n'est pas encore configuré sur ce serveur (clé Stripe manquante). Aucun paiement n'est simulé." : c.iapEnabled ? "Le serveur est prêt à vérifier les transactions App Store, mais cette version de l'application n'intègre pas encore le module StoreKit. Aucun paiement ne peut être lancé." : "Les achats intégrés ne sont pas encore activés. Aucun paiement n'est simulé : vous ne pouvez rien acheter avec de l'argent réel pour l'instant."}</T>
            <T v="body">En attendant, gagnez des StackCoins en terminant des tournois, des missions et des exercices.</T>
            <Button kind="secondary" title="Voir mes missions" onPress={() => { setPacksInfo(false); a.nav.open("notifications"); }} />
          </Sheet>
        </>
      )}
      <ItemSheet item={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

export function CollectionScreen() {
  const a = useApp();
  const [open, setOpen] = useState<Item | null>(null);
  const c = a.catalog;
  if (!c) return <Screen title="Collection" back={a.nav.close}><Skeleton /><Skeleton /></Screen>;
  const owned = c.items.filter((i) => c.owned.includes(i.id));
  const total = c.items.length;
  return (
    <Screen title="Collection" eyebrow={`${owned.length} / ${total} cosmétiques`} back={a.nav.close} bottomInset={false}>
      <ProgressBar value={owned.length / total} />
      {(Object.keys(SLOT_LABEL) as Slot[]).map((slot) => {
        const list = owned.filter((i) => i.slot === slot);
        if (!list.length) return null;
        return (
          <View key={slot} style={{ gap: space.sm }}>
            <Row between>
              <T v="eyebrow" style={{ color: color.muted }}>{SLOT_LABEL[slot]}</T>
              <T v="caption">{c.items.find((i) => i.id === c.equipped[slot])?.name}</T>
            </Row>
            <View style={st.grid}>
              {list.map((i) => (
                <View key={i.id} style={{ width: "48%", flexGrow: 1, maxWidth: "50%" }}>
                  <ItemCard item={i} owned equipped={c.equipped[slot] === i.id} onPress={() => setOpen(i)} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <Button kind="secondary" icon="bag-handle-outline" title="Compléter ma collection" onPress={() => { a.nav.close(); a.nav.go("shop"); }} />
      <ItemSheet item={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

export function ProfileScreen() {
  const a = useApp();
  const p = a.profile;
  useEffect(() => {
    void a.loadProfile().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p) return <Screen title="Profil" back={a.nav.close}><Skeleton h={180} /><Skeleton /></Screen>;
  const e = p.equipped;
  const train = p.training.reduce((acc, t) => ({ correct: acc.correct + t.correct, total: acc.total + t.total, sessions: acc.sessions + t.sessions }), { correct: 0, total: 0, sessions: 0 });
  const stats = [
    { label: "Tournois", value: p.stats.played },
    { label: "Victoires", value: p.stats.wins },
    { label: "Top 3", value: p.stats.top3 },
    { label: "Meilleur", value: p.stats.bestRank ? `#${p.stats.bestRank}` : "—" },
  ];
  return (
    <Screen title="Profil" back={a.nav.close} bottomInset={false} right={<Tap onPress={() => a.nav.open("settings")} label="Paramètres" style={{ padding: 8 }}><Icon name="settings-outline" size={22} /></Tap>}>
      <FadeIn>
        <LinearGradient colors={["#1E2128", color.surface]} style={st.hero}>
          <Avatar name={p.user.name} size={92} look={a.lookOf(e.avatar) as Look} frame={a.lookOf(e.frame) as Look} badge={a.lookOf(e.badge) as Look} />
          <T v="title">{p.user.name}</T>
          <Row gap={8}>
            <View style={st.level}><Text style={st.levelText}>Niveau {p.progress.level}</Text></View>
            <CoinBalance amount={p.wallet.balance} onPress={() => { a.nav.close(); a.nav.go("shop"); }} />
          </Row>
          <View style={{ alignSelf: "stretch", gap: 6, marginTop: 4 }}>
            <ProgressBar value={(p.progress.xp - p.progress.current) / Math.max(1, p.progress.next - p.progress.current)} tint={color.accent} />
            <T v="caption" center>{(p.progress.next - p.progress.xp).toLocaleString("fr-FR")} XP avant le niveau {p.progress.level + 1}</T>
          </View>
        </LinearGradient>
      </FadeIn>
      <View style={st.stats}>
        {stats.map((s, i) => (
          <FadeIn key={s.label} delay={80 + i * 50} style={st.stat}>
            <Text style={[type.number, { fontSize: 24 }]}>{s.value}</Text>
            <T v="caption">{s.label}</T>
          </FadeIn>
        ))}
      </View>
      <Group title="Équipement">
        <SettingRow icon="sparkles-outline" title="Collection" subtitle={`${p.owned.length} cosmétiques possédés`} onPress={() => a.nav.open("collection")} />
        <SettingRow icon="color-palette-outline" title="Tapis" subtitle={a.itemById(e.table)?.name} onPress={() => a.nav.open("collection")} />
        <SettingRow icon="albums-outline" title="Dos de cartes" subtitle={`${a.itemById(e.cardBack)?.name} · visible par la table`} onPress={() => a.nav.open("collection")} last />
      </Group>
      <Group title="Exercices">
        <SettingRow icon="barbell-outline" title="Sessions terminées" right={<T v="callout">{train.sessions}</T>} />
        <SettingRow icon="checkmark-done-outline" title="Taux de réussite" right={<T v="callout">{train.total ? Math.round((train.correct / train.total) * 100) + " %" : "—"}</T>} last />
      </Group>
      <SectionHeader title="Historique" />
      {p.history.length === 0 ? (
        <Empty icon="time-outline" title="Pas encore de tournoi terminé" body="Vos classements apparaîtront ici." />
      ) : (
        <Group>
          {p.history.map((h, i) => (
            <SettingRow key={h.id} title={h.name} subtitle={`${variantMeta(h.variant).name} · ${h.players} joueurs · ${new Date(h.at).toLocaleDateString("fr-FR")}`} right={<Text style={[type.number, { color: h.rank === 1 ? color.gold : color.textSoft }]}>#{h.rank}</Text>} last={i === p.history.length - 1} />
          ))}
        </Group>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  itemCard: { backgroundColor: color.surface, borderRadius: radius.lg, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  itemPreview: { height: 112, alignItems: "center", justifyContent: "center" },
  bigPreview: { height: 200, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  burst: { position: "absolute", width: 140, height: 140, borderRadius: 70, borderWidth: 3 },
  featured: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.xl, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(241,204,134,0.3)", minHeight: 170 },
  price: { backgroundColor: color.surface3, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  hero: { alignItems: "center", gap: space.sm, padding: space.xl, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  level: { backgroundColor: color.accentTint, borderRadius: radius.pill, paddingHorizontal: 12, height: 32, justifyContent: "center" },
  levelText: { fontFamily: font.semibold, fontSize: 13, color: color.accent },
  stats: { flexDirection: "row", gap: space.sm },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingVertical: space.md, backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
});
