import { PAGE_DEFAULTS, type AppDoc, type Page, type WidgetNode } from "./schema";

const dartString = (s: unknown) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\$/g, "\\$")}'`;
const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toString() : fallback.toString();
};
const color = (hex: unknown) => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex));
  return `Color(0xFF${m ? m[1].toUpperCase() : "FFFFFF"})`;
};
export const className = (name: string) => {
  const c = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return /^[A-Za-z]/.test(c) ? c : `P${c || "age"}`;
};

const MAIN: Record<string, string> = { start: "start", center: "center", end: "end", spaceBetween: "spaceBetween", spaceAround: "spaceAround", spaceEvenly: "spaceEvenly" };
const CROSS: Record<string, string> = { start: "start", center: "center", end: "end", stretch: "stretch" };
const ALIGN = new Set(["topLeft", "topCenter", "topRight", "centerLeft", "center", "centerRight", "bottomLeft", "bottomCenter", "bottomRight"]);
const pick = (map: Record<string, string> | Set<string>, v: unknown, fb: string) => {
  const k = String(v);
  return map instanceof Set ? (map.has(k) ? k : fb) : (map[k] ?? fb);
};
const pos = (v: unknown) => Number(v) > 0;

/** Monta `Nome(\n  arg,\n  arg,\n)` com indentação. */
function call(name: string, args: (string | false | undefined)[], ind: string): string {
  const a = args.filter(Boolean) as string[];
  if (!a.length) return `${name}()`;
  return `${name}(\n${a.map((x) => `${ind}  ${x},\n`).join("")}${ind})`;
}

function widget(n: WidgetNode, ind: string): string {
  const i2 = ind + "  ";
  const P = n.props;
  const list = () => `children: [\n${n.children.map((c) => `${i2}  ${widget(c, i2 + "  ")},\n`).join("")}${i2}]`;
  const child = (fallback = "") => (n.children[0] ? `child: ${widget(n.children[0], i2)}` : fallback);
  const pad = (w: string, v: unknown) => (pos(v) ? call("Padding", [`padding: const EdgeInsets.all(${num(v, 0)})`, `child: ${w.replace(/\n/g, "\n  ")}`], ind) : w);
  switch (n.type) {
    case "Column":
    case "Row":
      return pad(call(n.type, [
        `mainAxisAlignment: MainAxisAlignment.${pick(MAIN, P.mainAxis, "start")}`,
        `crossAxisAlignment: CrossAxisAlignment.${pick(CROSS, P.crossAxis, n.type === "Row" ? "center" : "start")}`,
        `spacing: ${num(P.spacing, 0)}`,
        list(),
      ], ind), P.padding);
    case "Stack":
      return call("Stack", [`alignment: Alignment.${pick(ALIGN, P.alignment, "topLeft")}`, list()], ind);
    case "ListView":
      return call("ListView", ["shrinkWrap: true", `padding: const EdgeInsets.all(${num(P.padding, 0)})`, list()], ind);
    case "Container":
      return call("Container", [
        pos(P.width) && `width: ${num(P.width, 0)}`,
        pos(P.height) && `height: ${num(P.height, 0)}`,
        `padding: const EdgeInsets.all(${num(P.padding, 0)})`,
        `decoration: BoxDecoration(color: const ${color(P.color)}, borderRadius: BorderRadius.circular(${num(P.radius, 0)}))`,
        child(),
      ], ind);
    case "Card":
      return call("Card", [
        `elevation: ${num(P.elevation, 1)}`,
        `color: const ${color(P.color)}`,
        `shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${num(P.radius, 12)}))`,
        `child: ${call("Padding", [`padding: const EdgeInsets.all(${num(P.padding, 0)})`, n.children[0] ? `child: ${widget(n.children[0], i2 + "  ")}` : ""], i2)}`,
      ], ind);
    case "Center":
      return call("Center", [child()], ind);
    case "Expanded":
      return call("Expanded", [`flex: ${num(P.flex, 1)}`, child("child: const SizedBox.shrink()")], ind);
    case "Text":
      return call("Text", [
        dartString(P.text),
        `textAlign: TextAlign.${pick({ start: "start", center: "center", end: "end" }, P.align, "start")}`,
        `style: const TextStyle(fontSize: ${num(P.fontSize, 16)}, fontWeight: FontWeight.${pick({ normal: "normal", w500: "w500", w600: "w600", bold: "bold" }, P.weight, "normal")}, color: ${color(P.color)})`,
      ], ind);
    case "Button":
      return call("ElevatedButton", [
        `style: ElevatedButton.styleFrom(backgroundColor: const ${color(P.color)}, foregroundColor: const ${color(P.textColor)}, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${num(P.radius, 8)})))`,
        "onPressed: () {}",
        `child: Text(${dartString(P.label)})`,
      ], ind);
    case "Image":
      return call("ClipRRect", [
        `borderRadius: BorderRadius.circular(${num(P.radius, 0)})`,
        `child: Image.network(${dartString(P.url)}, width: ${num(P.width, 100)}, height: ${num(P.height, 100)}, fit: BoxFit.${pick({ cover: "cover", contain: "contain", fill: "fill" }, P.fit, "cover")})`,
      ], ind);
    case "Spacer":
      return call("Spacer", [`flex: ${num(P.flex, 1)}`], ind);
    case "Divider":
      return call("Divider", [`thickness: ${num(P.thickness, 1)}`, `color: const ${color(P.color)}`], ind);
  }
}

function page(p: Page): string {
  const props = { ...PAGE_DEFAULTS, ...p.props };
  return `class ${className(p.name)}Page extends StatelessWidget {
  const ${className(p.name)}Page({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const ${color(props.background)},
      appBar: AppBar(
        title: Text(${dartString(props.title)}),
        backgroundColor: const ${color(props.appBarColor)},
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: ${widget(p.root, "        ")},
      ),
    );
  }
}
`;
}

/** Gera lib/main.dart de um app Flutter a partir do documento. */
export function generateMainDart(doc: AppDoc): string {
  const first = doc.pages[0];
  return `// Gerado pelo OpenFlow (esquema v${doc.version}).
import 'package:flutter/material.dart';

void main() => runApp(const ${className(doc.name)}App());

class ${className(doc.name)}App extends StatelessWidget {
  const ${className(doc.name)}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: ${dartString(doc.name)},
      home: const ${className(first.name)}Page(),
    );
  }
}

${doc.pages.map(page).join("\n")}`;
}
