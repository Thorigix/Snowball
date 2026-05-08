/**
 * Snowball Design System
 * Premium dark-mode first tema — crypto/fintech esintili
 */

import { Platform } from "react-native";

// ─── Brand Colors ────────────────────────────────────────────────────
export const Brand = {
  /** Ana neon accent — etkileşim ve CTA */
  primary: "#00E5A0",
  primaryDark: "#00C48C",
  primaryLight: "#33FFB5",

  /** İkincil — bilgilendirme ve badge */
  secondary: "#6C63FF",
  secondaryDark: "#5A52E0",
  secondaryLight: "#8B84FF",

  /** Uyarı/hata */
  danger: "#FF4D6A",
  dangerDark: "#E0364F",

  /** Başarı */
  success: "#00E5A0",

  /** Uyarı */
  warning: "#FFB547",

  /** Solana brand */
  solana: "#9945FF",
  solanaDark: "#7B30E0",

  /** LI.FI brand */
  lifi: "#BF5AF2",
};

// ─── Dark Theme (Primary) ───────────────────────────────────────────
export const Dark = {
  /** Backgrounds */
  bg: "#0A0E14",
  bgElevated: "#111822",
  bgCard: "#161F2C",
  bgCardHover: "#1C2738",
  bgInput: "#1A2332",
  bgOverlay: "rgba(0, 0, 0, 0.65)",

  /** Surfaces */
  surface: "#1A2332",
  surfaceLight: "#222F40",
  surfaceBorder: "#2A3A4E",

  /** Text */
  text: "#F0F4F8",
  textSecondary: "#8B9CB5",
  textMuted: "#5A6B80",
  textInverse: "#0A0E14",

  /** Borders */
  border: "#1E2D3D",
  borderLight: "#2A3A4E",
  borderFocus: Brand.primary,
};

// ─── Light Theme (Secondary) ────────────────────────────────────────
export const Light = {
  bg: "#F8FAFE",
  bgElevated: "#FFFFFF",
  bgCard: "#FFFFFF",
  bgCardHover: "#F0F4F8",
  bgInput: "#F0F4F8",
  bgOverlay: "rgba(0, 0, 0, 0.3)",

  surface: "#FFFFFF",
  surfaceLight: "#F0F4F8",
  surfaceBorder: "#E2E8F0",

  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderFocus: Brand.primary,
};

// ─── Typography ──────────────────────────────────────────────────────
export const Typography = {
  fontFamily: Platform.select({
    ios: "system-ui",
    android: "normal",
    default: "system-ui",
  }),

  /** Font sizes */
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  /** Font weights */
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};

// ─── Status Colors ───────────────────────────────────────────────────
export const StatusColors: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#1A3A2A", text: "#00E5A0" },
  FUNDED: { bg: "#1A2A4A", text: "#6C63FF" },
  SHIPPED: { bg: "#2A2A1A", text: "#FFB547" },
  DELIVERY_REVIEW: { bg: "#2A2A1A", text: "#FFB547" },
  RELEASED: { bg: "#1A3A2A", text: "#00E5A0" },
  REFUNDED: { bg: "#2A1A1A", text: "#FF4D6A" },
  DISPUTED: { bg: "#2A1A1A", text: "#FF4D6A" },
  CANCELLED: { bg: "#1A1A1A", text: "#5A6B80" },
  DRAFT: { bg: "#1A1A1A", text: "#5A6B80" },
};

// ─── Legacy Compat (for expo default components) ─────────────────────
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
