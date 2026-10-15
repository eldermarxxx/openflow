import { useMemo, useState } from "react";
import { generateMainDart } from "./core/codegen";
import { CONTAINER_TYPES, createNode, emptyApp, findNode, insertChild, removeNode, updateProps, type AppDoc, type WidgetNode, type WidgetType } from "./core/schema";

const PALETTE: WidgetType[] = ["Column", "Row", "Container", "Text", "Button"];

function Preview({ node, selected, onSelect }: { node: WidgetNode; selected: string; onSelect: (id: string) => void }) {
  const p = node.props;
  const kids = node.children.map((c) => <Preview key={c.id} node={c} selected={selected} onSelect={onSelect} />);
  const style: React.CSSProperties = { outline: node.id === selected ? "2px solid #2563eb" : "1px dashed #cbd5e1", minHeight: 24, cursor: "pointer" };
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  switch (node.type) {
    case "Column":
    case "Row":
      return <div onClick={click} style={{ ...style, display: "flex", flexDirection: node.type === "Row" ? "row" : "column", gap: Number(p.spacing), alignItems: "flex-start", padding: 4 }}>{kids}</div>;
    case "Container":
      return <div onClick={click} style={{ ...style, padding: Number(p.padding), background: String(p.color) }}>{kids}</div>;
    case "Text":
      return <span onClick={click} style={{ ...style, fontSize: Number(p.fontSize) }}>{String(p.text)}</span>;
    case "Button":
      return <button onClick={click} style={{ ...style, padding: "8px 16px", borderRadius: 20, border: 0, background: "#ede7f6", color: "#5b21b6" }}>{String(p.label)}</button>;
  }
}

export default function App() {
  const [doc, setDoc] = useState<AppDoc>(() => emptyApp());
  const [selected, setSelected] = useState("root");
  const [error, setError] = useState("");
  const page = doc.pages[0];
  const setRoot = (root: WidgetNode) => setDoc({ ...doc, pages: [{ ...page, root }, ...doc.pages.slice(1)] });
  const sel = findNode(page.root, selected) ?? page.root;
  const code = useMemo(() => generateMainDart(doc), [doc]);

  const add = (type: WidgetType) => {
    const target = CONTAINER_TYPES.includes(sel.type) ? sel.id : "root";
    try { setRoot(insertChild(page.root, target, createNode(type))); setError(""); }
    catch (e) { setError((e as Error).message); }
  };

  return (
    <div className="layout">
      <aside>
        <h2>OpenFlow</h2>
        <p className="hint">Selecione um Column/Row/Container e adicione widgets.</p>
        {PALETTE.map((t) => <button key={t} onClick={() => add(t)}>+ {t}</button>)}
        {error && <p className="err">{error}</p>}
      </aside>
      <main>
        <div className="phone">
          <div className="appbar">{page.name}</div>
          <Preview node={page.root} selected={sel.id} onSelect={setSelected} />
        </div>
      </main>
      <aside>
        <h3>{sel.type} <small>{sel.id}</small></h3>
        {Object.entries(sel.props).map(([k, v]) => (
          <label key={k}>{k}
            <input value={v} onChange={(e) => setRoot(updateProps(page.root, sel.id, { [k]: typeof v === "number" ? Number(e.target.value) : e.target.value }))} />
          </label>
        ))}
        {sel.id !== "root" && <button onClick={() => { setRoot(removeNode(page.root, sel.id)); setSelected("root"); }}>Remover</button>}
        <h3>lib/main.dart</h3>
        <button onClick={() => navigator.clipboard.writeText(code)}>Copiar código</button>
        <pre>{code}</pre>
      </aside>
    </div>
  );
}
