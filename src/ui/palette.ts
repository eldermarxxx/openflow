import type { WidgetType } from "../core/schema";

export type PaletteGroup = { title: string; items: WidgetType[] };

export const PALETTE_GROUPS: PaletteGroup[] = [
  { title: "Mais usados", items: ["Text", "Column", "Row", "Container", "Image", "Button"] },
  { title: "Layout", items: ["Container", "Row", "Column", "Stack", "Card", "ListView", "Center", "Expanded", "Spacer", "Divider"] },
];

/** Filtra os grupos pela busca (sem diferenciar maiúsculas) e remove grupos vazios. */
export function filterPalette(groups: PaletteGroup[], query: string): PaletteGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({ ...g, items: g.items.filter((t) => t.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}
