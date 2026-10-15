import { useMemo, useState } from "react";
import { generateMainDart } from "./core/codegen";
import { CONTAINER_TYPES, createNode, emptyApp, findNode, insertChild, removeNode, updateProps, type AppDoc, type WidgetNode, type WidgetType } from "./core/schema";
import { WidgetIcon } from "./ui/icons";
import { PALETTE_GROUPS, filterPalette } from "./ui/palette";

const ACCENT = "#4f46e5";

function Preview({ node, selected, onSelect }: { node: WidgetNode; selected: string; onSelect: (id: string) => void }) {
  const p = node.props;
  const kids = node.children.map((c) => <Preview key={c.id} node={c} selected={selected} onSelect={onSelect} />);
  const style: React.CSSProperties = { outline: node.id === selected ? `2px solid ${ACCENT}` : "1px dashed transparent", outlineOffset: -1, minHeight: 24, cursor: "pointer" };
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  switch (node.type) {
    case "Column":
    case "Row":
      return <div onClick={click} className="pv" style={{ ...style, display: "flex", flexDirection: node.type === "Row" ? "row" : "column", gap: Number(p.spacing), alignItems: "flex-start", minHeight: node.id === "root" ? "100%" : 24 }}>{kids}</div>;
    case "Container":
      return <div onClick={click} className="pv" style={{ ...style, padding: Number(p.padding), background: String(p.color) }}>{kids}</div>;
    case "Text":
      return <span onClick={click} className="pv" style={{ ...style, fontSize: Number(p.fontSize), color: "#111827" }}>{String(p.text)}</span>;
    case "Button":
      return <button onClick={click} className="pv" style={{ ...style, padding: "10px 18px", borderRadius: 8, border: 0, background: ACCENT, color: "#fff", fontWeight: 600 }}>{String(p.label)}</button>;
  }
}

export default function App() {
  const [doc, setDoc] = useState<AppDoc>(() => emptyApp());
  const [selected, setSelected] = useState("root");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"props" | "code">("props");
  const [zoom, setZoom] = useState(90);
  const page = doc.pages[0];
  const setRoot = (root: WidgetNode) => setDoc({ ...doc, pages: [{ ...page, root }, ...doc.pages.slice(1)] });
  const sel = findNode(page.root, selected) ?? page.root;
  const code = useMemo(() => generateMainDart(doc), [doc]);
  const groups = filterPalette(PALETTE_GROUPS, query);

  const add = (type: WidgetType) => {
    const target = CONTAINER_TYPES.includes(sel.type) ? sel.id : "root";
    try { setRoot(insertChild(page.root, target, createNode(type))); setError(""); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="logo">◆</div>
        <div className="proj"><b>{doc.name}</b> <span className="muted">salvo localmente</span></div>
        <div className="spacer" />
        <button className="tbtn" onClick={() => setTab("code")} title="Ver código">&lt;/&gt;</button>
        <button className="tbtn primary" onClick={() => navigator.clipboard.writeText(code)} title="Copiar main.dart">Copiar código</button>
      </header>
      <div className="body">
        <nav className="rail">
          <span className="rail-label">Build</span>
          <button className="rail-btn active" title="Widgets">＋</button>
        </nav>
        <aside className="palette">
          <div className="search"><span>⌕</span><input placeholder="Buscar widget..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          {groups.map((g) => (
            <section key={g.title}>
              <h4>{g.title}</h4>
              <div className="grid">
                {g.items.map((t) => (
                  <button key={g.title + t} className="tile" onClick={() => add(t)}><WidgetIcon type={t} /><span>{t}</span></button>
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && <p className="muted pad">Nenhum widget encontrado.</p>}
          {error && <p className="err pad">{error}</p>}
        </aside>
        <main className="canvas">
          <div className="ctoolbar">
            <button className="tbtn" onClick={() => setZoom((z) => Math.max(50, z - 10))}>−</button>
            <span className="zoom">{zoom}%</span>
            <button className="tbtn" onClick={() => setZoom((z) => Math.min(150, z + 10))}>+</button>
            <span className="device">▯ Celular <span className="muted">390 × 844</span></span>
          </div>
          <div className="stage">
            <div className="phone" style={{ transform: `scale(${zoom / 100})` }} onClick={() => setSelected("root")}>
              <div className="appbar">{page.name}</div>
              <div className="screen"><Preview node={page.root} selected={sel.id} onSelect={setSelected} /></div>
            </div>
          </div>
        </main>
        <aside className="props">
          <div className="sel-head"><WidgetIcon type={sel.type} /><div><b>{sel.type}</b><div className="muted">{sel.id}</div></div></div>
          <div className="tabs">
            <button className={tab === "props" ? "on" : ""} onClick={() => setTab("props")}>Propriedades</button>
            <button className={tab === "code" ? "on" : ""} onClick={() => setTab("code")}>Código</button>
          </div>
          {tab === "props" ? (
            <section className="psec">
              <h4>Estilo do widget</h4>
              {Object.keys(sel.props).length === 0 && <p className="muted">Sem propriedades.</p>}
              {Object.entries(sel.props).map(([k, v]) => (
                <label key={k}><span>{k}</span>
                  <input value={v} onChange={(e) => setRoot(updateProps(page.root, sel.id, { [k]: typeof v === "number" ? Number(e.target.value) : e.target.value }))} />
                </label>
              ))}
              {sel.id !== "root" && <button className="danger" onClick={() => { setRoot(removeNode(page.root, sel.id)); setSelected("root"); }}>Remover widget</button>}
            </section>
          ) : (
            <section className="psec">
              <h4>lib/main.dart</h4>
              <button className="tbtn primary" onClick={() => navigator.clipboard.writeText(code)}>Copiar código</button>
              <pre>{code}</pre>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
