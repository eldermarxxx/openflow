import { useState } from "react";
import type { WidgetNode } from "../core/schema";
import { endDrag, startDrag } from "./dnd";
import { dropClass, type DropApi } from "./drop";
import { WidgetIcon } from "./icons";

type Props = { root: WidgetNode; pageName: string; selected: string; onSelect: (id: string) => void; dnd: DropApi };

/** Árvore de widgets: selecionar, recolher e arrastar para reordenar ou trocar de pai. */
export function Tree({ root, pageName, selected, onSelect, dnd }: Props) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const row = (node: WidgetNode, depth: number): React.ReactNode => {
    const isRoot = node.id === root.id;
    const open = !closed.has(node.id);
    return (
      <div key={node.id}>
        <div
          className={`trow ${node.id === selected ? "on" : ""} ${dropClass(dnd.hover, node.id, "vertical")}`}
          style={{ paddingLeft: 10 + depth * 16 }}
          draggable={!isRoot}
          onDragStart={(e) => startDrag(e, { kind: "move", id: node.id })}
          onDragEnd={() => { endDrag(); dnd.leave(); }}
          onDragOver={(e) => dnd.over(e, node, "vertical")}
          onDrop={(e) => dnd.drop(e)}
          onClick={() => onSelect(node.id)}
        >
          <span className="caret" onClick={(e) => { e.stopPropagation(); toggle(node.id); }}>{node.children.length ? (open ? "▾" : "▸") : ""}</span>
          <WidgetIcon type={node.type} />
          <span>{node.type}</span>
          {node.type === "Text" && <span className="muted trow-hint">{String(node.props.text).slice(0, 18)}</span>}
        </div>
        {open && node.children.map((c) => row(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="tree">
      <div className="trow page-row"><span className="caret" />📱 <b>{pageName}</b></div>
      {row(root, 1)}
      <p className="muted pad">Arraste para reordenar. As regras do Flutter valem aqui: Expanded/Spacer só em Row/Column, Container/Card/Center aceitam um filho.</p>
    </div>
  );
}
