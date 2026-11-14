import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { color, font, radius, space, type } from "../theme";
import { useSettings, type Prefs } from "../settings";
import { haptic, sound } from "../feedback";
import { Button, CoinGlyph, Confirm, Empty, Field, Group, Icon, Pill, Row, SectionHeader, Segmented, SettingRow, Sheet, Surface, T, Tap, Toggle, formatCoins, useToast } from "../ui";
import { useApp } from "../app-context";
import type { Item, Slot } from "../types";
import { Screen } from "./shell";
import { Preview, SLOT_LABEL } from "./shop";
import { MissionRow } from "./home";

type Section = "appearance" | "game" | "audio" | "notifications" | "account";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "appearance", label: "Apparence" },
  { id: "game", label: "Jeu" },
  { id: "audio", label: "Son" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Compte" },
];

function Switch<K extends keyof Prefs>({ k, title, subtitle, last, icon }: { k: K; title: string; subtitle?: string; last?: boolean; icon?: React.ComponentProps<typeof SettingRow>["icon"] }) {
  const { prefs, set } = useSettings();
  return <SettingRow icon={icon} title={title} subtitle={subtitle} last={last} right={<Toggle label={title} value={prefs[k] as boolean} onChange={(v) => set(k, v as Prefs[K])} />} />;
}

/** Sélecteur d'un cosmétique possédé (équipement serveur). */
function OwnedPicker({ slot, title, note }: { slot: Slot; title: string; note: string }) {
  const a = useApp();
  const toast = useToast();
  const items = (a.catalog?.items ?? []).filter((i) => i.slot === slot && a.catalog?.owned.includes(i.id));
  const current = a.catalog?.equipped[slot];
  const choose = (i: Item) => void a.equip(slot, i.id).then(() => haptic("select")).catch((e) => toast(e.message, "error"));
  return (
    <View style={{ gap: space.xs }}>
      <Row between style={{ paddingHorizontal: 4 }}>
        <T v="eyebrow" style={{ color: color.muted }}>{title}</T>
        <Tap onPress={() => a.nav.go("shop")} label="Plus de choix" style={{ minHeight: 32, justifyContent: "center" }}><T v="caption" tint={color.accent}>Boutique</T></Tap>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingVertical: 2 }}>
        {items.map((i) => (
          <Tap key={i.id} onPress={() => choose(i)} label={i.name} feedback="none" style={[st.pick, current === i.id && { borderColor: color.gold, backgroundColor: color.goldTint }]}>
            <View style={{ height: 80, alignItems: "center", justifyContent: "center" }}><Preview item={i} size={0.75} /></View>
            <T v="caption" numberOfLines={1} center style={{ color: current === i.id ? color.text : color.textSoft }}>{i.name}</T>
          </Tap>
        ))}
      </ScrollView>
      <T v="caption" style={{ paddingHorizontal: 4 }}>{note}</T>
    </View>
  );
}

