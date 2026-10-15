import type { DropPosition, WidgetType } from "../core/schema";

export type DragPayload = { kind: "new"; type: WidgetType } | { kind: "move"; id: string };
export const DND_MIME = "application/x-openflow";

// Durante o dragover o navegador não deixa ler os dados; guardamos o payload aqui.
let current: DragPayload | null = null;
export const startDrag = (e: React.DragEvent, payload: DragPayload) => {
  current = payload;
  e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
  e.dataTransfer.effectAllowed = payload.kind === "new" ? "copy" : "move";
};
export const currentDrag = () => current;
export const endDrag = () => { current = null; };

/**
 * Onde soltar em relação a um nó, pela posição do ponteiro.
 * Nós que aceitam filhos: faixa central = dentro, bordas = antes/depois.
 * `axis` é a direção do pai (Row = horizontal).
 */
export function dropPosition(
  rect: { left: number; top: number; width: number; height: number },
  point: { x: number; y: number },
  axis: "horizontal" | "vertical",
  acceptsChildren: boolean,
  isRoot = false,
): DropPosition {
  if (isRoot) return "inside";
  const t = axis === "horizontal" ? (point.x - rect.left) / (rect.width || 1) : (point.y - rect.top) / (rect.height || 1);
  if (acceptsChildren) {
    if (t < 0.25) return "before";
    if (t > 0.75) return "after";
    return "inside";
  }
  return t < 0.5 ? "before" : "after";
}
