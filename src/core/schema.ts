// Esquema: o contrato do app. Editor escreve, preview e codegen leem.
export const SCHEMA_VERSION = 0;

export type WidgetType =
  | "Column" | "Row" | "Stack" | "ListView"
  | "Container" | "Card" | "Center" | "Expanded"
  | "Text" | "Button" | "Image" | "Spacer" | "Divider";

export type PropValue = string | number;

export interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, PropValue>;
  children: WidgetNode[];
}

export interface Page {
  name: string;
  root: WidgetNode;
  props?: Record<string, PropValue>;
}

export interface AppDoc {
  version: typeof SCHEMA_VERSION;
  name: string;
  pages: Page[];
}

// ---- Propriedades editáveis -------------------------------------------------

export type PropSpec = {
  key: string;
  label: string;
  group: "Conteúdo" | "Layout" | "Estilo";
  kind: "text" | "number" | "color" | "select";
  options?: string[];
};

const MAIN_AXIS = ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly"];
const CROSS_AXIS = ["start", "center", "end", "stretch"];
export const ALIGNMENTS = ["topLeft", "topCenter", "topRight", "centerLeft", "center", "centerRight", "bottomLeft", "bottomCenter", "bottomRight"];

const p = (key: string, label: string, group: PropSpec["group"], kind: PropSpec["kind"], options?: string[]): PropSpec => ({ key, label, group, kind, options });
const flexProps = [
  p("mainAxis", "Eixo principal", "Layout", "select", MAIN_AXIS),
  p("crossAxis", "Eixo cruzado", "Layout", "select", CROSS_AXIS),
  p("spacing", "Espaçamento", "Layout", "number"),
  p("padding", "Padding", "Layout", "number"),
];

/** Regras de cada widget, espelhando o Flutter. */
export const WIDGETS: Record<WidgetType, {
  /** "many": children; "one": child; "none": folha. */
  children: "many" | "one" | "none";
  /** Pais permitidos (ex.: Expanded/Spacer só dentro de Row/Column). */
  parents?: WidgetType[];
  defaults: WidgetNode["props"];
  props: PropSpec[];
}> = {
  Column: { children: "many", defaults: { spacing: 8, mainAxis: "start", crossAxis: "start", padding: 0 }, props: flexProps },
  Row: { children: "many", defaults: { spacing: 8, mainAxis: "start", crossAxis: "center", padding: 0 }, props: flexProps },
  Stack: { children: "many", defaults: { alignment: "topLeft" }, props: [p("alignment", "Alinhamento", "Layout", "select", ALIGNMENTS)] },
  ListView: { children: "many", defaults: { padding: 0 }, props: [p("padding", "Padding", "Layout", "number")] },
  Container: {
    children: "one",
    defaults: { padding: 16, color: "#E3F2FD", width: 0, height: 0, radius: 0 },
    props: [p("width", "Largura (0 = auto)", "Layout", "number"), p("height", "Altura (0 = auto)", "Layout", "number"), p("padding", "Padding", "Layout", "number"), p("color", "Cor", "Estilo", "color"), p("radius", "Raio da borda", "Estilo", "number")],
  },
  Card: { children: "one", defaults: { padding: 16, elevation: 2, color: "#FFFFFF", radius: 12 }, props: [p("padding", "Padding", "Layout", "number"), p("elevation", "Elevação", "Estilo", "number"), p("color", "Cor", "Estilo", "color"), p("radius", "Raio da borda", "Estilo", "number")] },
  Center: { children: "one", defaults: {}, props: [] },
  Expanded: { children: "one", parents: ["Row", "Column"], defaults: { flex: 1 }, props: [p("flex", "Flex", "Layout", "number")] },
  Text: {
    children: "none",
    defaults: { text: "Texto", fontSize: 16, color: "#111827", weight: "normal", align: "start" },
    props: [p("text", "Texto", "Conteúdo", "text"), p("fontSize", "Tamanho", "Estilo", "number"), p("color", "Cor", "Estilo", "color"), p("weight", "Peso", "Estilo", "select", ["normal", "w500", "w600", "bold"]), p("align", "Alinhamento", "Estilo", "select", ["start", "center", "end"])],
  },
  Button: {
    children: "none",
    defaults: { label: "Botão", color: "#4F46E5", textColor: "#FFFFFF", radius: 8 },
    props: [p("label", "Texto", "Conteúdo", "text"), p("color", "Cor de fundo", "Estilo", "color"), p("textColor", "Cor do texto", "Estilo", "color"), p("radius", "Raio da borda", "Estilo", "number")],
  },
  Image: {
    children: "none",
    defaults: { url: "https://picsum.photos/seed/openflow/400/400", width: 200, height: 200, fit: "cover", radius: 0 },
    props: [p("url", "URL", "Conteúdo", "text"), p("width", "Largura", "Layout", "number"), p("height", "Altura", "Layout", "number"), p("fit", "Ajuste", "Estilo", "select", ["cover", "contain", "fill"]), p("radius", "Raio da borda", "Estilo", "number")],
  },
  Spacer: { children: "none", parents: ["Row", "Column"], defaults: { flex: 1 }, props: [p("flex", "Flex", "Layout", "number")] },
  Divider: { children: "none", parents: ["Column", "ListView"], defaults: { thickness: 1, color: "#D1D5DB" }, props: [p("thickness", "Espessura", "Estilo", "number"), p("color", "Cor", "Estilo", "color")] },
};

