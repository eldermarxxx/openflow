import type { AppDoc, Page, WidgetNode } from "./schema";

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

function widget(n: WidgetNode, ind: string): string {
  const i2 = ind + "  ";
  const kids = () => n.children.map((c) => `${i2}  ${widget(c, i2 + "  ")},\n`).join("");
  switch (n.type) {
    case "Column":
    case "Row":
      return `${n.type}(\n${i2}spacing: ${num(n.props.spacing, 8)},\n${i2}children: [\n${kids()}${i2}],\n${ind})`;
    case "Container": {
      const child = n.children[0] ? `\n${i2}child: ${widget(n.children[0], i2)},` : "";
      return `Container(\n${i2}padding: const EdgeInsets.all(${num(n.props.padding, 0)}),\n${i2}color: const ${color(n.props.color)},${child}\n${ind})`;
    }
    case "Text":
      return `Text(\n${i2}${dartString(n.props.text)},\n${i2}style: const TextStyle(fontSize: ${num(n.props.fontSize, 16)}),\n${ind})`;
    case "Button":
      return `ElevatedButton(\n${i2}onPressed: () {},\n${i2}child: Text(${dartString(n.props.label)}),\n${ind})`;
  }
}

function page(p: Page): string {
  return `class ${className(p.name)}Page extends StatelessWidget {
  const ${className(p.name)}Page({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(${dartString(p.name)})),
      body: ${widget(p.root, "      ")},
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
