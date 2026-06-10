import { getGlobalTheme } from "@/lib/strapi";
import type { BasicColors, AdvancedColors } from "@/lib/strapi";

type Palette = { [K in keyof (BasicColors & AdvancedColors)]: string };

const LIGHT_DEFAULTS: Palette = {
  // Basic — light
  navy: "#042154",
  accent: "#8466ac",
  red: "#c60d2d",
  surface: "#ffffff",
  surface_raised: "#ffffff",
  text_base: "#111827",
  text_body: "#374151",
  border_input: "#d1d5db",
  input_focus_ring: "#8466ac",
  action_primary: "#042154",
  // Advanced — light
  surface_sunken: "#f1f5f9",
  border: "#f3f4f6",
  border_subtle: "#e2e8f0",
  text_strong: "#1f2937",
  text_secondary: "#4b5563",
  text_muted: "#6b7280",
  text_faint: "#9ca3af",
  input_bg: "#ffffff",
  input_text: "#111827",
  input_checked: "#8466ac",
  action_primary_hover: "#0a3680",
  state_success: "#15803d",
  state_error: "#dc2626",
};

const DARK_DEFAULTS: Palette = {
  // Basic — dark
  navy: "#4d82d6",
  accent: "#a888cc",
  red: "#e63553",
  surface: "#0f172a",
  surface_raised: "#1e293b",
  text_base: "#f1f5f9",
  text_body: "#cbd5e1",
  border_input: "#475569",
  input_focus_ring: "#a888cc",
  action_primary: "#4d82d6",
  // Advanced — dark
  surface_sunken: "#0f172a",
  border: "#1e293b",
  border_subtle: "#334155",
  text_strong: "#f8fafc",
  text_secondary: "#94a3b8",
  text_muted: "#94a3b8",
  text_faint: "#64748b",
  input_bg: "#1e293b",
  input_text: "#f1f5f9",
  input_checked: "#a888cc",
  action_primary_hover: "#6b9de0",
  state_success: "#4ade80",
  state_error: "#f87171",
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function v(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

function buildBlock(
  basic: BasicColors | null,
  advanced: AdvancedColors | null,
  d: Palette
): string {
  return (
    `--color-foues-navy:${v(basic?.navy, d.navy)};` +
    `--color-foues-accent:${v(basic?.accent, d.accent)};` +
    `--color-foues-red:${v(basic?.red, d.red)};` +
    `--color-foues-surface:${v(basic?.surface, d.surface)};` +
    `--color-foues-surface-raised:${v(basic?.surface_raised, d.surface_raised)};` +
    `--color-foues-surface-sunken:${v(advanced?.surface_sunken, d.surface_sunken)};` +
    `--color-foues-border:${v(advanced?.border, d.border)};` +
    `--color-foues-border-subtle:${v(advanced?.border_subtle, d.border_subtle)};` +
    `--color-foues-border-input:${v(basic?.border_input, d.border_input)};` +
    `--color-foues-text-base:${v(basic?.text_base, d.text_base)};` +
    `--color-foues-text-strong:${v(advanced?.text_strong, d.text_strong)};` +
    `--color-foues-text-body:${v(basic?.text_body, d.text_body)};` +
    `--color-foues-text-secondary:${v(advanced?.text_secondary, d.text_secondary)};` +
    `--color-foues-text-muted:${v(advanced?.text_muted, d.text_muted)};` +
    `--color-foues-text-faint:${v(advanced?.text_faint, d.text_faint)};` +
    `--color-foues-input-bg:${v(advanced?.input_bg, d.input_bg)};` +
    `--color-foues-input-text:${v(advanced?.input_text, d.input_text)};` +
    `--color-foues-input-border:${v(basic?.border_input, d.border_input)};` +
    `--color-foues-input-focus-ring:${v(basic?.input_focus_ring, d.input_focus_ring)};` +
    `--color-foues-input-checked:${v(advanced?.input_checked, d.input_checked)};` +
    `--color-foues-state-success:${v(advanced?.state_success, d.state_success)};` +
    `--color-foues-state-error:${v(advanced?.state_error, d.state_error)};` +
    `--color-foues-action-primary:${v(basic?.action_primary, d.action_primary)};` +
    `--color-foues-action-primary-hover:${v(advanced?.action_primary_hover, d.action_primary_hover)}`
  );
}

export async function ThemeVars() {
  const theme = await getGlobalTheme();

  const css =
    `:root{${buildBlock(theme?.light ?? null, theme?.light_advanced ?? null, LIGHT_DEFAULTS)}}` +
    `[data-foues-theme='dark']{color-scheme:dark;${buildBlock(theme?.dark ?? null, theme?.dark_advanced ?? null, DARK_DEFAULTS)}}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
