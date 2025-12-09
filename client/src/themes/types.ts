export interface ThemeColors {
  background: string;
  foreground: string;
  border: string;
  card: string;
  cardForeground: string;
  cardBorder: string;
  cardHeader: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarBorder: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarRing: string;
  popover: string;
  popoverForeground: string;
  popoverBorder: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  input: string;
  ring: string;
  buttonOutline: string;
  badgeOutline: string;
  opaqueButtonBorderIntensity: number;
  elevate1: string;
  elevate2: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
}
