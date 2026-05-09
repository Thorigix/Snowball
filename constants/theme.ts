/**
 * Snowball Design System
 * Dark theme — clean, muted, professional tones
 */

import { Platform } from "react-native";

// ─── Brand Colors (muted, professional) ─────────────────────────────
export const Brand = {
  /** Ana accent — soft teal */
  primary: "#5BB5A2",
  primaryDark: "#4A9A89",
  primaryLight: "#7DCBB9",

  /** İkincil — muted indigo */
  secondary: "#7B8CDE",
  secondaryDark: "#6474C4",
  secondaryLight: "#9BA8E8",

  /** Hata / uyarı */
  danger: "#D4687A",
  dangerDark: "#B85565",

  /** Başarı */
  success: "#5BB5A2",

  /** Uyarı */
  warning: "#D4A44E",

  /** Solana brand */
  solana: "#A87CDB",
  solanaDark: "#8E64C0",

  /** LI.FI brand */
  lifi: "#9B7FCC",
};

// ─── Dark Theme ─────────────────────────────────────────────────────
export const Dark = {
  /** Backgrounds */
  bg: "#0F1114",
  bgElevated: "#16191E",
  bgCard: "#1C2027",
  bgCardHover: "#22272F",
  bgInput: "#1A1E25",
  bgOverlay: "rgba(0, 0, 0, 0.55)",

  /** Surfaces */
  surface: "#1E2229",
  surfaceLight: "#262B33",
  surfaceBorder: "#2E343E",

  /** Text */
  text: "#E8EAED",
  textSecondary: "#9AA0AB",
  textMuted: "#636B78",
  textInverse: "#0F1114",

  /** Borders */
  border: "#252A33",
  borderLight: "#2E343E",
  borderFocus: "#5BB5A2",
};

// ─── Light Theme (fallback) ─────────────────────────────────────────
export const Light = {
  bg: "#F6F7F9",
  bgElevated: "#FFFFFF",
  bgCard: "#FFFFFF",
  bgCardHover: "#F0F2F5",
  bgInput: "#F0F2F5",
  bgOverlay: "rgba(0, 0, 0, 0.25)",

  surface: "#FFFFFF",
  surfaceLight: "#F0F2F5",
  surfaceBorder: "#E0E3E8",

  text: "#111318",
  textSecondary: "#555B66",
  textMuted: "#8E94A0",
  textInverse: "#FFFFFF",

  border: "#E0E3E8",
  borderLight: "#EBEDF0",
  borderFocus: "#5BB5A2",
};

// ─── Typography ──────────────────────────────────────────────────────
export const Typography = {
  fontFamily: Platform.select({
    ios: "system-ui",
    android: "normal",
    default: "system-ui",
  }),

  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  bold: "700" as const,
  semiBold: "600" as const,
  medium: "500" as const,
  regular: "400" as const,
};

// ─── Spacing ─────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// ─── Border Radius ───────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ─── Shadows ─────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
};

// ─── Status Colors (muted) ──────────────────────────────────────────
export const StatusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#1A2822", text: "#5BB5A2" },
  FUNDED: { bg: "#1C2238", text: "#7B8CDE" },
  SHIPPED: { bg: "#262218", text: "#D4A44E" },
  DELIVERY_REVIEW: { bg: "#262218", text: "#D4A44E" },
  RELEASED: { bg: "#1A2822", text: "#5BB5A2" },
  REFUNDED: { bg: "#261C20", text: "#D4687A" },
  DISPUTED: { bg: "#261C20", text: "#D4687A" },
  CANCELLED: { bg: "#1A1A1E", text: "#636B78" },
  DRAFT: { bg: "#1A1A1E", text: "#636B78" },
};

// ─── Legacy Compat ───────────────────────────────────────────────────
export const Colors = {
  light: {
    text: Light.text,
    background: Light.bg,
    tint: Brand.primary,
    icon: Light.textMuted,
    tabIconDefault: Light.textMuted,
    tabIconSelected: Brand.primary,
  },
  dark: {
    text: Dark.text,
    background: Dark.bg,
    tint: Brand.primary,
    icon: Dark.textMuted,
    tabIconDefault: Dark.textMuted,
    tabIconSelected: Brand.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
