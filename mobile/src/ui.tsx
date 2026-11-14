import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { color, font, radius, rarity as rarityTokens, shadow, space, type } from "./theme";
import { haptic, sound } from "./feedback";
import { useSettings } from "./settings";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const Icon = ({ name, size = 20, tint = color.text }: { name: IconName; size?: number; tint?: string }) => (
  <Ionicons name={name} size={size} color={tint} />
);

type Variant = keyof typeof type;
export function T({ v = "body", style, children, numberOfLines, center, tint, selectable }: { v?: Variant; style?: StyleProp<TextStyle>; children: React.ReactNode; numberOfLines?: number; center?: boolean; tint?: string; selectable?: boolean }) {
  return (
    <Text selectable={selectable} numberOfLines={numberOfLines} style={[type[v], center && { textAlign: "center" }, tint ? { color: tint } : null, style]}>
      {children}
    </Text>
  );
}

/** Retour visuel de pression : léger enfoncement, sans bloquer le geste. */
export function usePress(scaleTo = 0.97) {
  const { reduceMotion } = useSettings();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    reduceMotion ? scale.setValue(1) : Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return { scale, onPressIn: () => to(scaleTo), onPressOut: () => to(1) };
}

const OUTER = new Set(["flex", "flexGrow", "flexShrink", "flexBasis", "width", "minWidth", "maxWidth", "alignSelf", "position", "top", "left", "right", "bottom", "zIndex", "margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "marginHorizontal", "marginVertical"]);
/** Sépare les propriétés de placement (appliquées au conteneur pressable) du style visuel. */
function splitLayout(style: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {}, inner: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) (OUTER.has(k) ? outer : inner)[k] = v;
  if (outer.flex !== undefined || outer.flexGrow !== undefined) inner.flexGrow = 1;
  if (inner.height !== undefined && outer.position === "absolute") outer.height = inner.height;
  return [outer as ViewStyle, inner as ViewStyle];
}
export function Tap({ onPress, children, style, disabled, label, feedback = "tap", hint }: { onPress?: () => void; children: React.ReactNode; style?: StyleProp<ViewStyle>; disabled?: boolean; label?: string; feedback?: "tap" | "select" | "none"; hint?: string }) {
  const p = usePress(0.975);
  const [outer, inner] = splitLayout(style);
  return (
    <Pressable
      style={outer}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => {
        if (feedback !== "none") haptic(feedback);
        onPress?.();
      }}
    >
      <Animated.View style={[inner, { transform: [{ scale: p.scale }] }, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

type ButtonKind = "primary" | "gold" | "secondary" | "ghost" | "danger";
export function Button({ title, onPress, kind = "primary", icon, size = "lg", disabled, loading, style, label }: { title: string; onPress: () => void; kind?: ButtonKind; icon?: IconName; size?: "lg" | "md" | "sm"; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; label?: string }) {
  const h = size === "lg" ? 54 : size === "md" ? 46 : 38;
  const fg = kind === "gold" ? "#1A1206" : kind === "primary" ? "#0B0D1E" : kind === "danger" ? color.danger : color.text;
  const inner = (
    <View style={[st.btnInner, { height: h, paddingHorizontal: size === "sm" ? 14 : 20 }]}>
      {loading ? <ActivityIndicator color={fg} /> : <>
        {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} tint={fg} />}
        <Text numberOfLines={1} style={[st.btnText, { color: fg, fontSize: size === "sm" ? 13.5 : 15.5 }]}>{title}</Text>
      </>}
    </View>
  );
  return (
    <Tap onPress={onPress} disabled={disabled || loading} label={label ?? title} style={[{ borderRadius: radius.md, overflow: "hidden" }, style]}>
      {kind === "gold" ? (
        <LinearGradient colors={[color.goldBright, color.gold, "#B98A45"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnFill}>{inner}</LinearGradient>
      ) : kind === "primary" ? (
        <LinearGradient colors={["#9AA5FF", color.accent, "#6573F0"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.btnFill}>{inner}</LinearGradient>
      ) : (
        <View style={[st.btnFill, kind === "secondary" && { backgroundColor: color.surface3, borderColor: color.hairlineStrong, borderWidth: StyleSheet.hairlineWidth }, kind === "danger" && { backgroundColor: color.dangerTint }]}>{inner}</View>
      )}
    </Tap>
  );
}
export function IconButton({ icon, onPress, label, tint = color.text, badge, size = 44 }: { icon: IconName; onPress: () => void; label: string; tint?: string; badge?: number; size?: number }) {
  return (
    <Tap onPress={onPress} label={label} style={[st.iconBtn, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={icon} size={20} tint={tint} />
      {!!badge && <View style={st.badge}><Text style={st.badgeText}>{badge > 9 ? "9+" : badge}</Text></View>}
    </Tap>
  );
}

export function Surface({ children, style, tone = "default", onPress, label, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: "default" | "raised" | "gold" | "accent" | "felt"; onPress?: () => void; label?: string; padded?: boolean }) {
  const own = onPress ? splitLayout(style)[1] : style;
  const base: StyleProp<ViewStyle> = [st.surface, padded && { padding: space.lg }, tone === "raised" && { backgroundColor: color.surface2 }, own, onPress && { flexGrow: 1 }];
  const body =
    tone === "gold" || tone === "accent" || tone === "felt" ? (
      <LinearGradient
        colors={tone === "gold" ? ["#2A2115", "#17130D"] : tone === "accent" ? ["#1D2142", "#121428"] : ["#14453A", "#0B251F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[base, { borderColor: tone === "gold" ? "rgba(217,172,99,0.28)" : tone === "accent" ? "rgba(125,139,255,0.28)" : "rgba(217,172,99,0.18)" }]}
      >
        {children}
      </LinearGradient>
    ) : (
      <View style={base}>{children}</View>
    );
  if (!onPress) return body;
  const [outer] = splitLayout(style);
  return <Tap onPress={onPress} label={label} style={outer}>{body}</Tap>;
}

export function Row({ children, gap = space.sm, style, between, wrap }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle>; between?: boolean; wrap?: boolean }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, between && { justifyContent: "space-between" }, wrap && { flexWrap: "wrap" }, style]}>{children}</View>;
}
export const Gap = ({ h = space.md }: { h?: number }) => <View style={{ height: h }} />;

export function SectionHeader({ title, action, onAction, eyebrow }: { title: string; action?: string; onAction?: () => void; eyebrow?: string }) {
  return (
    <Row between style={{ marginTop: space.xs }}>
      <View style={{ gap: 4, flex: 1 }}>
        {eyebrow && <T v="eyebrow">{eyebrow}</T>}
        <T v="headline" style={{ fontSize: 19 }}>{title}</T>
      </View>
      {action && onAction && (
        <Tap onPress={onAction} label={action} style={{ minHeight: 44, justifyContent: "center", paddingLeft: 12 }}>
          <T v="callout" tint={color.accent}>{action}</T>
        </Tap>
      )}
    </Row>
  );
}

export function Pill({ label, active, onPress, icon, tint }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; tint?: string }) {
  const content = (
    <View style={[st.pill, active && { backgroundColor: color.text, borderColor: color.text }]}>
      {icon && <Icon name={icon} size={14} tint={active ? color.bg : (tint ?? color.textSoft)} />}
      <Text style={[st.pillText, { color: active ? color.bg : (tint ?? color.textSoft) }]}>{label}</Text>
    </View>
  );
  return onPress ? <Tap onPress={onPress} feedback="select" label={label}>{content}</Tap> : content;
}

export function Segmented<V extends string | number>({ options, value, onChange, label }: { options: { value: V; label: string }[]; value: V; onChange: (v: V) => void; label?: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={st.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { haptic("select"); onChange(o.value); }} style={[st.segmentItem, on && st.segmentOn]}>
            <Text numberOfLines={1} style={[st.segmentText, on && { color: color.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: value ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, x]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} hitSlop={10} onPress={() => { haptic("select"); onChange(!value); }}>
      <Animated.View style={[st.toggle, { backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [color.surface3, color.accent] }) }]}>
        <Animated.View style={[st.knob, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [2, 22] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export function SettingRow({ title, subtitle, right, onPress, icon, last }: { title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; icon?: IconName; last?: boolean }) {
  const body = (
    <View style={[st.settingRow, !last && st.divider]}>
      {icon && <View style={st.settingIcon}><Icon name={icon} size={17} tint={color.textSoft} /></View>}
      <View style={{ flex: 1, gap: 2 }}>
        <T v="callout">{title}</T>
        {subtitle && <T v="caption">{subtitle}</T>}
      </View>
      {right ?? (onPress ? <Icon name="chevron-forward" size={18} tint={color.faint} /> : null)}
    </View>
  );
  return onPress ? <Tap onPress={onPress} label={title}>{body}</Tap> : body;
}
export function Group({ title, children, footer }: { title?: string; children: React.ReactNode; footer?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      {title && <T v="eyebrow" style={{ paddingHorizontal: 4, color: color.muted }}>{title}</T>}
      <View style={st.group}>{children}</View>
      {footer && <T v="caption" style={{ paddingHorizontal: 4 }}>{footer}</T>}
    </View>
  );
}

export function Field({ label, value, onChange, secure, numeric, placeholder, autoCapitalize = "none", maxLength, hint, error, mono, onSubmit }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; numeric?: boolean; placeholder?: string; autoCapitalize?: "none" | "characters" | "words"; maxLength?: number; hint?: string; error?: string; mono?: boolean; onSubmit?: () => void }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <T v="caption" style={{ color: color.textSoft, fontFamily: font.medium }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        keyboardType={numeric ? "number-pad" : "default"}
        placeholder={placeholder}
        placeholderTextColor={color.faint}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? "go" : "done"}
        style={[st.input, mono && { fontFamily: font.semibold, letterSpacing: 3, fontSize: 18 }, focus && { borderColor: color.accent, backgroundColor: color.surface2 }, !!error && { borderColor: color.danger }]}
      />
      {(error || hint) && <T v="caption" tint={error ? color.danger : undefined}>{error ?? hint}</T>}
    </View>
  );
}

export function ProgressBar({ value, tint = color.gold, height = 6 }: { value: number; tint?: string; height?: number }) {
  const w = useRef(new Animated.Value(0)).current;
  const { reduceMotion } = useSettings();
  useEffect(() => {
    const v = Math.max(0, Math.min(1, value));
    if (reduceMotion) w.setValue(v);
    else Animated.timing(w, { toValue: v, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, w, reduceMotion]);
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={{ height, borderRadius: height, backgroundColor: color.surface3, overflow: "hidden" }}>
      <Animated.View style={{ height, borderRadius: height, backgroundColor: tint, width: w.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
    </View>
  );
}

/** Pièce StackCoin dessinée en vues (pas d'image) : anneau cuivré, cœur en losange. */
export function CoinGlyph({ size = 18 }: { size?: number }) {
  return (
    <LinearGradient colors={[color.goldBright, color.gold, color.goldDeep]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size, borderWidth: Math.max(1, size * 0.07), borderColor: "rgba(60,40,10,0.45)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: size * 0.26, height: size * 0.26, backgroundColor: "rgba(60,40,10,0.55)", transform: [{ rotate: "45deg" }] }} />
      </View>
    </LinearGradient>
  );
}
export const formatCoins = (n: number) => n.toLocaleString("fr-FR");
export function CoinBalance({ amount, onPress, size = "md" }: { amount: number | null; onPress?: () => void; size?: "md" | "lg" }) {
  const body = (
    <View style={[st.coinPill, size === "lg" && { paddingVertical: 10, paddingHorizontal: 16 }]}>
      <CoinGlyph size={size === "lg" ? 22 : 17} />
      <Text style={[type.number, { fontSize: size === "lg" ? 20 : 14.5 }]}>{amount === null ? "—" : formatCoins(amount)}</Text>
    </View>
  );
  return onPress ? <Tap onPress={onPress} label={`${amount ?? 0} StackCoins, ouvrir la boutique`}>{body}</Tap> : body;
}

export type Look = { glyph?: string; bg?: string; fg?: string; color?: string; color2?: string; animated?: boolean };
/** Avatar joueur avec cadre cosmétique. Le cadre animé respecte la réduction des mouvements. */
export function Avatar({ name, look, frame, size = 44, badge, ring }: { name: string; look?: Look; frame?: Look; size?: number; badge?: Look; ring?: string }) {
  const { reduceMotion } = useSettings();
  const spin = useRef(new Animated.Value(0)).current;
  const animated = !!frame?.animated && !reduceMotion;
  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [animated, spin]);
  const hasFrame = frame?.color && frame.color !== "transparent";
  const glyph = look?.glyph ?? name.slice(0, 1).toUpperCase();
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessibilityLabel={`Avatar de ${name}`}>
      {hasFrame && (
        <Animated.View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, transform: animated ? [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] : [] }}>
          <LinearGradient colors={[frame!.color!, frame!.color2 ?? frame!.color!, frame!.color!]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: size / 2 }} />
        </Animated.View>
      )}
      <View style={{ width: hasFrame ? size - 5 : size, height: hasFrame ? size - 5 : size, borderRadius: size, backgroundColor: look?.bg ?? color.surface3, alignItems: "center", justifyContent: "center", borderWidth: ring ? 2 : StyleSheet.hairlineWidth, borderColor: ring ?? color.hairlineStrong }}>
        <Text style={{ color: look?.fg ?? color.gold, fontFamily: look?.glyph && look.glyph.length === 1 && !/[A-Z]/.test(look.glyph) ? undefined : font.display, fontSize: size * 0.44 }}>{glyph}</Text>
      </View>
      {badge?.glyph ? (
        <View style={[st.avatarBadge, { width: size * 0.38, height: size * 0.38, borderRadius: size }]}>
          <Text style={{ color: badge.color, fontSize: size * 0.2 }}>{badge.glyph}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function RarityTag({ r }: { r: keyof typeof rarityTokens }) {
  const t = rarityTokens[r];
  return (
    <View style={{ backgroundColor: t.tint, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color: t.color, fontFamily: font.semibold, fontSize: 10.5, letterSpacing: 0.6 }}>{t.label.toUpperCase()}</Text>
    </View>
  );
}

export function Empty({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <Surface style={{ alignItems: "center", paddingVertical: space.xxl, gap: space.sm }}>
      <View style={st.emptyIcon}><Icon name={icon} size={24} tint={color.gold} /></View>
      <T v="headline" center>{title}</T>
      <T v="body" center style={{ maxWidth: 300 }}>{body}</T>
      {action && onAction && <Button size="md" kind="secondary" title={action} onPress={onAction} style={{ marginTop: space.xs }} />}
    </Surface>
  );
}
export function Skeleton({ h = 72, style }: { h?: number; style?: StyleProp<ViewStyle> }) {
  const o = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 0.8, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 0.4, duration: 700, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[{ height: h, borderRadius: radius.lg, backgroundColor: color.surface2, opacity: o }, style]} />;
}

/** Feuille modale du bas, glisse + fondu. */
export function Sheet({ visible, onClose, title, children, scroll = true }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode; scroll?: boolean }) {
  const y = useRef(new Animated.Value(1)).current;
  const { reduceMotion } = useSettings();
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(y, { toValue: visible ? 0 : 1, duration: reduceMotion ? 0 : 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      if (!visible) setMounted(false);
    });
  }, [visible, y, reduceMotion]);
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay, opacity: y.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <Pressable accessibilityLabel="Fermer" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[st.sheet, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }] }]}>
        <View style={st.grabber} />
        {title && (
          <Row between style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
            <T v="title" style={{ fontSize: 22 }}>{title}</T>
            <IconButton icon="close" label="Fermer" onPress={onClose} size={38} />
          </Row>
        )}
        {scroll ? <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: space.xs, gap: space.md, paddingBottom: 44 }}>{children}</ScrollView> : <View style={{ padding: space.lg, paddingBottom: 44, gap: space.md }}>{children}</View>}
      </Animated.View>
    </Modal>
  );
}