export function SettingsScreen() {
  const a = useApp();
  const toast = useToast();
  const { prefs, set, reset } = useSettings();
  const [section, setSection] = useState<Section>("appearance");
  const [name, setName] = useState(a.user?.name ?? "");
  const [logout, setLogout] = useState(false);
  const [del, setDel] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState(false);
  useEffect(() => {
    if (!a.catalog) void a.loadCatalog().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Screen title="Paramètres" back={a.nav.close} bottomInset={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SECTIONS.map((s) => <Pill key={s.id} label={s.label} active={section === s.id} onPress={() => setSection(s.id)} />)}
      </ScrollView>

      {section === "appearance" && (
        <>
          <Group title="Thème" footer="STACKORA est conçu pour un thème sombre, plus reposant et plus lisible à table. Le thème clair n'est pas disponible dans cette version.">
            <View style={{ padding: space.md }}><Segmented label="Thème" value="dark" onChange={() => toast("Le thème clair arrive dans une prochaine version.", "info")} options={[{ value: "dark", label: "Sombre" }, { value: "light", label: "Clair" }, { value: "auto", label: "Auto" }]} /></View>
          </Group>
          <OwnedPicker slot="table" title="Tapis et style de table" note="Visible par vous seul : chaque joueur voit son propre tapis." />
          <OwnedPicker slot="cardBack" title="Dos des cartes" note="Public : vos adversaires voient ce dos sur vos cartes fermées, sans jamais en voir la valeur." />
          <OwnedPicker slot="cardFace" title="Faces des cartes" note="Visible par vous seul." />
          <OwnedPicker slot="chips" title="Jetons" note="Visible par vous seul." />
          <Group title="Effets">
            <SettingRow icon="film-outline" title="Animations" subtitle={prefs.animations === "full" ? "Complètes" : prefs.animations === "reduced" ? "Réduites : transitions courtes, pas d'effets en boucle" : "Désactivées"} right={null} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Animations" value={prefs.animations} onChange={(v) => set("animations", v)} options={[{ value: "full", label: "Complètes" }, { value: "reduced", label: "Réduites" }, { value: "off", label: "Aucune" }]} /></View>
            <Switch k="ambientGlow" icon="sunny-outline" title="Halo lumineux de la table" subtitle="Lueur douce autour du tapis" />
            <SettingRow icon="contract-outline" title="Densité d'affichage" right={null} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Densité" value={prefs.density} onChange={(v) => set("density", v)} options={[{ value: "comfortable", label: "Confortable" }, { value: "compact", label: "Compacte" }]} /></View>
          </Group>
          <T v="caption">Le réglage « Réduire les animations » de l'iPhone est toujours respecté.</T>
        </>
      )}

      {section === "game" && (
        <>
          <Group title="Affichage">
            <SettingRow icon="layers-outline" title="Tapis des joueurs" right={null} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Unité des tapis" value={prefs.stackUnit} onChange={(v) => set("stackUnit", v)} options={[{ value: "chips", label: "Jetons" }, { value: "bb", label: "Grosses blindes" }]} /></View>
            <SettingRow icon="pie-chart-outline" title="Pot" right={null} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Unité du pot" value={prefs.potUnit} onChange={(v) => set("potUnit", v)} options={[{ value: "chips", label: "Jetons" }, { value: "bb", label: "Grosses blindes" }]} /></View>
            <Switch k="showBets" icon="ellipse-outline" title="Afficher les mises sur le tapis" />
            <Switch k="fourColor" icon="color-filter-outline" title="Cartes à quatre couleurs" subtitle="Carreau bleu, trèfle vert" />
            <Switch k="highlightActive" icon="radio-button-on-outline" title="Mettre en évidence le joueur actif" />
            <Switch k="showTimer" icon="timer-outline" title="Afficher le chronomètre" />
            <Switch k="showEquity" icon="stats-chart-outline" title="Équité pendant un tapis" subtitle="Pourcentages exacts calculés par le serveur" last />
          </Group>
          <Group title="Décisions">
            <Switch k="confirmAllIn" icon="flame-outline" title="Confirmer le tapis" />
            <Switch k="confirmLargeBet" icon="alert-circle-outline" title="Confirmer les grosses mises" subtitle="Au-delà de la moitié de votre tapis" />
            <Switch k="preactions" icon="flash-outline" title="Préactions" subtitle="« Parole / Passe » et « Parole », exécutées seulement si elles sont légales à votre tour" />
            <Switch k="showSlider" icon="options-outline" title="Curseur de mise" />
            <SettingRow icon="grid-outline" title="Raccourcis de mise" subtitle={prefs.presetStyle === "smart" ? "Préflop en BB, postflop en fractions du pot" : "Toujours en fractions du pot"} right={null} last={false} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Raccourcis" value={prefs.presetStyle} onChange={(v) => set("presetStyle", v)} options={[{ value: "smart", label: "Contextuels" }, { value: "pot", label: "Fractions du pot" }]} /></View>
          </Group>
          <Group title="Révélations" footer="Le rythme de révélation est fixé par le serveur pour toute la table : ces réglages ne changent que votre façon de le voir.">
            <Switch k="riverPeel" icon="hand-left-outline" title="Révélation interactive de la river" subtitle="Maintenir pour soulever le coin" last />
          </Group>
        </>
      )}

      {section === "audio" && (
        <>
          <Group title="Son">
            <Switch k="silent" icon="volume-mute-outline" title="Mode silencieux" subtitle="Coupe tous les sons de STACKORA" />
            <SettingRow icon="volume-high-outline" title="Volume général" right={<T v="callout">{Math.round(prefs.volume * 100)} %</T>} />
            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md }}><Segmented label="Volume" value={prefs.volume} onChange={(v) => { set("volume", v); setTimeout(() => sound("chip"), 50); }} options={[0, 0.25, 0.5, 0.75, 1].map((v) => ({ value: v, label: v ? `${v * 100}` : "0" }))} /></View>
            <Switch k="sfx" icon="musical-notes-outline" title="Effets sonores" />
            <Switch k="chipSounds" icon="ellipse-outline" title="Sons des jetons" />
            <Switch k="cardSounds" icon="albums-outline" title="Sons des cartes" />
            <Switch k="winSounds" icon="trophy-outline" title="Sons de victoire" last />
          </Group>
          <Button size="md" kind="secondary" icon="play-outline" title="Tester les sons" onPress={() => { sound("card"); setTimeout(() => sound("chip"), 250); setTimeout(() => sound("win"), 600); }} />
          <Group title="Vibrations" footer={Platform.OS === "web" ? "Les vibrations ne sont disponibles que dans l'application iPhone." : "Retours haptiques du moteur Taptic de l'iPhone."}>
            <Switch k="haptics" icon="phone-portrait-outline" title="Vibrations" />
            <Switch k="buttonHaptics" icon="finger-print-outline" title="Retour haptique des boutons" last />
          </Group>
        </>
      )}

      {section === "notifications" && (
        <Group title="Recevoir" footer="Vos choix sont enregistrés sur votre compte. Les notifications push nécessitent la configuration Apple (APNs), pas encore activée : en attendant, retrouvez tout dans le centre de notifications.">
          <Switch k="notifInvites" icon="mail-outline" title="Invitations aux tournois" />
          <Switch k="notifStart" icon="play-circle-outline" title="Début d'un tournoi" />
          <Switch k="notifSoon" icon="alarm-outline" title="Tournoi imminent" />
          <Switch k="notifRewards" icon="gift-outline" title="Récompenses" />
          <Switch k="notifNews" icon="megaphone-outline" title="Nouveautés" />
          <Switch k="notifSocial" icon="people-outline" title="Activité des amis" last />
        </Group>
      )}

      {section === "account" && (
        <>
          <Group title="Profil">
            <View style={{ padding: space.md, gap: space.sm }}>
              <Field label="Pseudo" value={name} onChange={setName} maxLength={20} hint="3 à 20 caractères" />
              <Button size="md" kind="secondary" title="Enregistrer le pseudo" disabled={name.trim() === a.user?.name || !/^[\p{L}\p{N}_-]{3,20}$/u.test(name.trim())} onPress={() => void a.rename(name.trim()).then(() => toast("Pseudo mis à jour", "success")).catch((e) => toast(e.message, "error"))} />
            </View>
            <SettingRow icon="person-circle-outline" title="Avatar, cadre et badge" onPress={() => a.nav.open("collection")} />
            <SettingRow icon="mail-outline" title="Adresse email" subtitle={a.user?.email} last />
          </Group>
          <Group title="Confidentialité" footer="Votre profil n'est jamais listé publiquement. À table, les autres joueurs voient votre pseudo et vos cosmétiques publics.">
            <Switch k="showLevel" icon="ribbon-outline" title="Afficher mon niveau aux autres joueurs" last />
          </Group>
          <Group title="Sécurité">
            <SettingRow icon="key-outline" title="Session" subtitle="Jeton chiffré dans le trousseau iOS, expiration à 30 jours" />
            <SettingRow icon="log-out-outline" title="Se déconnecter" onPress={() => setLogout(true)} last />
          </Group>
          <Group title="Données personnelles">
            <SettingRow icon="document-text-outline" title="Données enregistrées" onPress={() => setData(true)} />
            <SettingRow icon="refresh-outline" title="Réinitialiser les préférences" onPress={() => { reset(); toast("Préférences réinitialisées", "success"); }} />
            <SettingRow icon="trash-outline" title="Supprimer mon compte" subtitle="Définitif : compte, StackCoins, collection et préférences" onPress={() => setDel(true)} last />
          </Group>
          <T v="caption" center>STACKORA 0.2 · Jeu de poker sans argent réel</T>
        </>
      )}
      <Confirm visible={logout} title="Se déconnecter ?" body="Votre collection et votre solde restent attachés à votre compte." confirm="Déconnexion" onCancel={() => setLogout(false)} onConfirm={() => { setLogout(false); void a.logout(); }} />
      <Sheet visible={del} onClose={() => setDel(false)} title="Supprimer le compte">
        <T v="body">Cette action supprime définitivement votre compte, vos sessions, vos StackCoins, votre collection et vos préférences. Terminez d'abord vos tournois en cours.</T>
        <Field label="Mot de passe" value={password} onChange={setPassword} secure />
        <Button kind="danger" title="Supprimer définitivement" disabled={!password} onPress={() => void a.deleteAccount(password).then(() => toast("Compte supprimé", "success")).catch((e) => toast(e.message, "error"))} />
      </Sheet>
      <Sheet visible={data} onClose={() => setData(false)} title="Vos données">
        {[
          ["Compte", "Pseudo, email, mot de passe haché (scrypt salé)."],
          ["Sessions", "Empreinte SHA-256 du jeton, date d'expiration."],
          ["Tournois", "État des parties auxquelles vous participez, classements."],
          ["Économie", "Solde StackCoins, journal des transactions, collection, équipement."],
          ["Progression", "XP, sessions d'exercices récompensées."],
          ["Préférences", "Les réglages de cet écran, synchronisés avec votre compte."],
        ].map(([t, d]) => <SettingRow key={t} title={t} subtitle={d} />)}
        <T v="caption">Les cartes privées sont conservées uniquement dans l'historique serveur de l'opérateur et ne sont jamais exposées par l'API.</T>
      </Sheet>
    </Screen>
  );
}

