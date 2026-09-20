import type { VisualDoc, VisualEntry, VisualField } from "../types";
import { collectQuote, parseInline, stripClosedComments } from "./inline";

const ENTRY_HEADING = /^##\s+(.+?)(?:\s*·\s*(.+))?$/;
const FIELD = /^[-*]\s+(?:([^：:]{1,20})：\s*)?(.+)$/;

export function parseVisual(markdown: string): VisualDoc {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "视觉设定";
  const summary: VisualDoc["summary"] = [];
  const entries: VisualEntry[] = [];
  let current: VisualEntry | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = stripClosedComments(lines[i]);
    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1) {
      title = h1[1].trim();
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote && !current) {
      const collected = collectQuote(lines, i);
      summary.push(parseInline(collected.text.replace(/\n/g, " ")));
      i = collected.next - 1;
      continue;
    }

    const heading = ENTRY_HEADING.exec(line);
    if (heading) {
      current = {
        kind: heading[1].trim(),
        name: (heading[2] || heading[1]).trim(),
        fields: [],
      };
      entries.push(current);
      continue;
    }

    const field = FIELD.exec(line);
    if (field && current) {
      const item: VisualField = {
        label: (field[1] || "说明").trim(),
        nodes: parseInline(field[2]),
      };
      current.fields.push(item);
    }
  }

  const groups: VisualDoc["groups"] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.kind === entry.kind) last.entries.push(entry);
    else groups.push({ kind: entry.kind, entries: [entry] });
  }

  return { title, summary, groups };
}