export const PAGE_PROPS: PropSpec[] = [
  p("title", "Título da AppBar", "Conteúdo", "text"),
  p("appBarColor", "Cor da AppBar", "Estilo", "color"),
  p("background", "Cor de fundo", "Estilo", "color"),
];
export const PAGE_DEFAULTS = { title: "Home", appBarColor: "#4F46E5", background: "#F3F4F8" };

export const CONTAINER_TYPES = (Object.keys(WIDGETS) as WidgetType[]).filter((t) => WIDGETS[t].children !== "none");
export const DEFAULT_PROPS = Object.fromEntries(Object.entries(WIDGETS).map(([t, w]) => [t, w.defaults])) as Record<WidgetType, WidgetNode["props"]>;

let counter = 0;
export function createNode(type: WidgetType): WidgetNode {
  counter += 1;
  return { id: `${type.toLowerCase()}_${Date.now().toString(36)}_${counter}`, type, props: { ...DEFAULT_PROPS[type] }, children: [] };
}

export function emptyApp(name = "MeuApp"): AppDoc {
  return { version: SCHEMA_VERSION, name, pages: [{ name: "Home", props: { ...PAGE_DEFAULTS }, root: { ...createNode("Column"), id: "root" } }] };
}

// ---- Regras ----------------------------------------------------------------

/** Motivo pelo qual `parent` não aceita mais um filho `child`, ou null se aceita. */
export function rejectReason(parent: WidgetNode, child: WidgetType, ignoreId?: string): string | null {
  const rule = WIDGETS[parent.type];
  if (rule.children === "none") return `${parent.type} não aceita filhos`;
  const count = parent.children.filter((c) => c.id !== ignoreId).length;
  if (rule.children === "one" && count >= 1) return `${parent.type} aceita só um filho`;
  const allowed = WIDGETS[child].parents;
  if (allowed && !allowed.includes(parent.type)) return `${child} só pode ficar dentro de ${allowed.join(" ou ")}`;
  return null;
}

// ---- Operações imutáveis ----------------------------------------------------

/** Insere `child` dentro do nó `parentId` (no fim, ou em `index`). Lança erro se violar as regras. */
export function insertChild(node: WidgetNode, parentId: string, child: WidgetNode, index?: number): WidgetNode {
  if (node.id === parentId) {
    const reason = rejectReason(node, child.type);
    if (reason) throw new Error(reason);
    const kids = [...node.children];
    kids.splice(index ?? kids.length, 0, child);
    return { ...node, children: kids };
  }
  return { ...node, children: node.children.map((c) => insertChild(c, parentId, child, index)) };
}

export function updateProps(node: WidgetNode, id: string, props: WidgetNode["props"]): WidgetNode {
  if (node.id === id) return { ...node, props: { ...node.props, ...props } };
  return { ...node, children: node.children.map((c) => updateProps(c, id, props)) };
}

export function removeNode(node: WidgetNode, id: string): WidgetNode {
  return { ...node, children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)) };
}

export function findNode(node: WidgetNode, id: string): WidgetNode | undefined {
  if (node.id === id) return node;
  for (const c of node.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
}

export function findParent(node: WidgetNode, id: string): WidgetNode | undefined {
  for (const c of node.children) {
    if (c.id === id) return node;
    const f = findParent(c, id);
    if (f) return f;
  }
}

/** Move o nó `id` para dentro de `parentId`, na posição `index` (contada antes da remoção). */
export function moveNode(root: WidgetNode, id: string, parentId: string, index?: number): WidgetNode {
  const reason = dropRejectReason(root, { parentId }, { id });
  if (reason) throw new Error(reason);
  const node = findNode(root, id)!;
  const oldParent = findParent(root, id)!;
  let i = index;
  if (i !== undefined && oldParent.id === parentId && oldParent.children.findIndex((c) => c.id === id) < i) i -= 1;
  return insertChild(removeNode(root, id), parentId, node, i);
}

export type DropPosition = "before" | "after" | "inside";

/** Converte "soltar sobre o nó X (antes/depois/dentro)" em pai + índice. */
export function dropTarget(root: WidgetNode, overId: string, pos: DropPosition): { parentId: string; index?: number } | null {
  if (pos === "inside" || overId === root.id) return { parentId: overId };
  const parent = findParent(root, overId);
  if (!parent) return null;
  const i = parent.children.findIndex((c) => c.id === overId);
  return { parentId: parent.id, index: pos === "before" ? i : i + 1 };
}

/** Motivo pelo qual o drop não é permitido (null = permitido). `moving` = id existente ou tipo novo. */
export function dropRejectReason(root: WidgetNode, target: { parentId: string }, moving: { id: string } | { type: WidgetType }): string | null {
  const parent = findNode(root, target.parentId);
  if (!parent) return "Destino inválido";
  if ("id" in moving) {
    if (moving.id === root.id) return "A raiz da página não pode ser movida";
    const node = findNode(root, moving.id);
    if (!node) return "Widget não encontrado";
    if (findNode(node, target.parentId)) return "Não dá para mover um widget para dentro dele mesmo";
    return rejectReason(parent, node.type, findParent(root, moving.id)?.id === parent.id ? moving.id : undefined);
  }
  return rejectReason(parent, moving.type);
}
