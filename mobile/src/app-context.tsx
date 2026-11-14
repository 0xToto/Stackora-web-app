import React, { createContext, useContext, useMemo } from "react";
import { useStackora } from "./useStackora";
import type { Item, Slot } from "./types";

export type Tab = "home" | "play" | "train" | "rules" | "shop";
export type Overlay = null | "profile" | "settings" | "notifications" | "create" | "collection";
export type Nav = { tab: Tab; overlay: Overlay; go: (t: Tab) => void; open: (o: Overlay) => void; close: () => void };
type Ctx = ReturnType<typeof useStackora> & { nav: Nav; itemById: (id?: string) => Item | undefined; lookOf: (id?: string) => Record<string, any> | undefined; mine: (slot: Slot) => Item | undefined };
const AppContext = createContext<Ctx | null>(null);
export function AppProvider({ value, nav, children }: { value: ReturnType<typeof useStackora>; nav: Nav; children: React.ReactNode }) {
  const derived = useMemo(() => {
    const byId = new Map((value.catalog?.items ?? []).map((i) => [i.id, i]));
    const itemById = (id?: string) => (id ? byId.get(id) : undefined);
    const lookOf = (id?: string) => itemById(id)?.look;
    const mine = (slot: Slot) => itemById(value.catalog?.equipped?.[slot] ?? value.profile?.equipped?.[slot]);
    return { itemById, lookOf, mine };
  }, [value.catalog, value.profile]);
  return <AppContext.Provider value={{ ...value, nav, ...derived }}>{children}</AppContext.Provider>;
}
export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw Error("AppProvider manquant");
  return c;
}
