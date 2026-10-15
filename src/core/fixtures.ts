import { createNode, emptyApp, insertChild, type AppDoc, type WidgetType } from "./schema";

/** App de exemplo com todos os widgets e props de página, para testes de codegen. */
export function everything(): AppDoc {
  const doc = emptyApp("Vitrine");
  let root = doc.pages[0].root;
  const add = (parent: string, type: WidgetType) => { const n = createNode(type); root = insertChild(root, parent, n); return n.id; };
  const row = add("root", "Row");
  add(row, "Text"); add(row, "Spacer"); const exp = add(row, "Expanded"); add(exp, "Button");
  const stack = add("root", "Stack"); add(stack, "Image"); const center = add(stack, "Center"); add(center, "Text");
  const list = add("root", "ListView"); add(list, "Divider"); const card = add(list, "Card"); add(card, "Text");
  const box = add("root", "Container"); add(box, "Text");
  add("root", "Expanded"); add("root", "Card"); add("root", "Divider");
  return { ...doc, pages: [{ ...doc.pages[0], props: { title: "Vitrine 'x' $y", appBarColor: "#112233", background: "#FFFFFF" }, root: { ...root, props: { ...root.props, padding: 12 } } }] };
}
