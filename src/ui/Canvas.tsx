import type { WidgetNode } from "../core/schema";
import { startDrag, endDrag } from "./dnd";
import { axisOf, dropClass, type DropApi } from "./drop";

const MAIN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", spaceBetween: "space-between", spaceAround: "space-around", spaceEvenly: "space-evenly" };
const CROSS: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const ALIGN: Record<string, [string, string]> = {
  topLeft: ["start", "start"], topCenter: ["start", "center"], topRight: ["start", "end"],
  centerLeft: ["center", "start"], center: ["center", "center"], centerRight: ["center", "end"],
  bottomLeft: ["end", "start"], bottomCenter: ["end", "center"], bottomRight: ["end", "end"],
};
const WEIGHT: Record<string, number> = { normal: 400, w500: 500, w600: 600, bold: 700 };
const n = (v: unknown) => Number(v) || 0;

type Props = { node: WidgetNode; parent?: WidgetNode; root: WidgetNode; selected: string; onSelect: (id: string) => void; dnd: DropApi };

/** Aproximação em React de cada widget Flutter, com seleção e arrasta e solta. */
export function Preview({ node, parent, root, selected, onSelect, dnd }: Props) {
  const P = node.props;
  const axis = axisOf(parent);
  const isRoot = node.id === root.id;
  const kids = node.children.map((c) => <Preview key={c.id} node={c} parent={node} root={root} selected={selected} onSelect={onSelect} dnd={dnd} />);
  const empty = node.children.length === 0 && node.type !== "Text" && !["Button", "Image", "Spacer", "Divider"].includes(node.type)
    ? <div className="empty-slot">{isRoot ? "Arraste widgets para cá" : node.type}</div> : null;
  const inFlex = parent && (parent.type === "Row" || parent.type === "Column");

  let style: React.CSSProperties = {};
  let content: React.ReactNode = <>{kids}{empty}</>;
  switch (node.type) {
    case "Column":
    case "Row":
      style = { display: "flex", flexDirection: node.type === "Row" ? "row" : "column", justifyContent: MAIN[String(P.mainAxis)], alignItems: CROSS[String(P.crossAxis)], gap: n(P.spacing), padding: n(P.padding), minHeight: isRoot ? "100%" : undefined };
      break;
    case "Stack": {
      const [v, h] = ALIGN[String(P.alignment)] ?? ALIGN.topLeft;
      style = { display: "grid", alignItems: v, justifyItems: h };
      content = <>{node.children.map((c) => <div key={c.id} style={{ gridArea: "1 / 1" }}><Preview node={c} parent={node} root={root} selected={selected} onSelect={onSelect} dnd={dnd} /></div>)}{empty}</>;
      break;
    }
    case "ListView":
      style = { display: "flex", flexDirection: "column", padding: n(P.padding), alignSelf: "stretch" };
      break;
    case "Container":
      style = { width: n(P.width) || undefined, height: n(P.height) || undefined, padding: n(P.padding), background: String(P.color), borderRadius: n(P.radius) };
      break;
    case "Card":
      style = { padding: n(P.padding), background: String(P.color), borderRadius: n(P.radius), boxShadow: `0 ${n(P.elevation)}px ${n(P.elevation) * 3}px rgba(0,0,0,.18)` };
      break;
    case "Center":
      style = { display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "stretch", flex: inFlex ? undefined : 1 };
      break;
    case "Expanded":
      style = { flex: n(P.flex) || 1, display: "flex", flexDirection: "column", alignSelf: "stretch" };
      break;
    case "Text":
      style = { fontSize: n(P.fontSize), color: String(P.color), fontWeight: WEIGHT[String(P.weight)] ?? 400, textAlign: P.align as React.CSSProperties["textAlign"], whiteSpace: "pre-wrap" };
      content = String(P.text);
      break;
    case "Button":
      style = { padding: "10px 18px", borderRadius: n(P.radius), background: String(P.color), color: String(P.textColor), fontWeight: 600, fontSize: 14 };
      content = String(P.label);
      break;
    case "Image":
      style = { width: n(P.width), height: n(P.height), borderRadius: n(P.radius), overflow: "hidden" };
      content = <img src={String(P.url)} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: P.fit as React.CSSProperties["objectFit"], display: "block" }} />;
      break;
    case "Spacer":
      style = { flex: n(P.flex) || 1, minWidth: 8, minHeight: 8 };
      content = null;
      break;
    case "Divider":
      style = { alignSelf: "stretch", borderTop: `${n(P.thickness)}px solid ${String(P.color)}`, margin: "8px 0" };
      content = null;
      break;
  }
  if (node.type === "Expanded" && parent?.type === "Row") style.flexDirection = "row";

  return (
    <div
      className={`pv ${node.id === selected ? "sel" : ""} ${node.type === "Spacer" ? "spacer" : ""} ${dropClass(dnd.hover, node.id, axis)}`}
      style={style}
      draggable={!isRoot}
      onDragStart={(e) => { e.stopPropagation(); startDrag(e, { kind: "move", id: node.id }); }}
      onDragEnd={() => { endDrag(); dnd.leave(); }}
      onDragOver={(e) => { e.stopPropagation(); dnd.over(e, node, axis); }}
      onDrop={(e) => { e.stopPropagation(); dnd.drop(e); }}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
    >
      {node.id === selected && !isRoot && <span className="sel-tag">{node.type}</span>}
      {content}
    </div>
  );
}
