import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, font } from "../theme";
import { useSettings } from "../settings";
import { sound } from "../feedback";

export const SUIT: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
export const SUIT_NAME: Record<string, string> = { s: "pique", h: "cœur", d: "carreau", c: "trèfle" };
const RANK_NAME: Record<string, string> = { A: "As", K: "Roi", Q: "Dame", J: "Valet", T: "10" };
export const rankLabel = (r: string) => (r === "T" ? "10" : r);
export const cardName = (code: string) => `${RANK_NAME[code[0]] ?? code[0]} de ${SUIT_NAME[code[1]]}`;
export function suitColor(s: string, fourColor: boolean) {
  if (fourColor) return { s: "#17191E", h: "#C42A3D", d: "#2360C8", c: "#1C8048" }[s] ?? "#17191E";
  return "hd".includes(s) ? "#C42A3D" : "#17191E";
}
export type BackLook = { base?: string; accent?: string; pattern?: string };
export type FaceLook = { style?: string; fourColor?: boolean };

function Back({ w, h, look }: { w: number; h: number; look?: BackLook }) {
  const base = look?.base ?? "#16352D";
  const accent = look?.accent ?? color.gold;
  const pattern = look?.pattern ?? "monogram";
  const inset = Math.max(2, w * 0.07);
  return (
    <LinearGradient colors={[base, shade(base, -0.35)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: w * 0.12, overflow: "hidden", alignItems: "center", justifyContent: "center" }]}>
      <View style={{ position: "absolute", top: inset, left: inset, right: inset, bottom: inset, borderRadius: w * 0.08, borderWidth: Math.max(1, w * 0.025), borderColor: accent + "99" }} />
      {pattern === "diamond" &&
        Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={{ position: "absolute", left: ((i % 3) + 0.5) * (w / 3) - w * 0.06, top: (Math.floor(i / 3) + 0.5) * (h / 4) - w * 0.06, width: w * 0.12, height: w * 0.12, backgroundColor: accent + "55", transform: [{ rotate: "45deg" }] }} />
        ))}
      {pattern === "sunburst" &&
        Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={{ position: "absolute", width: Math.max(1, w * 0.03), height: h * 1.2, backgroundColor: accent + "33", transform: [{ rotate: `${i * 18}deg` }] }} />
        ))}
      {pattern === "eclipse" && (
        <>
          <View style={{ width: w * 0.62, height: w * 0.62, borderRadius: w, backgroundColor: accent, opacity: 0.9 }} />
          <View style={{ position: "absolute", width: w * 0.56, height: w * 0.56, borderRadius: w, backgroundColor: base, transform: [{ translateX: w * 0.1 }, { translateY: -w * 0.04 }] }} />
        </>
      )}
      {(pattern === "monogram" || pattern === "diamond") && (
        <View style={{ width: w * 0.32, height: w * 0.32, borderWidth: Math.max(1, w * 0.035), borderColor: accent, transform: [{ rotate: "45deg" }], alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: w * 0.1, height: w * 0.1, backgroundColor: accent }} />
        </View>
      )}
      {pattern === "line" && <View style={{ width: w * 0.18, height: Math.max(1, w * 0.03), backgroundColor: accent }} />}
    </LinearGradient>
  );
}
function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + c * amount)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, "0")).join("");
}

/**
 * Carte à jouer. `code` absent = carte fermée (dos cosmétique).
 * Animation : retournement à la révélation et arrivée glissée à la distribution.
 */
