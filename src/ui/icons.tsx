import type { WidgetType } from "../core/schema";

const s = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function WidgetIcon({ type }: { type: WidgetType }) {
  switch (type) {
    case "Text": return <svg {...s}><path d="M4 6h10M9 6v13M13 11h7M16.5 11v8" /></svg>;
    case "Column": return <svg {...s}><rect x="8" y="3" width="8" height="5" rx="1" /><rect x="8" y="10" width="8" height="5" rx="1" /><rect x="8" y="17" width="8" height="4" rx="1" /></svg>;
    case "Row": return <svg {...s}><rect x="2" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /><rect x="16" y="9" width="6" height="6" rx="1" /></svg>;
    case "Container": return <svg {...s}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
    case "Button": return <svg {...s}><rect x="3" y="7" width="18" height="10" rx="3" /><path d="M8 12h8" /></svg>;
  }
}
