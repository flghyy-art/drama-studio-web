import type { EpisodeTab, ProjectMeta, StudioProject } from "../types";
import { applyScreenplayTitle, parseEpisodeMap } from "../lib/parseEpisodeMap";

type ShortDramaJson = {
  title?: string;
  project_id?: string;
  language?: string;
  format?: {
    aspect_ratio?: string;
    episode_count?: number;
    prompt_language?: string;
    target_seconds_per_episode?: number;
  };
};

const TAB_ORDER: EpisodeTab[] = ["screenplay", "visual", "storyboard"];

export function parseShortDrama(raw: string, fallbackId: string): ProjectMeta {
  const data = JSON.parse(raw) as ShortDramaJson;
  const episodeCount = Number(data.format?.episode_count) || 4;
  return {
    id: fallbackId,
    title: data.title?.trim() || "未命名短剧",
    aspectRatio: data.format?.aspect_ratio || "9:16",
    episodeCount,
    targetSeconds: Number(data.format?.target_seconds_per_episode) || 100,
    language: data.language || "zh",
    promptLanguage: data.format?.prompt_language || "zh",
    statusLabel: "创作中",
    statusTone: "neutral",
  };
}

export function assembleProject(input: {
  id: string;
  configJson: string;
  episodeMap: string;
  files: Record<EpisodeTab, Record<string, string>>;
  sourceNote: string;
}): StudioProject {
  const meta = parseShortDrama(input.configJson, input.id);
  const readyIds = new Set(
    Object.keys(input.files.screenplay).filter((episodeId) => Boolean(input.files.screenplay[episodeId])),
  );
  const episodes = parseEpisodeMap(input.episodeMap, readyIds);

  if (!episodes.length) {
    for (let index = 1; index <= meta.episodeCount; index += 1) {
      const id = `EP${String(index).padStart(3, "0")}`;
      const ready = readyIds.has(id);
      episodes.push({
        id,
        title: id,
        duration: `约 ${meta.targetSeconds}s`,
        coverage: ready ? "本集正文已写入" : "分集尚未成稿",
        cliff: "",
        status: ready ? "ready" : "planned",
        statusLabel: ready ? "剧本就绪" : "尚未成稿",
        available: ready,
      });
    }
  }

  for (const episodeId of Object.keys(input.files.screenplay)) {
    applyScreenplayTitle(episodes, episodeId, input.files.screenplay[episodeId]);
  }

  if (readyIds.size) {
    meta.statusLabel = readyIds.size >= meta.episodeCount ? "各集正文齐" : `已成稿 ${readyIds.size}/${meta.episodeCount} 集`;
    meta.statusTone = readyIds.size >= meta.episodeCount ? "ready" : "neutral";
  }

  for (const tab of TAB_ORDER) {
    input.files[tab] = input.files[tab] || {};
  }

  return {
    meta,
    episodes,
    files: input.files,
    episodeMapMarkdown: input.episodeMap,
    sourceNote: input.sourceNote,
  };
}
