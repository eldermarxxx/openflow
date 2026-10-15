import type { WidgetType } from "../core/schema";

const s = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function WidgetIcon({ type }: { type: WidgetType }) {
  switch (type) {
    case "Text": return <svg {...s}><path d="M4 6h10M9 6v13M13 11h7M16.5 11v8" /></svg>;
    case "Column": return <svg {...s}><rect x="8" y="3" width="8" height="5" rx="1" /><rect x="8" y="10" width="8" height="5" rx="1" /><rect x="8" y="17" width="8" height="4" rx="1" /></svg>;
    case "Row": return <svg {...s}><rect x="2" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /><rect x="16" y="9" width="6" height="6" rx="1" /></svg>;
    case "Container": return <svg {...s}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
    case "Image": return <svg {...s}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5-9 8" /></svg>;
    case "Stack": return <svg {...s}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "Card": return <svg {...s}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h10" /></svg>;
    case "ListView": return <svg {...s}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "Center": return <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
    case "Expanded": return <svg {...s}><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" /></svg>;
    case "Spacer": return <svg {...s}><path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4M5 4h14M5 20h14" /></svg>;
    case "Divider": return <svg {...s}><path d="M3 12h18" /></svg>;
    case "Button": return <svg {...s}><rect x="3" y="7" width="18" height="10" rx="3" /><path d="M8 12h8" /></svg>;
  }
}
