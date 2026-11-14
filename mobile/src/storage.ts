import { Platform } from "react-native";
import * as NativeStore from "expo-secure-store";
// Session : Keychain iOS en natif ; sessionStorage sur le banc d'essai web.
export const storage = {
  async getItemAsync(key: string) {
    return Platform.OS === "web"
      ? (globalThis.sessionStorage?.getItem(key) ?? null)
      : NativeStore.getItemAsync(key);
  },
  async setItemAsync(key: string, value: string) {
    if (Platform.OS === "web") globalThis.sessionStorage?.setItem(key, value);
    else await NativeStore.setItemAsync(key, value);
  },
  async deleteItemAsync(key: string) {
    if (Platform.OS === "web") globalThis.sessionStorage?.removeItem(key);
    else await NativeStore.deleteItemAsync(key);
  },
};
// Préférences et progression locale : survivent à la fermeture (localStorage sur web).
export const durable = {
  async get(key: string): Promise<string | null> {
    try {
      return Platform.OS === "web" ? (globalThis.localStorage?.getItem(key) ?? null) : await NativeStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string) {
    try {
      if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
      else await NativeStore.setItemAsync(key, value);
    } catch {
      /* stockage plein ou indisponible : la préférence reste en mémoire */
    }
  },
};
