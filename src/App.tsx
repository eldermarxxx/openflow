import { useCallback, useEffect, useMemo, useState } from "react";
import { generateMainDart } from "./core/codegen";
import { initHistory, push, redo, undo } from "./core/history";
import {
  PAGE_DEFAULTS, PAGE_PROPS, WIDGETS, createNode, dropTarget, emptyApp, findNode, findParent, insertChild, moveNode, removeNode, updateProps,
  type AppDoc, type WidgetNode, type WidgetType,
} from "./core/schema";
import { Preview } from "./ui/Canvas";
import { PropEditors } from "./ui/PropsPanel";
import { RunButton } from "./ui/RunButton";
import { Tree } from "./ui/Tree";
import { DND_MIME, endDrag, startDrag, type DragPayload } from "./ui/dnd";
import { evaluate, positionFor, type DropApi, type Hover } from "./ui/drop";
import { WidgetIcon } from "./ui/icons";
import { PALETTE_GROUPS, filterPalette } from "./ui/palette";

export default function App() {
  const [hist, setHist] = useState(() => initHistory<AppDoc>(emptyApp()));
  const doc = hist.present;
  const [selected, setSelected] = useState("root");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"props" | "code">("props");
  const [left, setLeft] = useState<"widgets" | "tree">("widgets");
  const [zoom, setZoom] = useState(90);
  const [hover, setHover] = useState<Hover | null>(null);
  const page = doc.pages[0];
  const root = page.root;
  const pageProps = { ...PAGE_DEFAULTS, ...page.props };
  const sel = findNode(root, selected) ?? root;
  const code = useMemo(() => generateMainDart(doc), [doc]);
  const groups = filterPalette(PALETTE_GROUPS, query);

  const commit = useCallback((next: AppDoc) => setHist((h) => push(h, next)), []);
  const setRoot = (r: WidgetNode) => commit({ ...doc, pages: [{ ...page, root: r }, ...doc.pages.slice(1)] });
  const setPageProp = (k: string, v: string | number) => commit({ ...doc, pages: [{ ...page, props: { ...pageProps, [k]: v } }, ...doc.pages.slice(1)] });
  const fail = (e: unknown) => setError((e as Error).message);

  /** Clique na paleta: insere no selecionado se ele aceitar; senão ao lado dele; senão na raiz. */
  const add = (type: WidgetType) => {
    const node = createNode(type);
    const parent = findParent(root, sel.id);
    const tries: [string, number | undefined][] = [[sel.id, undefined]];
    if (parent) tries.push([parent.id, parent.children.findIndex((c) => c.id === sel.id) + 1]);
    tries.push([root.id, undefined]);
    let lastErr: unknown;
    for (const [pid, idx] of tries) {
      try { setRoot(insertChild(root, pid, node, idx)); setSelected(node.id); setError(""); return; } catch (e) { lastErr = e; }
    }
    fail(lastErr);
  };

  const dnd: DropApi = {
    hover,
    over: (e, node, axis) => {
      const h = evaluate(root, node, positionFor(e, root, node, axis));
      if (!h) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = h.ok ? (e.dataTransfer.effectAllowed === "copy" ? "copy" : "move") : "none";
      if (!hover || hover.id !== h.id || hover.pos !== h.pos || hover.ok !== h.ok) setHover(h);
    },
    drop: (e) => {
      e.preventDefault();
      const h = hover;
      setHover(null);
      const raw = e.dataTransfer.getData(DND_MIME);
      endDrag();
      if (!h || !raw) return;
      if (!h.ok) return setError(h.reason ?? "Não permitido aqui");
      const payload = JSON.parse(raw) as DragPayload;
      const t = dropTarget(root, h.id, h.pos)!;
      try {
        if (payload.kind === "new") {
          const node = createNode(payload.type);
          setRoot(insertChild(root, t.parentId, node, t.index));
          setSelected(node.id);
        } else {
          setRoot(moveNode(root, payload.id, t.parentId, t.index));
          setSelected(payload.id);
        }
        setError("");
      } catch (err) { fail(err); }
    },
    leave: () => setHover(null),
  };

  const remove = () => {
    if (sel.id === root.id) return;
    const parent = findParent(root, sel.id);
    setRoot(removeNode(root, sel.id));
    setSelected(parent?.id ?? root.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select");
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); setHist((h) => (e.shiftKey ? redo(h) : undo(h))); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); setHist(redo); }
      else if (!typing && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); remove(); }
      else if (!typing && e.key === "Escape") setSelected(root.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const isRootSel = sel.id === root.id;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="logo">◆</div>
        <div className="proj"><b>{doc.name}</b> <span className="muted">salvo localmente</span></div>
        <button className="tbtn icon" title="Desfazer (⌘Z)" disabled={!hist.past.length} onClick={() => setHist(undo)}>↶</button>
        <button className="tbtn icon" title="Refazer (⇧⌘Z)" disabled={!hist.future.length} onClick={() => setHist(redo)}>↷</button>
        <div className="spacer" />
        <RunButton name={doc.name} code={code} />
        <button className="tbtn" onClick={() => setTab("code")} title="Ver código">&lt;/&gt;</button>
        <button className="tbtn primary" onClick={() => navigator.clipboard.writeText(code)} title="Copiar main.dart">Copiar código</button>
      </header>
      <div className="body">
        <nav className="rail">
          <span className="rail-label">Build</span>
          <button className={`rail-btn ${left === "widgets" ? "active" : ""}`} title="Widgets" onClick={() => setLeft("widgets")}>＋</button>
          <button className={`rail-btn ${left === "tree" ? "active" : ""}`} title="Árvore de widgets" onClick={() => setLeft("tree")}>☰</button>
        </nav>
        <aside className="palette">
          {left === "widgets" ? (
            <>
              <div className="search"><span>⌕</span><input placeholder="Buscar widget..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
              <p className="muted pad">Arraste para a tela ou para a árvore, ou clique para inserir no selecionado.</p>
              {groups.map((g) => (
                <section key={g.title}>
                  <h4>{g.title}</h4>
                  <div className="grid">
                    {g.items.map((t) => (
                      <button key={g.title + t} className="tile" draggable onDragStart={(e) => startDrag(e, { kind: "new", type: t })} onDragEnd={() => { endDrag(); setHover(null); }} onClick={() => add(t)}>
                        <WidgetIcon type={t} /><span>{t}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {groups.length === 0 && <p className="muted pad">Nenhum widget encontrado.</p>}
            </>
          ) : (
            <Tree root={root} pageName={page.name} selected={sel.id} onSelect={setSelected} dnd={dnd} />
          )}
        </aside>
        <main className="canvas" onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(null); }}>
          <div className="ctoolbar">
            <button className="tbtn" onClick={() => setZoom((z) => Math.max(50, z - 10))}>−</button>
            <span className="zoom">{zoom}%</span>
            <button className="tbtn" onClick={() => setZoom((z) => Math.min(150, z + 10))}>+</button>
            <span className="device">▯ Celular <span className="muted">390 × 844</span></span>
          </div>
          <div className="stage" onClick={() => setSelected(root.id)}>
            <div className="phone" style={{ transform: `scale(${zoom / 100})`, background: String(pageProps.background) }}>
              <div className="appbar" style={{ background: String(pageProps.appBarColor) }}>{String(pageProps.title)}</div>
              <div className="screen">
                <Preview node={root} root={root} selected={sel.id} onSelect={setSelected} dnd={dnd} />
              </div>
            </div>
          </div>
          {error && <div className="toast bad" onClick={() => setError("")}>{error}</div>}
          {hover && !hover.ok && hover.reason && <div className="toast bad">{hover.reason}</div>}
        </main>
        <aside className="props">
          <div className="sel-head">
            <WidgetIcon type={sel.type} />
            <div><b>{isRootSel ? `Página ${page.name}` : sel.type}</b><div className="muted">{isRootSel ? "Scaffold + Column raiz" : sel.id}</div></div>
            {!isRootSel && <button className="tbtn icon danger-icon" title="Remover (Delete)" onClick={remove}>🗑</button>}
          </div>
          <div className="tabs">
            <button className={tab === "props" ? "on" : ""} onClick={() => setTab("props")}>Propriedades</button>
            <button className={tab === "code" ? "on" : ""} onClick={() => setTab("code")}>Código</button>
          </div>
          {tab === "props" ? (
            <section className="psec">
              {isRootSel && (
                <>
                  <h4>Página (Scaffold)</h4>
                  <PropEditors specs={PAGE_PROPS} values={pageProps} onChange={setPageProp} />
                  <h4>Column raiz</h4>
                </>
              )}
              {WIDGETS[sel.type].props.length === 0 && <p className="muted">Sem propriedades.</p>}
              <PropEditors specs={WIDGETS[sel.type].props} values={sel.props} onChange={(k, v) => setRoot(updateProps(root, sel.id, { [k]: v }))} />
              {WIDGETS[sel.type].parents && <p className="muted">Regra: {sel.type} só fica dentro de {WIDGETS[sel.type].parents!.join(" ou ")}.</p>}
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
