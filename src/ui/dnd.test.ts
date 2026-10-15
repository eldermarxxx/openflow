import { describe, expect, it } from "vitest";
import { dropPosition } from "./dnd";

const r = { left: 0, top: 0, width: 100, height: 100 };
describe("dropPosition", () => {
  it("folha: metade de cima/esquerda = antes, resto = depois", () => {
    expect(dropPosition(r, { x: 50, y: 10 }, "vertical", false)).toBe("before");
    expect(dropPosition(r, { x: 50, y: 90 }, "vertical", false)).toBe("after");
    expect(dropPosition(r, { x: 80, y: 10 }, "horizontal", false)).toBe("after");
  });
  it("container: faixa central = dentro", () => {
    expect(dropPosition(r, { x: 50, y: 50 }, "vertical", true)).toBe("inside");
    expect(dropPosition(r, { x: 50, y: 10 }, "vertical", true)).toBe("before");
    expect(dropPosition(r, { x: 95, y: 50 }, "horizontal", true)).toBe("after");
  });
  it("raiz: sempre dentro", () => {
    expect(dropPosition(r, { x: 0, y: 0 }, "vertical", true, true)).toBe("inside");
  });
});
