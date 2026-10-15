import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateMainDart } from "./codegen";
import { everything } from "./fixtures";
import { WIDGETS, createNode, dropRejectReason, dropTarget, emptyApp, findNode, insertChild, moveNode, type WidgetNode, type WidgetType } from "./schema";

const ids = (n: WidgetNode) => n.children.map((c) => c.id);

describe("regras do Flutter", () => {
  it("Expanded e Spacer só dentro de Row/Column", () => {
    const stack = createNode("Stack");
    expect(() => insertChild(stack, stack.id, createNode("Spacer"))).toThrow(/Row ou Column/);
    expect(() => insertChild(stack, stack.id, createNode("Expanded"))).toThrow(/Row ou Column/);
    const row = createNode("Row");
    expect(insertChild(row, row.id, createNode("Spacer")).children).toHaveLength(1);
  });
  it("Divider só em Column/ListView; Card/Center aceitam um filho; folhas não aceitam filhos", () => {
    const row = createNode("Row");
    expect(() => insertChild(row, row.id, createNode("Divider"))).toThrow();
    const card = insertChild(createNode("Card"), "", createNode("Text"));
    const c1 = insertChild(card, card.id, createNode("Text"));
    expect(() => insertChild(c1, c1.id, createNode("Text"))).toThrow(/só um filho/);
    for (const leaf of ["Text", "Button", "Image", "Spacer", "Divider"] as WidgetType[]) {
      const n = createNode(leaf);
      expect(() => insertChild(n, n.id, createNode("Text"))).toThrow(/não aceita filhos/);
    }
  });
  it("insere numa posição específica", () => {
    let root = emptyApp().pages[0].root;
    const [a, b, c] = [createNode("Text"), createNode("Text"), createNode("Text")];
    root = insertChild(insertChild(root, "root", a), "root", b);
    root = insertChild(root, "root", c, 1);
    expect(ids(root)).toEqual([a.id, c.id, b.id]);
  });
});

describe("mover (arrasta e solta)", () => {
  function tree() {
    let root = emptyApp().pages[0].root;
    const row = createNode("Row"), box = createNode("Container"), a = createNode("Text"), b = createNode("Button");
    root = insertChild(root, "root", row);
    root = insertChild(root, "root", box);
    root = insertChild(root, row.id, a);
    root = insertChild(root, row.id, b);
    return { root, row, box, a, b };
  }
  it("reordena dentro do mesmo pai (índice antes da remoção)", () => {
    const { root, row, a, b } = tree();
    expect(ids(findNode(moveNode(root, a.id, row.id, 2), row.id)!)).toEqual([b.id, a.id]);
    expect(ids(findNode(moveNode(root, b.id, row.id, 0), row.id)!)).toEqual([b.id, a.id]);
  });
  it("move para outro pai respeitando as regras", () => {
    const { root, row, box, a, b } = tree();
    const moved = moveNode(root, a.id, box.id);
    expect(ids(findNode(moved, box.id)!)).toEqual([a.id]);
    expect(ids(findNode(moved, row.id)!)).toEqual([b.id]);
    expect(() => moveNode(moved, b.id, box.id)).toThrow(/só um filho/);
  });
  it("não move para dentro de si mesmo nem move a raiz", () => {
    const { root, row, a } = tree();
    expect(() => moveNode(root, row.id, row.id)).toThrow(/dentro dele mesmo/);
    const inner = insertChild(root, row.id, createNode("Column"));
    const col = findNode(inner, row.id)!.children[2];
    expect(() => moveNode(inner, row.id, col.id)).toThrow(/dentro dele mesmo/);
    expect(() => moveNode(root, "root", a.id)).toThrow();
  });
  it("Container com um filho aceita mover o próprio filho dentro dele", () => {
    const { root, box, a } = tree();
    const moved = moveNode(root, a.id, box.id);
    expect(dropRejectReason(moved, { parentId: box.id }, { id: a.id })).toBeNull();
  });
  it("dropTarget converte antes/depois/dentro em pai + índice", () => {
    const { root, row, a, b } = tree();
    expect(dropTarget(root, a.id, "before")).toEqual({ parentId: row.id, index: 0 });
    expect(dropTarget(root, b.id, "after")).toEqual({ parentId: row.id, index: 2 });
    expect(dropTarget(root, row.id, "inside")).toEqual({ parentId: row.id });
    expect(dropTarget(root, "root", "before")).toEqual({ parentId: "root" });
    expect(dropRejectReason(root, { parentId: row.id }, { type: "Divider" })).toMatch(/Column ou ListView/);
  });
});

describe("codegen de todos os widgets", () => {
  it("gera cada tipo de widget e as props da página", () => {
    const code = generateMainDart(everything());
    for (const t of ["Row(", "Column(", "Stack(", "ListView(", "Container(", "Card(", "Center(", "Expanded(", "ElevatedButton(", "Image.network(", "Spacer(", "Divider(", "Padding("]) expect(code).toContain(t);
    expect(code).toContain("backgroundColor: const Color(0xFF112233)");
    expect(code).toContain("child: const SizedBox.shrink()");
    expect(Object.keys(WIDGETS)).toHaveLength(13);
  });
  it("Dart sintaticamente válido (dart format)", () => {
    try { execFileSync("dart", ["--version"], { stdio: "ignore" }); } catch { return; }
    const f = join(mkdtempSync(join(tmpdir(), "of-")), "main.dart");
    writeFileSync(f, generateMainDart(everything()));
    expect(() => execFileSync("dart", ["format", "--output=none", f], { stdio: "pipe" })).not.toThrow();
  });
});
