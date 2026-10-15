import { useState } from "react";

type Step = { id: string; title: string; detail: string; commands: string[]; done: boolean };
const OS: Record<string, string> = { darwin: "macOS", win32: "Windows", linux: "Linux" };

/** Botão que gera o APK e abre um terminal rodando o app ao vivo no emulador; se faltar algo, mostra o onboarding. */
export function RunButton({ name, code }: { name: string; code: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [setup, setSetup] = useState<{ platform: string; steps: Step[] } | null>(null);

  const check = async () => {
    const r = await fetch("/api/doctor").then((r) => r.json());
    setSetup(r);
    return r.steps.every((s: Step) => s.done);
  };

  const run = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, code }) });
      if (r.status === 404) setMsg("Rodar no emulador só funciona com `npm run dev`.");
      else if (r.status === 412) await check();
      else {
        const j = await r.json();
        setMsg(r.ok ? `Terminal aberto: compilando e abrindo no emulador ${j.avd}. Projeto em ${j.dir}` : `Erro: ${j.error}`);
      }
    } catch (e) { setMsg(`Erro: ${(e as Error).message}`); }
    setBusy(false);
  };

  return (
    <>
      <button className="tbtn run" onClick={run} disabled={busy} title="Gera o APK e roda ao vivo no emulador">{busy ? "Abrindo…" : "▶ Rodar no emulador"}</button>
      {msg && <div className="toast" onClick={() => setMsg("")}>{msg}</div>}
      {setup && (
        <div className="modal-bg" onClick={() => setSetup(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Preparar a máquina ({OS[setup.platform] ?? setup.platform})</h3>
            <p className="muted">Para rodar no emulador faltam algumas instalações. Faça os passos pendentes e clique em verificar.</p>
            <ol className="steps">
              {setup.steps.map((s) => (
                <li key={s.id} className={s.done ? "done" : ""}>
                  <b>{s.done ? "✓ " : ""}{s.title}</b>
                  <div className="muted">{s.detail}</div>
                  {!s.done && s.commands.map((c) => (
                    <div key={c} className="cmd"><code>{c}</code><button onClick={() => navigator.clipboard.writeText(c)}>Copiar</button></div>
                  ))}
                </li>
              ))}
            </ol>
            <div className="modal-actions">
              <button className="tbtn" onClick={() => setSetup(null)}>Fechar</button>
              <button className="tbtn primary" onClick={async () => { if (await check()) { setSetup(null); run(); } }}>Verificar de novo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
