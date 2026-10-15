import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { className, generateMainDart } from "./codegen";
import { createNode, emptyApp, findNode, insertChild, removeNode, updateProps, type AppDoc } from "./schema";

function sample(): AppDoc {
  const doc = emptyApp("meu app");
  const box = createNode("Container");
  let root = insertChild(doc.pages[0].root, "root", box);
  const text = { ...createNode("Text"), props: { text: "Olá 'mundo' $x", fontSize: 20 } };
  root = insertChild(root, box.id, text);
  root = insertChild(root, "root", createNode("Button"));
  return { ...doc, pages: [{ ...doc.pages[0], root }] };
}

describe("schema", () => {
  it("insere, atualiza e remove nós sem mutar o original", () => {
    const doc = emptyApp();
    const t = createNode("Text");
    const root = insertChild(doc.pages[0].root, "root", t);
    expect(doc.pages[0].root.children).toHaveLength(0);
    expect(findNode(updateProps(root, t.id, { text: "x" }), t.id)?.props.text).toBe("x");
    expect(removeNode(root, t.id).children).toHaveLength(0);
  });
  it("recusa filhos em Text e segundo filho em Container", () => {
    const t = createNode("Text");
    expect(() => insertChild(t, t.id, createNode("Text"))).toThrow();
    const c = insertChild(createNode("Container"), "x", t);
    const c1 = insertChild(c, c.id, createNode("Text"));
    expect(() => insertChild(c1, c1.id, createNode("Text"))).toThrow();
  });
});

describe("codegen", () => {
  it("gera nomes de classe válidos", () => {
    expect(className("meu app")).toBe("MeuApp");
    expect(className("1 tela")).toBe("P1Tela");
  });
  it("escapa aspas e $ em strings Dart", () => {
    expect(generateMainDart(sample())).toContain(String.raw`'Olá \'mundo\' \$x'`);
  });
  it("gera estrutura esperada", () => {
    const code = generateMainDart(sample());
    expect(code).toContain("class MeuAppApp extends StatelessWidget");
    expect(code).toContain("home: const HomePage()");
    expect(code).toContain("Container(");
    expect(code).toContain("ElevatedButton(");
  });
  it("gera Dart sintaticamente válido (dart format)", () => {
    const dir = mkdtempSync(join(tmpdir(), "openflow-"));
    const file = join(dir, "main.dart");
    writeFileSync(file, generateMainDart(sample()));
    try { execFileSync("dart", ["--version"], { stdio: "ignore" }); } catch { return; }
    expect(() => execFileSync("dart", ["format", "--output=none", file], { stdio: "pipe" })).not.toThrow();
  });
});
