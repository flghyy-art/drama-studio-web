import type { EpisodeTab, StudioMode } from "../types";

export type Route = {
  mode: StudioMode;
  episodeId: string | null;
  tab: EpisodeTab;
};

const TABS: EpisodeTab[] = ["screenplay", "visual", "storyboard"];

function tabFromSegment(value: string | undefined): EpisodeTab {
  if (value === "视觉设定" || value === "visual") return "visual";
  if (value === "分镜" || value === "storyboard") return "storyboard";
  return "screenplay";
}

export function readRoute(fallbackMode: StudioMode): Route {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  let mode = fallbackMode;
  let rest = parts;
  if (parts[0] === "demo" || parts[0] === "live") {
    mode = parts[0];
    rest = parts.slice(1);
  }
  const episodeId = rest[0]?.match(/^EP\d+$/) ? rest[0] : null;
  const tab = tabFromSegment(rest[1]);
  return { mode, episodeId, tab: episodeId ? tab : "screenplay" };
}

export function writeRoute(route: Route) {
  const tabName = route.tab === "visual" ? "视觉设定" : route.tab === "storyboard" ? "分镜" : "剧本";
  const path = route.episodeId ? `#/${route.mode}/${route.episodeId}/${tabName}` : `#/${route.mode}`;
  if (location.hash !== path) history.replaceState(null, "", `${location.pathname}${location.search}${path}`);
}

export function isTab(value: string): value is EpisodeTab {
  return TABS.includes(value as EpisodeTab);
}