export function PlayingCard({ code, size = 48, back, face, highlight, dim, dealFrom, delay = 0, style, silent }: { code?: string; size?: number; back?: BackLook; face?: FaceLook; highlight?: boolean; dim?: boolean; dealFrom?: { x: number; y: number }; delay?: number; style?: StyleProp<ViewStyle>; silent?: boolean }) {
  const { prefs, reduceMotion } = useSettings();
  const w = size, h = Math.round(size * 1.4);
  const flip = useRef(new Animated.Value(code ? 1 : 0)).current;
  const deal = useRef(new Animated.Value(dealFrom && !reduceMotion ? 0 : 1)).current;
  const previous = useRef(code);
  useEffect(() => {
    if (!dealFrom || reduceMotion) return;
    Animated.timing(deal, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    if (!silent) {
      const t = setTimeout(() => sound("card"), delay);
      return () => clearTimeout(t);
    }
    // Distribution animée une seule fois, au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (code && !previous.current && !reduceMotion) {
      flip.setValue(0);
      Animated.timing(flip, { toValue: 1, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else flip.setValue(code ? 1 : 0);
    previous.current = code;
  }, [code, flip, delay, reduceMotion]);
  const fourColor = prefs.fourColor || !!face?.fourColor;
  const minimal = face?.style === "minimal";
  const rank = code?.[0], suit = code?.[1];
  const ink = suit ? suitColor(suit, fourColor) : "#000";
  const rotate = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["90deg", "90deg", "0deg"] });
  const transform = [
    { perspective: 700 },
    ...(dealFrom ? [{ translateX: deal.interpolate({ inputRange: [0, 1], outputRange: [dealFrom.x, 0] }) }, { translateY: deal.interpolate({ inputRange: [0, 1], outputRange: [dealFrom.y, 0] }) }, { scale: deal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] : []),
    ...(code ? [{ rotateY: rotate }] : []),
  ];
  return (
    <Animated.View
      accessible
      accessibilityLabel={code ? cardName(code) : "Carte cachée"}
      style={[
        { width: w, height: h, borderRadius: w * 0.12, opacity: dim ? 0.38 : dealFrom ? deal : 1, transform },
        cardShadow,
        highlight && { borderWidth: 2, borderColor: color.goldBright },
        style,
      ]}
    >
      {code ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FBF8F1", borderRadius: w * 0.12, overflow: "hidden", padding: w * 0.08 }]}>
          <Text style={{ color: ink, fontFamily: minimal ? font.semibold : font.bold, fontSize: w * (rank === "T" ? 0.38 : 0.44), lineHeight: w * 0.48, letterSpacing: rank === "T" ? -1.5 : 0 }}>{rankLabel(rank!)}</Text>
          <Text style={{ color: ink, fontSize: w * 0.3, lineHeight: w * 0.32, marginTop: -w * 0.02 }}>{SUIT[suit!]}</Text>
          {w >= 38 && !minimal && <Text style={{ position: "absolute", right: w * 0.08, bottom: w * 0.02, color: ink, fontSize: w * 0.62, lineHeight: w * 0.72, opacity: 0.92 }}>{SUIT[suit!]}</Text>}
          {fourColor && <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: Math.max(2, w * 0.05), backgroundColor: ink, opacity: 0.85 }} />}
        </View>
      ) : (
        <Back w={w} h={h} look={back} />
      )}
    </Animated.View>
  );
}
const cardShadow: ViewStyle = { shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 };

export type ChipLook = { base?: string; edge?: string; metal?: boolean };
export function Chip({ size = 18, look, tint }: { size?: number; look?: ChipLook; tint?: string }) {
  const base = tint ?? look?.base ?? color.gold;
  const edge = look?.edge ?? "#F3E3C6";
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: base, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: Math.max(1, size * 0.04), borderColor: "rgba(0,0,0,0.35)" }}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={{ position: "absolute", width: size * 0.16, height: size, alignItems: "center", transform: [{ rotate: `${i * 30}deg` }] }}>
          <View style={{ width: size * 0.16, height: size * 0.17, backgroundColor: edge, opacity: 0.9 }} />
          <View style={{ flex: 1 }} />
          <View style={{ width: size * 0.16, height: size * 0.17, backgroundColor: edge, opacity: 0.9 }} />
        </View>
      ))}
      <View style={{ width: size * 0.58, height: size * 0.58, borderRadius: size, backgroundColor: base, borderWidth: Math.max(1, size * 0.05), borderColor: edge + "AA" }} />
      {look?.metal && <LinearGradient colors={["rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.7 }} style={StyleSheet.absoluteFill} />}
    </View>
  );
}
const CHIP_TINTS = ["#C8955A", "#3E6FD8", "#C83C4C", "#2F8E5B", "#24262B"];
/** Petite pile de jetons dont la hauteur suit le montant (en BB). */
export function ChipStack({ amount, bb, size = 16, look }: { amount: number; bb: number; size?: number; look?: ChipLook }) {
  const n = Math.max(1, Math.min(4, Math.ceil(Math.log2(1 + amount / Math.max(1, bb)))));
  return (
    <View style={{ width: size, height: size + (n - 1) * 3.5 }}>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ position: "absolute", bottom: i * 3.5 }}>
          <Chip size={size} look={look} tint={look?.metal ? undefined : CHIP_TINTS[(i + Math.floor(amount / Math.max(1, bb))) % CHIP_TINTS.length]} />
        </View>
      ))}
    </View>
  );
}
