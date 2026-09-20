import type { EpisodeCard } from "../types";

const TABLE_ROW = /^\|\s*(EP\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/;

const FALLBACK_TITLES: Record<string, string> = {
  EP001: "公交·嘘",
  EP002: "掀裙与腿交起势",
  EP003: "腿缝与强吻",
  EP004: "插入与证物",
};

export function parseEpisodeMap(markdown: string, readyIds: Set<string>): EpisodeCard[] {
  const rows: EpisodeCard[] = [];
  for (const line of markdown.split("\n")) {
    const match = TABLE_ROW.exec(line);
    if (!match) continue;
    const id = match[1];
    const ready = readyIds.has(id);
    rows.push({
      id,
      title: FALLBACK_TITLES[id] || id,
      duration: match[2].trim(),
      coverage: match[3].trim(),
      cliff: match[4].trim(),
      status: ready ? "ready" : "planned",
      statusLabel: ready ? "剧本就绪" : "尚未成稿",
      available: ready,
    });
  }
  return rows;
}

export function applyScreenplayTitle(episodes: EpisodeCard[], episodeId: string, screenplay: string) {
  const match = /^#\s+EP\d+\s+(.+)$/m.exec(screenplay);
  const episode = episodes.find((item) => item.id === episodeId);
  if (episode && match) episode.title = match[1].trim();
}
