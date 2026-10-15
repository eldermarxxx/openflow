import { describe, expect, it } from "vitest";
import { WIDGETS } from "../core/schema";
import { PALETTE_GROUPS, filterPalette } from "./palette";

describe("palette", () => {
  it("busca vazia devolve todos os grupos", () => {
    expect(filterPalette(PALETTE_GROUPS, "  ")).toEqual(PALETTE_GROUPS);
  });
  it("filtra sem diferenciar maiúsculas e remove grupos vazios", () => {
    expect(filterPalette(PALETTE_GROUPS, "BUT")).toEqual([{ title: "Mais usados", items: ["Button"] }]);
    expect(filterPalette(PALETTE_GROUPS, "xyz")).toEqual([]);
  });
  it("todos os widgets do schema aparecem na paleta", () => {
    const all = new Set(PALETTE_GROUPS.flatMap((g) => g.items));
    expect([...all].sort()).toEqual(Object.keys(WIDGETS).sort());
  });
});
