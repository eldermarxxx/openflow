// Plugin do Vite (só no `npm run dev`): expõe /api/doctor e /api/run para o editor
// detectar Flutter/Android na máquina e abrir um terminal rodando o app no emulador.
import { execFileSync, spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Plugin } from "vite";
import { onboardingSteps, packageName, runScript, terminalCommand, type Platform, type ToolStatus } from "./scripts.ts";

const platform = (process.platform === "win32" || process.platform === "darwin" ? process.platform : "linux") as Platform;
const exe = (n: string) => (platform === "win32" ? `${n}.bat` : n);

function which(bin: string): string | null {
  try {
    const out = execFileSync(platform === "win32" ? "where" : "which", [bin], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split(/\r?\n/)[0].trim() || null;
  } catch { return null; }
}

function detect(): ToolStatus {
  const h = homedir();
  const flutter = which("flutter") ?? [join(h, "development/flutter/bin"), join(h, "flutter/bin"), "C:\\src\\flutter\\bin", "/opt/homebrew/bin"]
    .map((d) => join(d, exe("flutter"))).find(existsSync) ?? null;
  const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, join(h, "Library/Android/sdk"), join(h, "Android/Sdk"), process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Android/Sdk")]
    .find((d): d is string => !!d && existsSync(d)) ?? null;
  let avds: string[] = [];
  const emu = sdk && join(sdk, "emulator", platform === "win32" ? "emulator.exe" : "emulator");
  if (emu && existsSync(emu)) {
    try { avds = execFileSync(emu, ["-list-avds"], { encoding: "utf8" }).split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("INFO")); } catch { /* sem AVDs */ }
  }
  return { flutter, sdk, avds };
}

function body(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((ok, fail) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => ok(d)); req.on("error", fail); });
}

export function openflowRunner(): Plugin {
  return {
    name: "openflow-runner",
    configureServer(server) {
      server.middlewares.use("/api/doctor", (_req, res) => {
        const status = detect();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ platform, status, steps: onboardingSteps(platform, status) }));
      });
      server.middlewares.use("/api/run", async (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") { res.statusCode = 405; return res.end("{}"); }
        try {
          const { name, code } = JSON.parse(await body(req)) as { name: string; code: string };
          const status = detect();
          if (!status.flutter || !status.sdk || status.avds.length === 0) {
            res.statusCode = 412;
            return res.end(JSON.stringify({ error: "setup", steps: onboardingSteps(platform, status) }));
          }
          const pkg = packageName(name);
          const dir = join(homedir(), "OpenFlowBuilds", pkg);
          mkdirSync(join(dir, ".openflow"), { recursive: true });
          writeFileSync(join(dir, ".openflow", "main.dart"), String(code));
          const script = runScript(platform, { dir, pkg, flutter: status.flutter, sdk: status.sdk, avd: status.avds[0] });
          const file = join(dir, ".openflow", script.file);
          writeFileSync(file, script.content);
          chmodSync(file, 0o755);
          const t = terminalCommand(platform, file);
          spawn(t.cmd, t.args, { detached: true, stdio: "ignore", shell: platform === "win32" }).unref();
          res.end(JSON.stringify({ ok: true, dir, avd: status.avds[0] }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: (e as Error).message }));
        }
      });
    },
  };
}
