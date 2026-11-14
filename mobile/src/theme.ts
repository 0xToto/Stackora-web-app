// STACKORA design tokens — « Salon nocturne ».
// Anthracite profond, cuivre doré réservé au premium et aux montants,
// bleu électrique maîtrisé pour l'interactif. Jamais de néon saturé.
import { Platform, type TextStyle, type ViewStyle } from "react-native";

export const color = {
  bg: "#0A0B0D",
  bgRaised: "#0F1013",
  surface: "#15171B",
  surface2: "#1B1E23",
  surface3: "#23272D",
  hairline: "rgba(255,255,255,0.07)",
  hairlineStrong: "rgba(255,255,255,0.12)",
  text: "#F4F1EA",
  textSoft: "#C9C5BC",
  muted: "#8B8E95",
  faint: "#5C6068",
  gold: "#D9AC63",
  goldBright: "#F1CC86",
  goldDeep: "#8E6A33",
  goldTint: "rgba(217,172,99,0.12)",
  accent: "#7D8BFF",
  accentDeep: "#4C58C9",
  accentTint: "rgba(125,139,255,0.14)",
  success: "#5FC89A",
  successTint: "rgba(95,200,154,0.14)",
  danger: "#F07D7D",
  dangerTint: "rgba(240,125,125,0.14)",
  warning: "#F2B35B",
  felt: "#123A31",
  overlay: "rgba(5,6,8,0.78)",
};
export const rarity = {
  common: { label: "Commun", color: "#AEB3BB", tint: "rgba(174,179,187,0.12)" },
  rare: { label: "Rare", color: "#6FA8FF", tint: "rgba(111,168,255,0.14)" },
  epic: { label: "Épique", color: "#B48CFF", tint: "rgba(180,140,255,0.14)" },
  legendary: { label: "Légendaire", color: "#F1CC86", tint: "rgba(241,204,134,0.16)" },
} as const;
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 44 };
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

export const font = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_500Medium_Italic",
  displayBold: "Fraunces_700Bold",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  black: "Inter_800ExtraBold",
};
const tabular: TextStyle = { fontVariant: ["tabular-nums"] };
export const type = {
  hero: { fontFamily: font.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.8, color: color.text } as TextStyle,
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.4, color: color.text } as TextStyle,
  headline: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2, color: color.text } as TextStyle,
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: color.textSoft } as TextStyle,
  callout: { fontFamily: font.medium, fontSize: 14, lineHeight: 19, color: color.text } as TextStyle,
  caption: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 17, color: color.muted } as TextStyle,
  eyebrow: { fontFamily: font.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: "uppercase", color: color.gold } as TextStyle,
  number: { fontFamily: font.bold, ...tabular, color: color.text } as TextStyle,
  mono: { fontFamily: font.semibold, ...tabular, letterSpacing: 2, color: color.text } as TextStyle,
};
export const shadow = (level: 1 | 2 | 3): ViewStyle =>
  Platform.select({
    web: { boxShadow: ["0 1px 2px rgba(0,0,0,.35)", "0 8px 24px rgba(0,0,0,.45)", "0 18px 50px rgba(0,0,0,.6)"][level - 1] } as ViewStyle,
    default: {
      shadowColor: "#000",
      shadowOpacity: [0.3, 0.42, 0.55][level - 1],
      shadowRadius: [3, 14, 28][level - 1],
      shadowOffset: { width: 0, height: [1, 8, 16][level - 1] },
      elevation: [2, 8, 16][level - 1],
    },
  })!;
export const motion = { fast: 160, base: 240, slow: 420, deal: 280 };
export const hit = { top: 8, bottom: 8, left: 8, right: 8 };
