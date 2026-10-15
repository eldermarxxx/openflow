import { WIDGETS, dropRejectReason, dropTarget, type DropPosition, type WidgetNode } from "../core/schema";
import { currentDrag, dropPosition } from "./dnd";

export type Hover = { id: string; pos: DropPosition; ok: boolean; reason: string | null };

export type DropApi = {
  hover: Hover | null;
  over: (e: React.DragEvent, node: WidgetNode, axis: "horizontal" | "vertical") => void;
  drop: (e: React.DragEvent) => void;
  leave: () => void;
};

/** Calcula o destino e se é válido para o arraste atual. */
export function evaluate(root: WidgetNode, node: WidgetNode, pos: DropPosition): Hover | null {
  const payload = currentDrag();
  if (!payload) return null;
  const target = dropTarget(root, node.id, pos);
  if (!target) return null;
  const reason = dropRejectReason(root, target, payload.kind === "new" ? { type: payload.type } : { id: payload.id });
  return { id: node.id, pos, ok: !reason, reason };
}

export function positionFor(e: React.DragEvent, root: WidgetNode, node: WidgetNode, axis: "horizontal" | "vertical"): DropPosition {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  return dropPosition(rect, { x: e.clientX, y: e.clientY }, axis, WIDGETS[node.type].children !== "none", node.id === root.id);
}

export const axisOf = (parent: WidgetNode | undefined): "horizontal" | "vertical" => (parent?.type === "Row" ? "horizontal" : "vertical");

export function dropClass(hover: Hover | null, id: string, axis: "horizontal" | "vertical") {
  if (!hover || hover.id !== id) return "";
  const base = hover.ok ? "" : " drop-bad";
  if (hover.pos === "inside") return "drop-inside" + base;
  return `drop-${hover.pos}-${axis === "horizontal" ? "h" : "v"}` + base;
}
