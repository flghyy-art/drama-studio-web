import type { EpisodeTab } from "../types";

export type Route = {
  episodeId: string | null;
  tab: EpisodeTab;
};

const TABS: EpisodeTab[] = ["screenplay", "visual", "storyboard"];
const LEGACY_MODE = new Set(["demo", "live"]);

function tabFromSegment(value: string | undefined): EpisodeTab {
  if (value === "视觉设定" || value === "visual") return "visual";
  if (value === "分镜" || value === "storyboard") return "storyboard";
  return "screenplay";
}

export function readRoute(): Route {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  const rest = parts[0] && LEGACY_MODE.has(parts[0]) ? parts.slice(1) : parts;
  const episodeId = rest[0]?.match(/^EP\d+$/) ? rest[0] : null;
  const tab = tabFromSegment(rest[1]);
  return { episodeId, tab: episodeId ? tab : "screenplay" };
}

export function writeRoute(route: Route) {
  const tabName = route.tab === "visual" ? "视觉设定" : route.tab === "storyboard" ? "分镜" : "剧本";
  const path = route.episodeId ? `#/${route.episodeId}/${tabName}` : "#/";
  if (location.hash !== path) history.replaceState(null, "", `${location.pathname}${location.search}${path}`);
}

export function isTab(value: string): value is EpisodeTab {
  return TABS.includes(value as EpisodeTab);
}