/** Centre de notifications in-app : tournois, missions, transactions. */
export function NotificationsScreen({ openTournament }: { openTournament: (id: string) => void }) {
  const a = useApp();
  const toast = useToast();
  const [ledger, setLedger] = useState<{ delta: number; kind: string; ref: string | null; created: number }[]>([]);
  useEffect(() => {
    void a.api("/wallet").then((w) => setLedger(w.ledger)).catch(() => {});
    void a.loadMissions().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const lobby = a.list.filter((t) => t.status !== "finished");
  const KIND: Record<string, string> = { welcome: "Bonus de bienvenue", reward: "Récompense de tournoi", mission: "Mission accomplie", training: "Exercices", spend: "Achat cosmétique", purchase: "Achat de StackCoins", refund: "Remboursement App Store" };
  return (
    <Screen title="Notifications" back={a.nav.close} bottomInset={false}>
      {lobby.length > 0 && (
        <Group title="Tournois">
          {lobby.map((t, i) => <SettingRow key={t.id} icon={t.status === "playing" ? "play-circle" : "time-outline"} title={t.name} subtitle={t.status === "playing" ? "En cours : votre place vous attend" : `Inscriptions ouvertes · ${t.count} joueurs`} onPress={() => openTournament(t.id)} last={i === lobby.length - 1} />)}
        </Group>
      )}
      <SectionHeader title="Missions" />
      <Surface padded={false} style={{ paddingHorizontal: space.md }}>
        {a.missions.map((m) => <MissionRow key={m.id} m={m} onClaim={() => void a.claimMission(m.id).then((r) => toast(`+${r.coins} StackCoins · +${r.xp} XP`, "reward")).catch((e) => toast(e.message, "error"))} />)}
      </Surface>
      <SectionHeader title="Activité StackCoins" />
      {ledger.length === 0 ? (
        <Empty icon="receipt-outline" title="Aucune transaction" body="Vos gains et achats apparaîtront ici." />
      ) : (
        <Group>
          {ledger.map((l, i) => (
            <SettingRow key={i} title={KIND[l.kind] ?? l.kind} subtitle={new Date(l.created).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} right={<Row gap={5}><CoinGlyph size={13} /><Text style={[type.number, { color: l.delta > 0 ? color.success : color.textSoft }]}>{l.delta > 0 ? "+" : ""}{formatCoins(l.delta)}</Text></Row>} last={i === ledger.length - 1} />
          ))}
        </Group>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  pick: { width: 112, padding: 8, gap: 6, borderRadius: radius.md, borderWidth: 1.5, borderColor: color.hairline, backgroundColor: color.surface },
});
