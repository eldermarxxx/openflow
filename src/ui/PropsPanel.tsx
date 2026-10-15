import type { PropSpec, PropValue } from "../core/schema";

/** Editores tipados agrupados (Conteúdo, Layout, Estilo). */
export function PropEditors({ specs, values, onChange }: { specs: PropSpec[]; values: Record<string, PropValue>; onChange: (key: string, v: PropValue) => void }) {
  const groups = ["Conteúdo", "Layout", "Estilo"] as const;
  return (
    <>
      {groups.map((g) => {
        const list = specs.filter((s) => s.group === g);
        if (!list.length) return null;
        return (
          <div key={g} className="pgroup">
            <h5>{g}</h5>
            {list.map((s) => {
              const v = values[s.key] ?? "";
              let input: React.ReactNode;
              if (s.kind === "select") input = <select value={String(v)} onChange={(e) => onChange(s.key, e.target.value)}>{s.options!.map((o) => <option key={o}>{o}</option>)}</select>;
              else if (s.kind === "color") input = (
                <div className="color-in">
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(String(v)) ? String(v) : "#000000"} onChange={(e) => onChange(s.key, e.target.value.toUpperCase())} />
                  <input value={String(v)} onChange={(e) => onChange(s.key, e.target.value)} />
                </div>
              );
              else if (s.kind === "number") input = <input type="number" value={Number(v)} onChange={(e) => onChange(s.key, Number(e.target.value))} />;
              else input = <input value={String(v)} onChange={(e) => onChange(s.key, e.target.value)} />;
              return <label key={s.key}><span>{s.label}</span>{input}</label>;
            })}
          </div>
        );
      })}
    </>
  );
}
