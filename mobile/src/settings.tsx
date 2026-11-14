import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { durable } from "./storage";

/**
 * Préférences personnelles. Elles ne modifient jamais les règles ni ce que voient
 * les autres joueurs : les cosmétiques publics sont gérés par l'inventaire serveur.
 */
export type Prefs = {
  animations: "full" | "reduced" | "off";
  ambientGlow: boolean;
  density: "comfortable" | "compact";
  fourColor: boolean;
  stackUnit: "chips" | "bb";
  potUnit: "chips" | "bb";
  showBets: boolean;
  confirmAllIn: boolean;
  confirmLargeBet: boolean;
  preactions: boolean;
  presetStyle: "smart" | "pot";
  showSlider: boolean;
  highlightActive: boolean;
  showTimer: boolean;
  riverPeel: boolean;
  showEquity: boolean;
  volume: number;
  sfx: boolean;
  chipSounds: boolean;
  cardSounds: boolean;
  winSounds: boolean;
  haptics: boolean;
  buttonHaptics: boolean;
  silent: boolean;
  notifInvites: boolean;
  notifStart: boolean;
  notifSoon: boolean;
  notifRewards: boolean;
  notifNews: boolean;
  notifSocial: boolean;
  showLevel: boolean;
};
export const DEFAULT_PREFS: Prefs = {
  animations: "full",
  ambientGlow: true,
  density: "comfortable",
  fourColor: true,
  stackUnit: "chips",
  potUnit: "chips",
  showBets: true,
  confirmAllIn: true,
  confirmLargeBet: false,
  preactions: true,
  presetStyle: "smart",
  showSlider: true,
  highlightActive: true,
  showTimer: true,
  riverPeel: true,
  showEquity: true,
  volume: 0.7,
  sfx: true,
  chipSounds: true,
  cardSounds: true,
  winSounds: true,
  haptics: true,
  buttonHaptics: true,
  silent: false,
  notifInvites: true,
  notifStart: true,
  notifSoon: true,
  notifRewards: true,
  notifNews: false,
  notifSocial: true,
  showLevel: true,
};
const KEY = "stackora-prefs-v2";
type Ctx = {
  prefs: Prefs;
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  reset: () => void;
  /** true si l'utilisateur ou le système demande de réduire les animations. */
  reduceMotion: boolean;
  updated: number;
  hydrate: (remote: Partial<Prefs> | null, remoteUpdated: number) => void;
};
const SettingsContext = createContext<Ctx | null>(null);
/** Accès hors React (sons, haptique). */
export const livePrefs = { current: DEFAULT_PREFS };

export function SettingsProvider({ children, onChange }: { children: React.ReactNode; onChange?: (p: Prefs) => void }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [updated, setUpdated] = useState(0);
  const [systemReduce, setSystemReduce] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    void durable.get(KEY).then((raw) => {
      if (!raw) return;
      try {
        const v = JSON.parse(raw);
        const next = { ...DEFAULT_PREFS, ...v.prefs };
        livePrefs.current = next;
        setPrefs(next);
        setUpdated(v.updated ?? 0);
      } catch {
        /* préférences corrompues : on garde les valeurs par défaut */
      }
    });
    AccessibilityInfo.isReduceMotionEnabled?.().then(setSystemReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setSystemReduce);
    return () => sub?.remove?.();
  }, []);
  const persist = useCallback((next: Prefs, at: number) => {
    livePrefs.current = next;
    void durable.set(KEY, JSON.stringify({ prefs: next, updated: at }));
  }, []);
  const set = useCallback<Ctx["set"]>(
    (key, value) =>
      setPrefs((p) => {
        const next = { ...p, [key]: value };
        const at = Date.now();
        setUpdated(at);
        persist(next, at);
        onChangeRef.current?.(next);
        return next;
      }),
    [persist],
  );
  const reset = useCallback(() => {
    const at = Date.now();
    setPrefs(DEFAULT_PREFS);
    setUpdated(at);
    persist(DEFAULT_PREFS, at);
    onChangeRef.current?.(DEFAULT_PREFS);
  }, [persist]);
  /** Synchronisation compte : la version la plus récente gagne. */
  const hydrate = useCallback<Ctx["hydrate"]>(
    (remote, remoteUpdated) => {
      if (!remote) {
        onChangeRef.current?.(livePrefs.current);
        return;
      }
      setUpdated((local) => {
        if (remoteUpdated > local) {
          const next = { ...DEFAULT_PREFS, ...remote };
          setPrefs(next);
          persist(next, remoteUpdated);
          return remoteUpdated;
        }
        if (local > remoteUpdated) onChangeRef.current?.(livePrefs.current);
        return local;
      });
    },
    [persist],
  );
  const reduceMotion = systemReduce || prefs.animations !== "full";
  return <SettingsContext.Provider value={{ prefs, set, reset, reduceMotion, updated, hydrate }}>{children}</SettingsContext.Provider>;
}
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw Error("SettingsProvider manquant");
  return ctx;
}
