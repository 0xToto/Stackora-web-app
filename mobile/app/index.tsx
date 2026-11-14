import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, BackHandler, Easing, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Fraunces_500Medium_Italic, Fraunces_600SemiBold, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../src/theme";
import { SettingsProvider, useSettings, type Prefs } from "../src/settings";
import { ToastProvider, useToast } from "../src/ui";
import { useStackora } from "../src/useStackora";
import { AppProvider, type Nav, type Overlay, type Tab } from "../src/app-context";
import { Splash, TabBar, TopBar } from "../src/screens/shell";
import { AuthScreen } from "../src/screens/auth";
import { HomeScreen } from "../src/screens/home";
import { CreateScreen, PlayScreen, TournamentScreen } from "../src/screens/tournaments";
import { CollectionScreen, ProfileScreen, ShopScreen } from "../src/screens/shop";
import { RulesScreen } from "../src/screens/rules";
import { TrainingScreen } from "../src/screens/training";
import { NotificationsScreen, SettingsScreen } from "../src/screens/settings";

export default function Root() {
  const [fonts] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Fraunces_500Medium_Italic, Fraunces_600SemiBold, Fraunces_700Bold, ...Ionicons.font });
  return (
    <SettingsProvider>
      <ToastProvider>
        <View style={{ flex: 1, backgroundColor: color.bg }}>
          <StatusBar style="light" />
          {fonts ? <Shell /> : <Splash />}
        </View>
      </ToastProvider>
    </SettingsProvider>
  );
}

/** Transition douce entre onglets et écrans. */
function Scene({ id, children }: { id: string; children: React.ReactNode }) {
  const { reduceMotion } = useSettings();
  const a = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return a.setValue(1);
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [id, a, reduceMotion]);
  return <Animated.View style={{ flex: 1, opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>{children}</Animated.View>;
}

function Shell() {
  const a = useStackora();
  const toast = useToast();
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [splash, setSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 700);
    return () => clearTimeout(t);
  }, []);
  const nav: Nav = {
    tab,
    overlay,
    go: (t) => {
      setOverlay(null);
      a.setGame(null);
      setTab(t);
    },
    open: (o) => setOverlay(o),
    close: () => setOverlay(null),
  };

  // Erreurs réseau → toast, sans masquer l'écran.
  useEffect(() => {
    if (a.error && a.user) {
      toast(a.error, "error");
      a.setError("");
    }
  }, [a.error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Préférences : restauration depuis le compte à la connexion, puis synchronisation différée.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false);
  useEffect(() => {
    ready.current = false;
    if (!a.token) return;
    void a
      .fetchPrefs()
      .then((r) => settings.hydrate(r.prefs as Partial<Prefs> | null, r.updated))
      .catch(() => {})
      .finally(() => (ready.current = true));
  }, [a.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!a.token || !ready.current) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void a.savePrefs(settings.prefs as unknown as Record<string, unknown>).catch(() => {}), 800);
  }, [settings.prefs, a.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Retour de Stripe Checkout (web) : confirmation serveur, puis nettoyage de l'URL.
  const handledReturn = useRef(false);
  useEffect(() => {
    if (Platform.OS !== "web" || !a.token || handledReturn.current) return;
    const params = new URLSearchParams(globalThis.location?.search ?? "");
    const state = params.get("checkout");
    if (!state) return;
    handledReturn.current = true;
    globalThis.history?.replaceState(null, "", globalThis.location.pathname);
    if (state === "cancel") return toast("Paiement annulé : rien n'a été débité.", "info");
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    setTab("shop");
    void (async () => {
      // Le paiement peut mettre quelques secondes à être confirmé par Stripe.
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const r = await a.confirmPayment(sessionId);
          if (r.status === "paid") {
            toast(r.duplicate ? "Paiement déjà crédité." : `+${(r.coins ?? 0).toLocaleString("fr-FR")} StackCoins crédités`, "reward");
            void a.loadCatalog().catch(() => {});
            return;
          }
        } catch (e) {
          return toast(e instanceof Error ? e.message : "Vérification du paiement impossible", "error");
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      toast("Paiement en cours de confirmation : vos StackCoins arriveront dans quelques instants.", "info");
    })();
  }, [a.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTournament = useCallback(
    async (id: string) => {
      setOverlay(null);
      try {
        a.update(await a.api("/tournaments/" + id));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Tournoi introuvable", "error");
      }
    },
    [a, toast],
  );
  const join = useCallback(
    async (code: string) => {
      try {
        a.update(await a.api("/join", { code: code.trim().toUpperCase() }));
        toast("Vous avez rejoint la table", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Code inconnu", "error");
      }
    },
    [a, toast],
  );
  const leaveTournament = useCallback(() => {
    a.setGame(null);
    void a.refresh().catch(() => {});
  }, [a]);

  // Bouton retour Android / geste : ferme d'abord la couche courante.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (a.game) return leaveTournament(), true;
      if (overlay) return setOverlay(null), true;
      return false;
    });
    return () => sub.remove();
  }, [a.game, overlay, leaveTournament]);

  if (!a.hydrated || splash) return <Splash />;
  if (!a.user) return <SafeAreaView style={st.root}><AuthScreen a={a} /></SafeAreaView>;

  const playing = a.game?.status === "playing";
  const notifications = a.missions.filter((m) => m.progress >= m.target && !m.claimed).length;
  let body: React.ReactNode;
  let key: string;
  if (a.game) {
    key = "game-" + a.game.id + a.game.status;
    body = <TournamentScreen onBack={leaveTournament} />;
  } else if (overlay) {
    key = "o-" + overlay;
    body =
      overlay === "profile" ? <ProfileScreen /> :
      overlay === "settings" ? <SettingsScreen /> :
      overlay === "collection" ? <CollectionScreen /> :
      overlay === "notifications" ? <NotificationsScreen openTournament={(id) => void openTournament(id)} /> :
      <CreateScreen onCreated={() => setOverlay(null)} />;
  } else {
    key = "t-" + tab;
    body =
      tab === "home" ? <HomeScreen openTournament={(id) => void openTournament(id)} join={(c) => void join(c)} /> :
      tab === "play" ? <PlayScreen openTournament={(id) => void openTournament(id)} join={(c) => void join(c)} /> :
      tab === "train" ? <TrainingScreen /> :
      tab === "rules" ? <RulesScreen /> :
      <ShopScreen />;
  }
  const showChrome = !a.game && !overlay;
  return (
    <AppProvider value={a} nav={nav}>
      <SafeAreaView style={st.root} edges={playing ? ["top", "bottom", "left", "right"] : ["top", "left", "right"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {showChrome && <TopBar notifications={notifications} />}
          <Scene id={key}>{body}</Scene>
          {a.busy && !playing && <View pointerEvents="none" style={st.busy}><ActivityIndicator color={color.gold} /></View>}
        </KeyboardAvoidingView>
        {showChrome && <TabBar />}
      </SafeAreaView>
    </AppProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  busy: { position: "absolute", top: 12, alignSelf: "center" },
});
