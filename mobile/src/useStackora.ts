import { useCallback, useEffect, useRef, useState } from "react";
import { storage as SecureStore } from "./storage";
import type { User, Game, Summary, Profile, Catalog, Mission, Slot, Progress } from "./types";
export function useStackora() {
  const [url, setUrl] = useState(
    // Web : le serveur STACKORA tourne sur la même machine, port 3001 (pas sur le port d'Expo).
    process.env.EXPO_PUBLIC_API_URL ??
      (typeof window !== "undefined" && window.location?.hostname ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://192.168.1.20:3001"),
  );
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [list, setList] = useState<Summary[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const socket = useRef<WebSocket | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync("stackora-session")
      .then((s) => {
        if (s) {
          const v = JSON.parse(s);
          // Ancienne session web enregistrée avec l'adresse d'Expo : on garde l'adresse par défaut.
          const expoOrigin = typeof window !== "undefined" && v.url === window.location?.origin;
          if (!expoOrigin) setUrl(v.url);
          setToken(v.token);
          setUser(v.user);
        }
      })
      .catch(() => setError("Impossible de restaurer la session."))
      .finally(() => setHydrated(true));
  }, []);
  const api = useCallback(
    async (path: string, body?: unknown, method?: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const base = url.replace(/\/$/, "");
        const unreachable = `Le serveur STACKORA ne répond pas à l'adresse ${base}. Vérifie qu'il est lancé (npm run server) et l'adresse dans « Serveur de test ».`;
        let r: Response;
        try {
          r = await fetch(base + path, {
          method: method ?? (body ? "POST" : "GET"),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          });
        } catch (e) {
          throw Error(e instanceof Error && e.name === "AbortError" ? `Le serveur ${base} met trop de temps à répondre.` : unreachable);
        }
        // Réponse vide ou non JSON : ce n'est pas le serveur STACKORA (mauvaise adresse ou port).
        const text = await r.text();
        let v: any;
        try {
          v = text ? JSON.parse(text) : null;
        } catch {
          v = null;
        }
        if (v === null) throw Error(r.ok ? unreachable : `${unreachable} (code ${r.status})`);
        if (!r.ok) throw Error(v.error ?? "Erreur serveur");
        return v;
      } finally {
        clearTimeout(timeout);
      }
    },
    [url, token],
  );
  const safe = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }, []);
  const update = useCallback(
    (next: Game) =>
      setGame((current) =>
        current && current.id === next.id && current.version > next.version
          ? current
          : next,
      ),
    [],
  );
  const refresh = useCallback(
    async () => setList(await api("/tournaments")),
    [api],
  );
  const loadProfile = useCallback(async () => {
    const p: Profile = await api("/me/profile");
    setProfile(p);
    setBalance(p.wallet.balance);
    return p;
  }, [api]);
  const loadCatalog = useCallback(async () => {
    const c: Catalog = await api("/shop/catalog");
    setCatalog(c);
    setBalance(c.balance);
    return c;
  }, [api]);
  const loadMissions = useCallback(async () => setMissions(await api("/missions")), [api]);
  useEffect(() => {
    if (!token) return;
    void refresh().catch((e) => setError(e.message));
    void loadProfile().catch(() => {});
    void loadCatalog().catch(() => {});
    void loadMissions().catch(() => {});
  }, [token, refresh, loadProfile, loadCatalog, loadMissions]);
  // Après un tournoi terminé, les récompenses serveur changent le solde et les missions.
  const finishedSeen = useRef<string | null>(null);
  useEffect(() => {
    if (game?.status === "finished" && finishedSeen.current !== game.id) {
      finishedSeen.current = game.id;
      void loadProfile().catch(() => {});
      void loadMissions().catch(() => {});
    }
  }, [game?.status, game?.id, loadProfile, loadMissions]);
  useEffect(() => {
    if (!token || !game?.id) return;
    let stopped = false;
    let retry: ReturnType<typeof setTimeout>;
    const id = game.id;
    function connect() {
      const ws = new WebSocket(
        url.replace(/^http/, "ws").replace(/\/$/, "") + "/ws",
      );
      socket.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token }));
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "authenticated") {
          setOnline(true);
          ws.send(JSON.stringify({ type: "subscribe", id }));
        }
        if (msg.type === "state") update(msg.state);
        if (msg.type === "error") setError(msg.error);
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        setOnline(false);
        if (!stopped) retry = setTimeout(connect, 2000);
      };
    }
    connect();
    const poll = setInterval(
      () =>
        void api("/tournaments/" + id)
          .then(update)
          .catch(() => setOnline(false)),
      5000,
    );
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(poll);
      socket.current?.close();
    };
  }, [token, game?.id, url, api, update]);
  async function login(email: string, password: string, name?: string) {
    await safe(async () => {
      const v = await api(name ? "/auth/register" : "/auth/login", {
        email,
        password,
        ...(name ? { name } : {}),
      });
      await SecureStore.setItemAsync(
        "stackora-session",
        JSON.stringify({ ...v, url }),
      );
      setToken(v.token);
      setUser(v.user);
    });
  }
  async function logout() {
    await safe(async () => {
      try {
        await api("/auth/logout", {});
      } finally {
        await SecureStore.deleteItemAsync("stackora-session");
        setToken("");
        setUser(null);
        setGame(null);
        setList([]);
        setProfile(null);
        setCatalog(null);
        setMissions([]);
        setBalance(null);
      }
    });
  }
  async function mutate(path: string, body: unknown) {
    await safe(async () => update(await api(path, body)));
  }
  async function play(type: string, amount?: number) {
    if (!game) return;
    const actionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await safe(async () => {
      try {
        update(
          await api(`/tournaments/${game.id}/action`, {
            type,
            amount,
            version: game.version,
            actionId,
          }),
        );
      } catch (e) {
        update(await api("/tournaments/" + game.id));
        throw e;
      }
    });
  }
  async function buy(itemId: string) {
    const r = await api("/shop/purchase", { itemId, idempotencyKey: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` });
    setBalance(r.balance);
    setCatalog((c) => (c ? { ...c, balance: r.balance, owned: r.owned } : c));
    void loadProfile().catch(() => {});
    return r as { duplicate: boolean; balance: number };
  }
  async function equip(slot: Slot, itemId: string) {
    const r = await api("/shop/equip", { slot, itemId });
    setCatalog((c) => (c ? { ...c, equipped: r.equipped } : c));
    setProfile((p) => (p ? { ...p, equipped: r.equipped } : p));
    return r.equipped as Record<Slot, string>;
  }
  async function claimMission(id: string) {
    const r = await api("/missions/claim", { id });
    setBalance(r.balance);
    await loadMissions();
    void loadProfile().catch(() => {});
    return r as { coins: number; xp: number; capped: boolean };
  }
  async function submitTraining(s: { sessionId: string; module: "positions" | "gto"; category: string; correct: number; total: number }) {
    const r = await api("/training/sessions", s);
    setBalance(r.balance);
    void loadMissions().catch(() => {});
    void loadProfile().catch(() => {});
    return r as { coins: number; xp: number; reason?: string; progress: Progress };
  }
  async function rename(name: string) {
    const u = await api("/me", { name }, "PATCH");
    setUser(u);
    await SecureStore.setItemAsync("stackora-session", JSON.stringify({ token, user: u, url }));
    void loadProfile().catch(() => {});
  }
  async function deleteAccount(password: string) {
    await api("/me/delete", { password });
    await SecureStore.deleteItemAsync("stackora-session");
    setToken("");
    setUser(null);
    setGame(null);
    setList([]);
    setProfile(null);
  }
  /** Paiement web : le serveur crée la session Stripe, le navigateur y est redirigé. */
  async function checkout(productId: string) {
    const r = await api("/pay/stripe/checkout", { productId });
    return r as { id: string; url: string; test: boolean };
  }
  /** Au retour de Stripe : le serveur relit la session chez Stripe avant de créditer. */
  const confirmPayment = useCallback(
    async (sessionId: string) => {
      const r = await api("/pay/stripe/confirm", { sessionId });
      if (typeof r.balance === "number") setBalance(r.balance);
      return r as { status: "paid" | "pending"; coins?: number; duplicate?: boolean; balance: number };
    },
    [api],
  );
  const savePrefs = useCallback(async (prefs: Record<string, unknown>) => api("/me/prefs", prefs, "PUT"), [api]);
  const fetchPrefs = useCallback(async () => api("/me/prefs") as Promise<{ prefs: Record<string, unknown> | null; updated: number }>, [api]);
  return {
    token,
    profile,
    catalog,
    missions,
    balance,
    loadProfile,
    loadCatalog,
    loadMissions,
    buy,
    equip,
    claimMission,
    submitTraining,
    rename,
    deleteAccount,
    savePrefs,
    fetchPrefs,
    checkout,
    confirmPayment,
    url,
    setUrl,
    user,
    game,
    setGame,
    list,
    error,
    setError,
    busy,
    online,
    hydrated,
    api,
    safe,
    refresh,
    login,
    logout,
    mutate,
    play,
    update,
  };
}
