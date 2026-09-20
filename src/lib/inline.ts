import type { InlineNode } from "../types";

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const token of tokens) {
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      nodes.push({ type: "code", text: token.slice(1, -1) });
    } else if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      nodes.push({ type: "strong", text: token.slice(2, -2) });
    } else {
      nodes.push({ type: "text", text: token });
    }
  }
  return nodes.length ? nodes : [{ type: "text", text: "" }];
}

export function collectQuote(lines: string[], start: number): { text: string; next: number } {
  const parts: string[] = [];
  let index = start;
  while (index < lines.length) {
    const match = /^>\s?(.*)$/.exec(lines[index]);
    if (!match) break;
    parts.push(match[1]);
    index += 1;
  }
  return { text: parts.join("\n"), next: index };
}

export function stripClosedComments(line: string): string {
  let stripped = line;
  for (let previous = null as string | null; previous !== stripped; ) {
    previous = stripped;
    stripped = stripped.replace(/<!--[\s\S]*?-->/g, "");
  }
  return stripped;
}
