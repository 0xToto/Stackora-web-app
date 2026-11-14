import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { livePrefs } from "./settings";

const sources = {
  chip: require("../assets/sounds/chip.wav"),
  card: require("../assets/sounds/card.wav"),
  tap: require("../assets/sounds/tap.wav"),
  win: require("../assets/sounds/win.wav"),
  alert: require("../assets/sounds/alert.wav"),
};
export type Sound = keyof typeof sources;
const players: Partial<Record<Sound, AudioPlayer>> = {};
let ready = false;
function init() {
  if (ready) return;
  ready = true;
  // Respecte le bouton silencieux de l'iPhone et ne coupe pas la musique de l'utilisateur.
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
}
export function sound(name: Sound) {
  const p = livePrefs.current;
  if (p.silent || !p.sfx || p.volume <= 0) return;
  if (name === "chip" && !p.chipSounds) return;
  if (name === "card" && !p.cardSounds) return;
  if (name === "win" && !p.winSounds) return;
  try {
    init();
    const player = (players[name] ??= createAudioPlayer(sources[name]));
    player.volume = p.volume;
    void player.seekTo(0);
    player.play();
  } catch {
    /* audio indisponible (navigateur sans interaction préalable…) */
  }
}
export function haptic(kind: "tap" | "select" | "success" | "warning" | "heavy" = "tap") {
  const p = livePrefs.current;
  if (!p.haptics || Platform.OS === "web") return;
  if ((kind === "tap" || kind === "select") && !p.buttonHaptics) return;
  try {
    if (kind === "success") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === "warning") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (kind === "select") void Haptics.selectionAsync();
    else void Haptics.impactAsync(kind === "heavy" ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* pas de moteur haptique */
  }
}
