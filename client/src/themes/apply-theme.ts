import type { ThemeConfig } from "./types";

export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.foreground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--card', colors.card);
  root.style.setProperty('--card-foreground', colors.cardForeground);
  root.style.setProperty('--card-border', colors.cardBorder);
  root.style.setProperty('--card-header', colors.cardHeader);
  root.style.setProperty('--sidebar', colors.sidebar);
  root.style.setProperty('--sidebar-foreground', colors.sidebarForeground);
  root.style.setProperty('--sidebar-border', colors.sidebarBorder);
  root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
  root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
  root.style.setProperty('--sidebar-accent', colors.sidebarAccent);
  root.style.setProperty('--sidebar-accent-foreground', colors.sidebarAccentForeground);
  root.style.setProperty('--sidebar-ring', colors.sidebarRing);
  root.style.setProperty('--popover', colors.popover);
  root.style.setProperty('--popover-foreground', colors.popoverForeground);
  root.style.setProperty('--popover-border', colors.popoverBorder);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);
  root.style.setProperty('--button-outline', colors.buttonOutline);
  root.style.setProperty('--badge-outline', colors.badgeOutline);
  root.style.setProperty('--opaque-button-border-intensity', String(colors.opaqueButtonBorderIntensity));
  root.style.setProperty('--elevate-1', colors.elevate1);
  root.style.setProperty('--elevate-2', colors.elevate2);

  if (theme.mode === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}
