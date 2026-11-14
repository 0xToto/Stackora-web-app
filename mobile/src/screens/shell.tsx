import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { color, font, space, type } from "../theme";
import { useSettings } from "../settings";
import { haptic } from "../feedback";
import { Avatar, CoinBalance, Icon, IconButton, Row, T, type IconName, type Look } from "../ui";
import { useApp, type Tab } from "../app-context";

export function Screen({ children, onRefresh, refreshing = false, bottomInset = true, title, back, right, eyebrow }: { children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean; bottomInset?: boolean; title?: string; back?: () => void; right?: React.ReactNode; eyebrow?: string }) {
  const { prefs } = useSettings();
  const compact = prefs.density === "compact";
  return (
    <View style={{ flex: 1 }}>
      {(title || back) && (
        <Row style={st.subHeader} gap={space.xs}>
          {back && <IconButton icon="chevron-back" label="Retour" onPress={back} size={40} />}
          <View style={{ flex: 1 }}>
            {eyebrow && <T v="eyebrow">{eyebrow}</T>}
            {title && <T v="title" numberOfLines={1} style={{ fontSize: 24 }}>{title}</T>}
          </View>
          {right}
        </Row>
      )}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl tintColor={color.gold} refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={[st.content, { gap: compact ? space.md : space.lg, paddingHorizontal: compact ? space.md : space.lg, paddingBottom: bottomInset ? 120 : 40 }]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** En-tête principal : identité, solde, notifications, paramètres. */
export function TopBar({ notifications = 0 }: { notifications?: number }) {
  const a = useApp();
  const look = a.lookOf(a.profile?.equipped.avatar) as Look | undefined;
  const frame = a.lookOf(a.profile?.equipped.frame) as Look | undefined;
  return (
    <Row style={st.top} between>
      <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le profil" onPress={() => { haptic("tap"); a.nav.open("profile"); }} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        <Avatar name={a.user?.name ?? "?"} size={40} look={look} frame={frame} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[type.headline, { fontSize: 15.5 }]}>{a.user?.name}</Text>
          <Text style={[type.caption, { fontSize: 11.5 }]}>Niveau {a.profile?.progress.level ?? 1}</Text>
        </View>
      </Pressable>
      <Row gap={8}>
        <CoinBalance amount={a.balance} onPress={() => a.nav.go("shop")} />
        <IconButton icon="notifications-outline" label="Notifications" badge={notifications} onPress={() => a.nav.open("notifications")} size={40} />
        <IconButton icon="settings-outline" label="Paramètres" onPress={() => a.nav.open("settings")} size={40} />
      </Row>
    </Row>
  );
}

const TABS: { id: Tab; label: string; icon: IconName; on: IconName }[] = [
  { id: "home", label: "Accueil", icon: "home-outline", on: "home" },
  { id: "play", label: "Tournois", icon: "trophy-outline", on: "trophy" },
  { id: "train", label: "Exercices", icon: "barbell-outline", on: "barbell" },
  { id: "rules", label: "Règles", icon: "book-outline", on: "book" },
  { id: "shop", label: "Boutique", icon: "bag-handle-outline", on: "bag-handle" },
];
export function TabBar() {
  const a = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.tabbarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <LinearGradient pointerEvents="none" colors={["rgba(10,11,13,0)", "rgba(10,11,13,0.96)"]} style={st.tabFade} />
      <View style={st.tabbar} accessibilityRole="tablist">
        {TABS.map((t) => {
          const on = a.nav.tab === t.id && !a.nav.overlay;
          return (
            <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label} onPress={() => { haptic("select"); a.nav.go(t.id); }} style={st.tabItem}>
              <Icon name={on ? t.on : t.icon} size={22} tint={on ? color.text : color.muted} />
              <Text style={[st.tabLabel, on && { color: color.text }]}>{t.label}</Text>
              {on && <View style={st.tabDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Logo STACKORA : losange cuivré incliné, comme une carte posée. */
export function Mark({ size = 44 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size * 1.25, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient colors={[color.goldBright, color.gold, color.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size * 0.8, height: size * 1.12, borderRadius: size * 0.14, transform: [{ rotate: "-8deg" }], alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: size * 0.7, height: size * 1.02, borderRadius: size * 0.1, backgroundColor: color.bg, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: size * 0.3, height: size * 0.3, borderWidth: Math.max(1.5, size * 0.05), borderColor: color.gold, transform: [{ rotate: "45deg" }] }} />
        </View>
      </LinearGradient>
    </View>
  );
}
export function Wordmark({ size = 22 }: { size?: number }) {
  return <Text style={{ fontFamily: font.display, fontSize: size, letterSpacing: size * 0.18, color: color.text }}>STACKORA</Text>;
}

/** Écran de lancement : le logo se pose, le nom apparaît. */
export function Splash() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color.bg, alignItems: "center", justifyContent: "center", gap: 22 }]}>
      <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "0deg"] }) }] }}>
        <Mark size={64} />
      </Animated.View>
      <Animated.View style={{ opacity: a, alignItems: "center", gap: 8 }}>
        <Wordmark size={26} />
        <Text style={[type.eyebrow, { color: color.muted, fontSize: 10 }]}>Your table. Your rules.</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingTop: space.sm, width: "100%", maxWidth: 620, alignSelf: "center" },
  top: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 10, gap: 10, width: "100%", maxWidth: 620, alignSelf: "center" },
  subHeader: { paddingHorizontal: space.md, paddingTop: 6, paddingBottom: 6, width: "100%", maxWidth: 620, alignSelf: "center" },
  tabbarWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: space.md },
  tabFade: { position: "absolute", left: 0, right: 0, top: -24, bottom: 0 },
  tabbar: { flexDirection: "row", backgroundColor: "rgba(21,23,27,0.97)", borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, height: 64, maxWidth: 560, width: "100%", alignSelf: "center", paddingHorizontal: 4 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  tabLabel: { fontFamily: font.medium, fontSize: 10.5, color: color.muted },
  tabDot: { position: "absolute", bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: color.gold },
});
