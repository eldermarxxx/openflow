// Teste de compilação real: `flutter analyze` sobre o main.dart gerado.
// Pulado se o Flutter não estiver instalado. O projeto-base fica em cache para ser rápido.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateMainDart } from "./codegen";
import { everything } from "./fixtures";
import { emptyApp } from "./schema";

let hasFlutter = true;
try { execFileSync("flutter", ["--version"], { stdio: "ignore", env: { ...process.env, CI: "true" } }); } catch { hasFlutter = false; }

const dir = resolve("node_modules/.cache/openflow-flutter-check");
const env = { ...process.env, CI: "true" };

describe.skipIf(!hasFlutter)("flutter analyze", () => {
  it("o código gerado (todos os widgets e app vazio) compila sem erros", () => {
    if (!existsSync(join(dir, "pubspec.yaml"))) {
      mkdirSync(dir, { recursive: true });
      execFileSync("flutter", ["create", "--project-name", "of_check", "--platforms", "android", "-e", "."], { cwd: dir, env, stdio: "pipe" });
    }
    for (const doc of [everything(), emptyApp()]) {
      writeFileSync(join(dir, "lib/main.dart"), generateMainDart(doc));
      let out = "";
      try {
        out = execFileSync("flutter", ["analyze", "--no-pub", "--no-fatal-infos", "--no-fatal-warnings", "lib/main.dart"], { cwd: dir, env, encoding: "utf8", stdio: "pipe" });
      } catch (e) {
        out = String((e as { stdout?: string }).stdout ?? e);
      }
      expect(out, out).not.toMatch(/error •/);
    }
  }, 300_000);
});
