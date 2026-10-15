import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { onboardingSteps, packageName, runScript, terminalCommand } from "./scripts.ts";

const input = { dir: "/tmp/Open Flow/meu_app", pkg: "meu_app", flutter: "/opt/flutter/bin/flutter", sdk: "/sdk", avd: "Pixel_8" };

describe("packageName", () => {
  it("gera snake_case válido", () => {
    expect(packageName("MeuApp")).toBe("meu_app");
    expect(packageName("Meu App 2!")).toBe("meu_app_2");
    expect(packageName("9vidas")).toBe("app_9vidas");
    expect(packageName("!!!")).toBe("openflow_app");
  });
});

describe("runScript", () => {
  it("bash: cria projeto, copia main.dart, sobe emulador e roda", () => {
    const { file, content } = runScript("darwin", input);
    expect(file).toBe("run.command");
    expect(content).toContain("create --project-name meu_app --platforms android .");
    expect(content).toContain("cp .openflow/main.dart lib/main.dart");
    expect(content).toContain("-avd 'Pixel_8'");
    expect(content).toContain("app-debug.apk");
    expect(content.trim().endsWith("'/opt/flutter/bin/flutter' run")).toBe(true);
  });
  it("bash: sintaxe válida (bash -n), inclusive com aspas no caminho", () => {
    const d = mkdtempSync(join(tmpdir(), "of-"));
    for (const avd of ["Pixel_8", null]) {
      const f = join(d, "run.sh");
      writeFileSync(f, runScript("linux", { ...input, dir: "/tmp/it's here", avd }).content);
      execFileSync("bash", ["-n", f]);
    }
  });
  it("sem emulador: avisa e sai em vez de rodar", () => {
    expect(runScript("darwin", { ...input, avd: null }).content).toContain("Nenhum emulador criado");
    expect(runScript("win32", { ...input, avd: null }).content).toContain("Nenhum emulador criado");
  });
  it("windows: .bat com CRLF e caminhos do SDK", () => {
    const { file, content } = runScript("win32", { ...input, dir: "C:\\b\\meu_app", sdk: "C:\\sdk" });
    expect(file).toBe("run.bat");
    expect(content).toContain("\r\n");
    expect(content).toContain('"C:\\sdk\\emulator\\emulator.exe" -avd "Pixel_8"');
  });
});

describe("terminalCommand", () => {
  it("abre o terminal nativo de cada sistema", () => {
    expect(terminalCommand("darwin", "/x/run.command")).toEqual({ cmd: "open", args: ["-a", "Terminal", "/x/run.command"] });
    expect(terminalCommand("win32", "C:\\x\\run.bat").args).toContain("/k");
    expect(terminalCommand("linux", "/x/run.sh").cmd).toBe("x-terminal-emulator");
  });
});

describe("onboardingSteps", () => {
  it("máquina vazia: nada concluído, com comandos por sistema", () => {
    const steps = onboardingSteps("darwin", { flutter: null, sdk: null, avds: [] });
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(steps[0].commands).toEqual(["brew install --cask flutter"]);
    expect(onboardingSteps("win32", { flutter: null, sdk: null, avds: [] })[1].commands[0]).toContain("winget");
  });
  it("tudo instalado: todos concluídos", () => {
    expect(onboardingSteps("linux", { flutter: "/f", sdk: "/s", avds: ["P"] }).every((s) => s.done)).toBe(true);
  });
});
