import type { ScreenplayBlock, ScreenplayDoc, ScreenplayScene } from "../types";
import { collectQuote, parseInline, stripClosedComments } from "./inline";

const SCENE_HEADING = /^##\s+(EP\d+-SC\d+)\s+(.+)$/;
const DIALOGUE = /^([^：:（(\s][^：:]{0,24})(?:（([^）]+)）|\(([^)]+)\))?：\s*(.+)$/;
const TAG = /^\[([^\]]+)\]\s*(.*)$/;
const CLIFF = /^——\s*(.*)$/;

function pushBlock(scene: ScreenplayScene | null, block: ScreenplayBlock) {
  if (scene) scene.blocks.push(block);
}

export function parseScreenplay(markdown: string): ScreenplayDoc {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "剧本";
  const summary: ScreenplayDoc["summary"] = [];
  const scenes: ScreenplayScene[] = [];
  let current: ScreenplayScene | null = null;
  let inComment = false;

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];
    if (inComment) {
      const closeAt = line.indexOf("-->");
      if (closeAt === -1) continue;
      inComment = false;
      line = line.slice(closeAt + 3);
      if (!line.trim()) continue;
    }

    const stripped = stripClosedComments(line);
    if (stripped.includes("<!--")) {
      inComment = true;
      const before = stripped.slice(0, stripped.indexOf("<!--")).trim();
      if (before) pushBlock(current, { type: "action", nodes: parseInline(before) });
      continue;
    }
    line = stripped;

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

    const scene = SCENE_HEADING.exec(line);
    if (scene) {
      const setting = scene[2].trim();
      const interior = setting.split("·")[0]?.trim() || "";
      current = {
        id: scene[1],
        heading: `${scene[1]} ${setting}`,
        setting,
        interior,
        blocks: [],
      };
      scenes.push(current);
      continue;
    }

    if (!line.trim()) continue;

    const cliff = CLIFF.exec(line);
    if (cliff) {
      pushBlock(current, { type: "cliff", nodes: parseInline(cliff[1]) });
      continue;
    }

    const tag = TAG.exec(line);
    if (tag) {
      pushBlock(current, { type: "tag", kind: tag[1], nodes: parseInline(tag[2] || "") });
      continue;
    }

    const dialogue = DIALOGUE.exec(line);
    if (dialogue) {
      pushBlock(current, {
        type: "dialogue",
        speaker: dialogue[1].trim(),
        parenthetical: (dialogue[2] || dialogue[3] || "").trim() || undefined,
        nodes: parseInline(dialogue[4]),
      });
      continue;
    }

    pushBlock(current, { type: "action", nodes: parseInline(line) });
  }

  return { title, summary, scenes };
}

export function episodeTitleFromScreenplay(markdown: string, fallback: string): string {
  const match = /^#\s+EP\d+\s+(.+)$/m.exec(markdown);
  return match?.[1]?.trim() || fallback;
}
