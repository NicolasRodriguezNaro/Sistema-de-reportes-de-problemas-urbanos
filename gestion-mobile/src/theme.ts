export type ThemeMode = "light" | "dark";

const lightColors = {
  brand: "#0f4c5c",
  brandDeep: "#082e38",
  brandMid: "#0b3d4b",
  mint: "#8bd5c8",
  mintSoft: "#e6f2f3",
  accent: "#d97706",
  accentSoft: "#fef3c7",
  accentText: "#9a5d00",
  danger: "#c2410c",
  dangerSoft: "#ffedd5",
  dangerSurface: "#fffaf5",
  dangerBorder: "#fdba74",
  success: "#15803d",
  successSoft: "#dcfce7",
  info: "#2563eb",
  infoSoft: "#dbeafe",
  infoText: "#1d4ed8",
  violet: "#7c3aed",
  violetSoft: "#ede9fe",
  bg: "#f5f8f9",
  surface: "#ffffff",
  surfaceMuted: "#edf3f4",
  text: "#102a33",
  muted: "#5b7078",
  soft: "#8ba0a6",
  border: "#d8e3e6",
  white: "#ffffff",
};

export type ThemeColors = typeof lightColors;

const darkColors: ThemeColors = {
  brand: "#1b7182",
  brandDeep: "#061e26",
  brandMid: "#0b303a",
  mint: "#8bd5c8",
  mintSoft: "#15343a",
  accent: "#f5a524",
  accentSoft: "#3b2a12",
  accentText: "#f5c06b",
  danger: "#ff9b7a",
  dangerSoft: "#3a211d",
  dangerSurface: "#2b1a17",
  dangerBorder: "#7c3c2a",
  success: "#4ade80",
  successSoft: "#123326",
  info: "#60a5fa",
  infoSoft: "#14283f",
  infoText: "#93c5fd",
  violet: "#c4b5fd",
  violetSoft: "#2a2140",
  bg: "#07171d",
  surface: "#0e242c",
  surfaceMuted: "#15323a",
  text: "#e8f4f2",
  muted: "#a9c0c2",
  soft: "#7f9a9e",
  border: "#23434a",
  white: "#ffffff",
};

export const themes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

// Compatibilidad temporal para archivos que todavía no se han migrado.
export const colors = lightColors;

export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
