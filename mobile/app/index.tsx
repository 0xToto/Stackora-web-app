import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { storage as SecureStore } from "../src/storage";
import { useStackora } from "../src/useStackora";
import { PokerTable } from "../src/PokerTable";
import type { Variant } from "../src/types";
const C = {
  bg: "#101315",
  panel: "#19201F",
  green: "#102C27",
  felt: "#1B453C",
  gold: "#D5AB62",
  text: "#F5F1E8",
  muted: "#A5B5AD",
  line: "#32423B",
  red: "#D97676",
};
async function shareTournament(name: string, code: string) {
  const message = `Rejoins ${name} sur STACKORA ! Code : ${code}.`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const shareData = { title: "Invitation STACKORA", text: message, url: window.location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {
        if ((e as Error)?.name !== "AbortError") console.warn("Partage impossible", e);
      }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${message} ${window.location.origin}`);
      window.alert("Invitation copiée dans le presse-papiers !");
    } else {
      window.prompt("Copiez cette invitation :", `${message} ${window.location.origin}`);
    }
    return;
  }
  await Share.share({ message: `${message} Ouvre l'application et saisis ce code.` });
}

const modes: {
  id: Variant;
  name: string;
  description: string;
  symbol: string;
}[] = [
  {
    id: "classic",
    name: "Texas Hold’em",
    description: "Le classique. Vos amis. Vos règles.",
    symbol: "♠",
  },
  {
    id: "sevenTwo",
    name: "7 / 2 Game",
    description: "Gagnez avec 7-2, encaissez une prime.",
    symbol: "72",
  },
  {
    id: "ghost",
    name: "Ghost Poker",
    description: "Un adversaire invisible. Un pot qui survit.",
    symbol: "◈",
  },
  {
    id: "redRiver",
    name: "Red River",
    description: "Une river rouge ? La partie continue.",
    symbol: "♥",
  },
];
function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (disabled || pressed) && { opacity: 0.45 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}
function Field({
  label,
  value,
  onChange,
  secure = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  numeric?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        style={s.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={numeric ? "number-pad" : "default"}
        placeholderTextColor={C.muted}
      />
    </View>
  );
}
function Mark() {
  return (
    <View style={s.mark}>
      <Text style={{ color: C.gold, fontSize: 30 }}>◈</Text>
    </View>
  );
}
export default function App() {
  const a = useStackora();
  const [screen, setScreen] = useState<"home" | "create" | "settings">("home");
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("La table des amis");
  const [variant, setVariant] = useState<Variant>("classic");
  const [capacity, setCapacity] = useState("16");
  const [stack, setStack] = useState("2000");
  const [bb, setBB] = useState("50");
  const [duration, setDuration] = useState("180");
  const [decision, setDecision] = useState("20");
  const [botCount, setBotCount] = useState("7");
  const [units, setUnits] = useState(false);
  const [felt, setFelt] = useState(C.felt);
  const [tableIndex, setTableIndex] = useState<number | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("stackora-prefs")
      .then((v) => {
        if (v) {
          const p = JSON.parse(v);
          setUnits(p.units);
          setFelt(p.felt);
        }
      })
      .catch(() => {});
  }, []);
  async function prefs(u: boolean, f: string) {
    setUnits(u);
    setFelt(f);
    await SecureStore.setItemAsync(
      "stackora-prefs",
      JSON.stringify({ units: u, felt: f }),
    );
  }
  const g = a.game;
  const own =
    g?.tables.findIndex((t) => t.players.includes(a.user?.id ?? "")) ?? -1;
  const table = g?.tables[tableIndex ?? Math.max(0, own)];
  const h = table?.hand;
  async function open(id: string) {
    await a.safe(async () => {
      a.update(await a.api("/tournaments/" + id));
      setTableIndex(null);
    });
  }
  function back() {
    if (g) {
      a.setGame(null);
      setTableIndex(null);
      void a.safe(a.refresh);
    } else setScreen("home");
  }
  if (!a.hydrated)
    return (
      <SafeAreaView style={[s.root, { justifyContent: "center" }]}>
        <ActivityIndicator color={C.gold} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[s.top, g?.status === "playing" && { height: 52, paddingVertical: 0 }]}>
          <Pressable onPress={back} style={s.row}>
            <Mark />
            <View>
              <Text style={s.brand}>STACKORA</Text>
              <Text style={s.tag}>YOUR TABLE. YOUR RULES.</Text>
            </View>
          </Pressable>
          {a.user && (
            <Pressable
              accessibilityLabel="Personnalisation"
              onPress={() => {
                a.setGame(null);
                setScreen("settings");
              }}
              style={s.profile}
            >
              <Text style={{ color: C.gold, fontWeight: "700" }}>
                {a.user.name.slice(0, 2).toUpperCase()}
              </Text>
            </Pressable>
          )}
        </View>
        {!!a.error && (
          <Pressable
            accessibilityLabel="Fermer l’erreur"
            onPress={() => a.setError("")}
            style={s.error}
          >
            <Text style={{ color: "#FFD7D7" }}>{a.error} ×</Text>
          </Pressable>
        )}
        {a.busy && (
          <ActivityIndicator
            style={{ position: "absolute", right: 20, top: 84, zIndex: 9 }}
            color={C.gold}
          />
        )}
        <ScrollView
          scrollEnabled={g?.status !== "playing"}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.content,
            { maxWidth: g?.status === "playing" ? 1000 : 600, width: "100%", alignSelf: "center" },
            g?.status === "playing" && { padding: 0, gap: 0, paddingBottom: 0, flexGrow: 1 },
          ]}
        >
          {!a.user ? (
            <>
              <View style={{ paddingTop: 38, gap: 12 }}>
                <Label>LE POKER, ENTRE VOUS.</Label>
                <Text style={s.hero}>
                  Les bonnes cartes.{"\n"}La bonne compagnie.
                </Text>
                <Text style={s.body}>
                  Créez votre table privée et retrouvez vos amis, où qu’ils
                  soient.
                </Text>
              </View>
              <View style={s.panel}>
                <Text style={s.heading}>
                  {register ? "Créer votre compte" : "Bienvenue à la table"}
                </Text>
                {register && (
                  <Field
                    label="Pseudo unique"
                    value={name}
                    onChange={setName}
                  />
                )}
                <Field
                  label="Adresse email"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Mot de passe · 10 caractères minimum"
                  value={password}
                  onChange={setPassword}
                  secure
                />
                <Button
                  title={register ? "Créer mon compte" : "Se connecter"}
                  disabled={a.busy}
                  onPress={() =>
                    void a.login(email, password, register ? name : undefined)
                  }
                />
                <Button
                  secondary
                  title={register ? "J’ai déjà un compte" : "Créer un compte"}
                  onPress={() => setRegister(!register)}
                />
              </View>
              <Field
                label="Adresse du serveur de test"
                value={a.url}
                onChange={a.setUrl}
              />
              <Text style={s.caption}>
                Version de développement · Jeu sans argent réel. L’email n’est
                pas encore vérifié dans cette version.
              </Text>
            </>
          ) : g ? (
            <>
              {g.status !== "playing" && <Pressable onPress={back}>
                <Text style={s.link}>‹ Mes tournois</Text>
              </Pressable>}
              <View style={[s.row, { justifyContent: "space-between", paddingHorizontal: g.status === "playing" ? 12 : 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[s.heading, g.status === "playing" && { fontSize: 13, lineHeight: 24 }]}>{g.name}</Text>
                  {g.status !== "playing" && <Label>{modes.find((m) => m.id === g.variant)?.name}</Label>}
                </View>
                <Text
                  style={{ color: a.online ? "#80C6A2" : C.gold, fontSize: 11 }}
                >
                  {a.online ? "● En direct" : "○ Synchronisation"}
                </Text>
              </View>
              {g.status === "lobby" ? (
                <>
                  <View style={[s.panel, { backgroundColor: C.green }]}>
                    <Label>VOTRE CODE D’INVITATION</Label>
                    <Text
                      selectable
                      style={{
                        fontSize: 29,
                        letterSpacing: 3,
                        color: C.gold,
                        fontWeight: "700",
                      }}
                    >
                      {g.code}
                    </Text>
                    <Text style={s.body}>
                      Invitez vos amis. Ils rejoignent le tournoi avec ce code.
                    </Text>
                    <Button
                      title="Partager l’invitation"
                      onPress={() =>
                        void shareTournament(g.name, g.code)
                      }
                    />
                  </View>
                  <View style={[s.row, { justifyContent: "space-between" }]}>
                    <Text style={s.heading}>À la table</Text>
                    <Text style={s.caption}>
                      {g.players.length} / {g.maxPlayers} joueurs
                    </Text>
                  </View>
                  {g.players.map((p, i) => (
                    <View style={s.playerRow} key={p.id}>
                      <View style={s.profile}>
                        <Text style={{ color: C.gold }}>{p.name[0]}</Text>
                      </View>
                      <Text style={[s.body, { flex: 1 }]}>{p.name}</Text>
                      <Text style={s.caption}>
                        {p.bot ? "BOT" : p.id === g.owner ? "HÔTE" : "JOUEUR"}
                      </Text>
                    </View>
                  ))}
                  <View style={s.panel}>
                    <Text style={s.body}>
                      {g.startingStack.toLocaleString("fr-FR")} jetons • Blinds{" "}
                      {Math.floor(g.initialBB / 2)} / {g.initialBB}
                    </Text>
                    <Text style={s.caption}>
                      Niveaux de {g.levelSeconds}s • Décisions de{" "}
                      {g.decisionSeconds}s • 8-max
                    </Text>
                  </View>
                  {g.owner === a.user.id && (
                    <>
                      <Field
                        label="Nombre de bots à ajouter"
                        value={botCount}
                        onChange={setBotCount}
                        numeric
                      />
                      <Button
                        secondary
                        title="Compléter avec des bots"
                        disabled={a.busy}
                        onPress={() =>
                          void a.mutate(`/tournaments/${g.id}/bots`, {
                            count: Number(botCount),
                          })
                        }
                      />
                      <Button
                        title="Lancer le tournoi →"
                        disabled={a.busy || g.players.length < 2}
                        onPress={() =>
                          void a.mutate(`/tournaments/${g.id}/start`, {})
                        }
                      />
                    </>
                  )}
                </>
              ) : g.status === "finished" ? (
                <>
                  <View
                    style={[s.panel, { alignItems: "center", padding: 32 }]}
                  >
                    <Text style={{ fontSize: 56, color: C.gold }}>♔</Text>
                    <Label>LE TOURNOI EST TERMINÉ</Label>
                    <Text style={s.hero}>{g.results[0]?.name}</Text>
                    <Text style={s.body}>
                      Une belle victoire. Une autre table ?
                    </Text>
                  </View>
                  {g.results.map((r) => (
                    <View key={r.id} style={s.playerRow}>
                      <Text
                        style={{
                          fontSize: 24,
                          color: r.rank === 1 ? C.gold : C.muted,
                          width: 45,
                        }}
                      >
                        #{r.rank}
                      </Text>
                      <Text style={s.body}>{r.name}</Text>
                    </View>
                  ))}
                  <Button title="Retour à mes tournois" onPress={back} />
                </>
              ) : h ? (
                <PokerTable game={g} userId={a.user.id} busy={a.busy} units={units} felt={felt} toggleUnits={() => void prefs(!units, felt)} play={a.play} />
              ) : (
                <Text style={s.body}>Préparation des tables…</Text>
              )}
            </>
          ) : screen === "create" ? (
            <>
              <Pressable onPress={back}>
                <Text style={s.link}>‹ Retour</Text>
              </Pressable>
              <Label>VOTRE TABLE. VOS RÈGLES.</Label>
              <Text style={s.hero}>Une soirée{"\n"}qui vous ressemble.</Text>
              <Field label="Nom du tournoi" value={title} onChange={setTitle} />
              <Label>CHOISISSEZ VOTRE VARIANTE</Label>
              {modes.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setVariant(m.id)}
                  style={[
                    s.mode,
                    variant === m.id && {
                      borderColor: C.gold,
                      backgroundColor: C.green,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 29, color: C.gold, width: 45 }}>
                    {m.symbol}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heading}>{m.name}</Text>
                    <Text style={s.caption}>{m.description}</Text>
                  </View>
                  <Text style={{ color: C.gold }}>
                    {variant === m.id ? "●" : "○"}
                  </Text>
                </Pressable>
              ))}
              <Field
                label="Joueurs maximum · de 2 à 32"
                value={capacity}
                onChange={setCapacity}
                numeric
              />
              <Field
                label="Stack de départ"
                value={stack}
                onChange={setStack}
                numeric
              />
              <Field
                label="Grosse blinde initiale"
                value={bb}
                onChange={setBB}
                numeric
              />
              <Field
                label="Durée des niveaux en secondes · min 30"
                value={duration}
                onChange={setDuration}
                numeric
              />
              <Field
                label="Temps de décision en secondes · de 5 à 120"
                value={decision}
                onChange={setDecision}
                numeric
              />
              <Text style={s.caption}>
                Les blinds doublent à chaque niveau, jusqu’au niveau 13. Chaque
                table accueille 8 joueurs au maximum.
              </Text>
              <Button
                title="Créer mon tournoi →"
                disabled={a.busy}
                onPress={() =>
                  void a.mutate("/tournaments", {
                    name: title,
                    variant,
                    maxPlayers: Number(capacity),
                    startingStack: Number(stack),
                    initialBB: Number(bb),
                    levelSeconds: Number(duration),
                    decisionSeconds: Number(decision),
                  })
                }
              />
            </>
          ) : screen === "settings" ? (
            <>
              <Pressable onPress={back}>
                <Text style={s.link}>‹ Retour</Text>
              </Pressable>
              <Text style={s.hero}>À votre image.</Text>
              <Text style={s.body}>
                {a.user.name} · {a.user.email}
              </Text>
              <Label>VOTRE TAPIS · GRATUIT EN VERSION TEST</Label>
              {[
                { name: "Classic Green", color: C.felt },
                { name: "Midnight", color: "#19252F" },
                { name: "Red Velvet", color: "#542C35" },
                { name: "Royal Gold", color: "#50432A" },
              ].map((v) => (
                <Pressable
                  key={v.name}
                  onPress={() => void prefs(units, v.color)}
                  style={[
                    s.mode,
                    { backgroundColor: v.color },
                    felt === v.color && { borderColor: C.gold },
                  ]}
                >
                  <Text style={[s.heading, { flex: 1 }]}>{v.name}</Text>
                  <Text style={{ color: C.gold }}>
                    {felt === v.color ? "●" : "○"}
                  </Text>
                </Pressable>
              ))}
              <Button
                secondary
                title={
                  units ? "Stacks affichés en BB" : "Stacks affichés en jetons"
                }
                onPress={() => void prefs(!units, felt)}
              />
              <Text style={s.caption}>
                Les choix sont enregistrés sur cet appareil. Aucun achat ni
                Stack Coin n’est activé dans cette version.
              </Text>
              <Button
                secondary
                title="Se déconnecter"
                onPress={() => void a.logout()}
              />
            </>
          ) : (
            <>
              <View style={{ paddingTop: 20, gap: 8 }}>
                <Label>BONJOUR, {a.user.name.toUpperCase()}</Label>
                <Text style={s.hero}>
                  La prochaine main{"\n"}se joue entre amis.
                </Text>
                <Text style={s.body}>
                  Vos règles. Votre rythme. Votre table.
                </Text>
              </View>
              <Pressable
                onPress={() => setScreen("create")}
                style={[
                  s.panel,
                  {
                    backgroundColor: C.green,
                    padding: 25,
                    minHeight: 170,
                    justifyContent: "space-between",
                  },
                ]}
              >
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Text style={{ fontSize: 45, color: C.gold }}>♠</Text>
                  <Text style={{ fontSize: 30, color: C.gold }}>↗</Text>
                </View>
                <Text style={s.heading}>Créer un tournoi</Text>
                <Text style={s.caption}>
                  De 2 à 32 joueurs · 4 variantes · 8-max
                </Text>
              </Pressable>
              <View style={s.panel}>
                <Text style={s.heading}>Vous avez une invitation ?</Text>
                <Field
                  label="Code du tournoi"
                  value={code}
                  onChange={setCode}
                />
                <Button
                  secondary
                  title="Rejoindre la table →"
                  disabled={a.busy}
                  onPress={() => void a.mutate("/join", { code })}
                />
              </View>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={s.heading}>Mes tournois</Text>
                <Pressable onPress={() => void a.safe(a.refresh)}>
                  <Text style={s.link}>Actualiser</Text>
                </Pressable>
              </View>
              {a.list.length === 0 ? (
                <Text style={s.body}>
                  Votre première table vous attend. Créez un tournoi et ajoutez
                  des bots pour essayer en solo.
                </Text>
              ) : (
                a.list.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => void open(t.id)}
                    style={s.mode}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Label>
                        {t.status === "playing"
                          ? "EN COURS"
                          : t.status === "finished"
                            ? "TERMINÉ"
                            : "INSCRIPTIONS"}
                      </Label>
                      <Text style={s.heading}>{t.name}</Text>
                      <Text style={s.caption}>
                        {t.count} joueurs ·{" "}
                        {modes.find((m) => m.id === t.variant)?.name}
                      </Text>
                    </View>
                    <Text style={{ color: C.gold, fontSize: 24 }}>›</Text>
                  </Pressable>
                ))
              )}
              <Text
                style={[s.caption, { textAlign: "center", paddingTop: 18 }]}
              >
                STACKORA / VERSION 0.1 · SANS ARGENT RÉEL
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#202A26",
  },
  content: { padding: 22, gap: 20, paddingBottom: 50 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { color: C.text, fontSize: 20, letterSpacing: 3, fontWeight: "800" },
  tag: { color: C.muted, fontSize: 8, letterSpacing: 1.4 },
  mark: {
    width: 38,
    height: 47,
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
    marginRight: 7,
  },
  hero: {
    color: C.text,
    fontSize: 35,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  heading: { color: C.text, fontSize: 20, fontWeight: "600" },
  body: { color: C.muted, fontSize: 15, lineHeight: 23 },
  caption: { color: C.muted, fontSize: 12, lineHeight: 18 },
  label: { color: C.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1.8 },
  panel: {
    backgroundColor: C.panel,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  button: {
    backgroundColor: C.gold,
    paddingHorizontal: 14,
    paddingVertical: 17,
    borderRadius: 13,
    alignItems: "center",
    minHeight: 52,
  },
  buttonText: { color: C.bg, fontSize: 15, fontWeight: "700" },
  secondary: {
    backgroundColor: "#25352F",
    borderWidth: 1,
    borderColor: C.line,
  },
  input: {
    backgroundColor: "#1B2421",
    color: C.text,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
  },
  link: { color: C.gold, fontSize: 12 },
  profile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  mode: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.panel,
  },
  error: {
    backgroundColor: "#592D2D",
    padding: 14,
    margin: 12,
    borderRadius: 10,
  },
  playerRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: C.line,
    paddingVertical: 11,
  },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  felt: {
    position: "absolute",
    borderRadius: 160,
    borderWidth: 8,
    borderColor: "#2B3730",
    boxShadow: "0px 8px 18px #00000070",
  },
  feltInner: {
    position: "absolute",
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    borderWidth: 1,
    borderColor: "#D5AB6230",
    borderRadius: 150,
  },
  board: {
    position: "absolute",
    top: 205,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 9,
  },
  pot: { fontWeight: "700", fontSize: 18, color: C.text },
  card: {
    width: 36,
    height: 54,
    borderRadius: 5,
    backgroundColor: C.text,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 3px #00000040",
  },
  seat: {
    position: "absolute",
    width: 86,
    marginLeft: -43,
    marginTop: -33,
    alignItems: "center",
    gap: 3,
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 22,
    backgroundColor: "#1C302B",
    borderWidth: 1,
    borderColor: "#486054",
    alignItems: "center",
    justifyContent: "center",
  },
  seatName: { fontSize: 10, color: C.text, fontWeight: "600", maxWidth: 80 },
  dealer: {
    position: "absolute",
    right: -8,
    bottom: -1,
    backgroundColor: C.text,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bet: { color: C.gold, fontSize: 10 },
  controls: {
    gap: 13,
    padding: 18,
    borderRadius: 20,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
  },
});
