import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { color, space } from "../theme";
import { useSettings } from "../settings";
import { Button, Field, Icon, Row, Segmented, Surface, T, Tap } from "../ui";
import { PlayingCard } from "../poker/cards";
import { Mark, Wordmark } from "./shell";
import type { useStackora } from "../useStackora";

function Fan() {
  const { reduceMotion } = useSettings();
  const a = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (!reduceMotion) Animated.timing(a, { toValue: 1, duration: 900, delay: 150, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, [a, reduceMotion]);
  const cards = ["As", "Kh", "Qd"];
  return (
    <View style={{ height: 150, alignItems: "center", justifyContent: "flex-end" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {cards.map((c, i) => (
        <Animated.View key={c} style={{ position: "absolute", bottom: 0, transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, (i - 1) * 46] }) }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, i === 1 ? -14 : 0] }) }, { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${(i - 1) * 12}deg`] }) }] }}>
          <PlayingCard code={c} size={82} />
        </Animated.View>
      ))}
    </View>
  );
}

export function AuthScreen({ a }: { a: ReturnType<typeof useStackora> }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const register = mode === "register";
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const pwOk = password.length >= 10;
  const nameOk = !register || /^[\p{L}\p{N}_-]{3,20}$/u.test(name.trim());
  const submit = () => {
    if (!emailOk || !pwOk || !nameOk) return;
    void a.login(email.trim(), password, register ? name.trim() : undefined);
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <LinearGradient pointerEvents="none" colors={["#14302A", color.bg]} style={[StyleSheet.absoluteFill, { height: 420 }]} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.lg, paddingTop: space.xl, gap: space.xl, maxWidth: 480, width: "100%", alignSelf: "center", paddingBottom: 60 }}>
        <Row gap={10}>
          <Mark size={30} />
          <Wordmark size={18} />
        </Row>
        <Fan />
        <View style={{ gap: 10 }}>
          <T v="eyebrow">Le poker, entre vous</T>
          <T v="hero">Les bonnes cartes.{"\n"}La bonne compagnie.</T>
          <T v="body">Créez une table privée, invitez vos amis avec un code, jouez où que vous soyez. Sans argent réel.</T>
        </View>
        <Surface style={{ gap: space.md }}>
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "login", label: "Se connecter" }, { value: "register", label: "Créer un compte" }]} />
          {register && <Field label="Pseudo" value={name} onChange={setName} maxLength={20} hint="3 à 20 caractères : lettres, chiffres, _ et -" error={name && !nameOk ? "Pseudo invalide" : undefined} />}
          <Field label="Adresse email" value={email} onChange={setEmail} placeholder="vous@exemple.fr" error={email && !emailOk ? "Adresse invalide" : undefined} />
          <Field label="Mot de passe" value={password} onChange={setPassword} secure hint="10 caractères minimum" error={password && !pwOk ? "Encore " + (10 - password.length) + " caractère(s)" : undefined} onSubmit={submit} />
          {!!a.error && (
            <Row gap={8} style={{ backgroundColor: color.dangerTint, padding: 12, borderRadius: 12 }}>
              <Icon name="alert-circle" size={18} tint={color.danger} />
              <T v="callout" style={{ flex: 1, color: color.danger }}>{a.error}</T>
            </Row>
          )}
          <Button kind="gold" title={register ? "Créer mon compte" : "Se connecter"} onPress={submit} loading={a.busy} disabled={!emailOk || !pwOk || !nameOk} />
        </Surface>
        <View style={{ gap: space.sm }}>
          <Tap onPress={() => setAdvanced(!advanced)} label="Options du serveur" style={{ minHeight: 44, justifyContent: "center" }}>
            <Row gap={6}><Icon name={advanced ? "chevron-down" : "chevron-forward"} size={16} tint={color.muted} /><T v="caption">Serveur de test</T></Row>
          </Tap>
          {advanced && <Field label="Adresse du serveur" value={a.url} onChange={a.setUrl} />}
          <T v="caption">Version de développement. L'adresse email n'est pas encore vérifiée. Les StackCoins et jetons n'ont aucune valeur monétaire.</T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
