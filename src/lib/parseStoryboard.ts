import type { StoryboardDoc, StoryboardShot } from "../types";
import { collectQuote, parseInline, stripClosedComments } from "./inline";

const SHOT_HEADING = /^##\s+(SHOT-[A-Z0-9-]+)\s*·\s*(.+)$/;
const FIELD = /^[-*]\s+([^：:]{1,24})：\s*(.*)$/;

export function parseStoryboard(markdown: string): StoryboardDoc {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "分镜";
  const summary: StoryboardDoc["summary"] = [];
  const shots: StoryboardShot[] = [];
  let current: StoryboardShot | null = null;
  let collectingPrompt = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = stripClosedComments(lines[i]);

    const h1 = /^#\s+(.+)$/.exec(line);
    if (h1) {
      title = h1[1].trim();
      continue;
    }

    if (/^###\s+冻结关键帧提示词/.test(line)) {
      collectingPrompt = true;
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      const collected = collectQuote(lines, i);
      const nodes = parseInline(collected.text.replace(/\n/g, " "));
      if (collectingPrompt && current) current.freezePrompt.push(nodes);
      else if (!current) summary.push(nodes);
      i = collected.next - 1;
      collectingPrompt = false;
      continue;
    }

    const shot = SHOT_HEADING.exec(line);
    if (shot) {
      collectingPrompt = false;
      current = {
        id: shot[1],
        title: shot[2].trim(),
        duration: "",
        fields: [],
        freezePrompt: [],
      };
      shots.push(current);
      continue;
    }

    const field = FIELD.exec(line);
    if (field && current) {
      if (field[1] === "时长") current.duration = field[2].trim();
      current.fields.push({ label: field[1], nodes: parseInline(field[2]) });
    }
  }

  return { title, summary, shots };
}