/** Dialogue de confirmation centré. */
export function Confirm({ visible, title, body, confirm, onConfirm, onCancel, danger }: { visible: boolean; title: string; body: string; confirm: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.overlay, alignItems: "center", justifyContent: "center", padding: space.xl }]}>
        <View style={[st.dialog, shadow(3)]}>
          <T v="title" style={{ fontSize: 22 }} center>{title}</T>
          <T v="body" center>{body}</T>
          <Row gap={space.sm} style={{ marginTop: space.xs }}>
            <Button size="md" kind="secondary" title="Annuler" onPress={onCancel} style={{ flex: 1 }} />
            <Button size="md" kind={danger ? "danger" : "gold"} title={confirm} onPress={onConfirm} style={{ flex: 1 }} />
          </Row>
        </View>
      </View>
    </Modal>
  );
}

type ToastMsg = { id: number; text: string; tone: "info" | "success" | "error" | "reward" };
const ToastCtx = createContext<(text: string, tone?: ToastMsg["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([]);
  const show = useCallback((text: string, tone: ToastMsg["tone"] = "info") => {
    const id = Date.now() + Math.random();
    if (tone === "success" || tone === "reward") haptic("success");
    if (tone === "error") haptic("warning");
    if (tone === "reward") sound("win");
    setMsgs((m) => [...m.slice(-2), { id, text, tone }]);
    setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), tone === "error" ? 4200 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <View pointerEvents="box-none" style={st.toastLayer}>
        {msgs.map((m) => <ToastView key={m.id} msg={m} onClose={() => setMsgs((all) => all.filter((x) => x.id !== m.id))} />)}
      </View>
    </ToastCtx.Provider>
  );
}
function ToastView({ msg, onClose }: { msg: ToastMsg; onClose: () => void }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [a]);
  const icon: IconName = msg.tone === "success" ? "checkmark-circle" : msg.tone === "error" ? "alert-circle" : msg.tone === "reward" ? "sparkles" : "information-circle";
  const tint = msg.tone === "success" ? color.success : msg.tone === "error" ? color.danger : msg.tone === "reward" ? color.gold : color.accent;
  return (
    <Animated.View accessibilityLiveRegion="polite" style={[st.toast, shadow(2), { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <Pressable onPress={onClose} style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessibilityRole="alert">
        <Icon name={icon} size={20} tint={tint} />
        <Text style={[type.callout, { flex: 1 }]}>{msg.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const { reduceMotion } = useSettings();
  const a = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(a, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay, reduceMotion]);
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>{children}</Animated.View>;
}

const st = StyleSheet.create({
  btnFill: { borderRadius: radius.md },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontFamily: font.semibold, letterSpacing: -0.1 },
  iconBtn: { alignItems: "center", justifyContent: "center", backgroundColor: color.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  badge: { position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: color.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 9.5, fontFamily: font.bold },
  surface: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline, overflow: "hidden" },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, height: 34, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, backgroundColor: color.surface },
  pillText: { fontFamily: font.medium, fontSize: 13 },
  segment: { flexDirection: "row", backgroundColor: color.surface, borderRadius: radius.md, padding: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  segmentItem: { flex: 1, minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, paddingHorizontal: 6 },
  segmentOn: { backgroundColor: color.surface3, ...shadow(1) },
  segmentText: { fontFamily: font.medium, fontSize: 13, color: color.muted },
  toggle: { width: 50, height: 30, borderRadius: 15, justifyContent: "center" },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", ...shadow(1) },
  settingRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 13, paddingHorizontal: space.md, minHeight: 56 },
  settingIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center" },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.hairline },
  group: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairline, overflow: "hidden" },
  input: { backgroundColor: color.surface, color: color.text, borderWidth: 1, borderColor: color.hairlineStrong, borderRadius: radius.md, paddingHorizontal: 16, height: 52, fontSize: 16, fontFamily: font.regular, ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}) },
  coinPill: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: color.surface2, borderRadius: radius.pill, paddingVertical: 7, paddingLeft: 8, paddingRight: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(217,172,99,0.3)" },
  avatarBadge: { position: "absolute", right: -2, bottom: -2, backgroundColor: color.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: color.hairlineStrong },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.goldTint, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", backgroundColor: color.bgRaised, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong, maxWidth: 640, alignSelf: "center", width: "100%" },
  grabber: { width: 38, height: 5, borderRadius: 3, backgroundColor: color.surface3, alignSelf: "center", marginTop: 8, marginBottom: 10 },
  dialog: { width: "100%", maxWidth: 380, backgroundColor: color.surface2, borderRadius: radius.xl, padding: space.xl, gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
  toastLayer: { position: "absolute", top: 56, left: 16, right: 16, alignItems: "center", gap: 8, zIndex: 999 },
  toast: { width: "100%", maxWidth: 460, backgroundColor: color.surface3, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: color.hairlineStrong },
});
