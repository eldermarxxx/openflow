import { describe, expect, it } from "vitest";
import { LIMIT, initHistory, push, redo, undo } from "./history";

describe("history", () => {
  it("desfaz e refaz; nova ação limpa o futuro", () => {
    let h = push(push(initHistory(1), 2), 3);
    h = undo(h);
    expect(h.present).toBe(2);
    expect(redo(h).present).toBe(3);
    h = push(h, 9);
    expect(h.future).toEqual([]);
    expect(undo(undo(undo(undo(h)))).present).toBe(1);
  });
  it("sem mudança não cria passo; limita o tamanho", () => {
    const h = initHistory(1);
    expect(push(h, 1)).toBe(h);
    let big = h;
    for (let i = 0; i < LIMIT + 20; i++) big = push(big, i + 2);
    expect(big.past).toHaveLength(LIMIT);
  });
});
