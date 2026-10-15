// Esquema v0: o contrato do app. Editor escreve, preview e codegen leem.
export const SCHEMA_VERSION = 0;

export type WidgetType = "Column" | "Row" | "Text" | "Button" | "Container";

export interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, string | number>;
  children: WidgetNode[];
}

export interface Page {
  name: string;
  root: WidgetNode;
}

export interface AppDoc {
  version: typeof SCHEMA_VERSION;
  name: string;
  pages: Page[];
}

export const CONTAINER_TYPES: WidgetType[] = ["Column", "Row", "Container"];

export const DEFAULT_PROPS: Record<WidgetType, WidgetNode["props"]> = {
  Column: { spacing: 8 },
  Row: { spacing: 8 },
  Container: { padding: 16, color: "#E3F2FD" },
  Text: { text: "Texto", fontSize: 16 },
  Button: { label: "Botão" },
};

let counter = 0;
export function createNode(type: WidgetType): WidgetNode {
  counter += 1;
  return { id: `${type.toLowerCase()}_${Date.now().toString(36)}_${counter}`, type, props: { ...DEFAULT_PROPS[type] }, children: [] };
}

export function emptyApp(name = "MeuApp"): AppDoc {
  return { version: SCHEMA_VERSION, name, pages: [{ name: "Home", root: { ...createNode("Column"), id: "root" } }] };
}

/** Insere `child` dentro do nó `parentId`. Retorna nova árvore (imutável). */
export function insertChild(node: WidgetNode, parentId: string, child: WidgetNode): WidgetNode {
  if (node.id === parentId) {
    if (!CONTAINER_TYPES.includes(node.type)) throw new Error(`${node.type} não aceita filhos`);
    if (node.type === "Container" && node.children.length >= 1) throw new Error("Container aceita só um filho");
    return { ...node, children: [...node.children, child] };
  }
  return { ...node, children: node.children.map((c) => insertChild(c, parentId, child)) };
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
