import type { EpisodeTab, TreeNode } from "../types";

export const TAB_FILENAMES: Record<EpisodeTab, string[]> = {
  screenplay: ["剧本.md", "screenplay.md"],
  visual: ["视觉设定.md"],
  storyboard: ["分镜.md"],
};

export const EPISODE_MAP_NAMES = ["分集地图.md", "episode-map.md"];

export function flattenTree(nodes: TreeNode[] | undefined, out: string[] = []): string[] {
  for (const node of nodes || []) {
    if (node.type === "directory") flattenTree(node.children, out);
    else if (node.path) out.push(node.path);
  }
  return out;
}

export function fileName(path: string): string {
  return path.split("/").filter(Boolean).at(-1) || path;
}

export function findProjectConfig(paths: string[]): string | undefined {
  return paths.find((path) => fileName(path).toLowerCase() === "short-drama.json");
}

export function findEpisodeMap(paths: string[]): string | undefined {
  return paths.find((path) => EPISODE_MAP_NAMES.includes(fileName(path)));
}

export function findEpisodeFile(paths: string[], episodeId: string, tab: EpisodeTab): string | undefined {
  const names = TAB_FILENAMES[tab];
  return paths.find((path) => {
    const name = fileName(path);
    if (!names.includes(name)) return false;
    return path.includes(`/${episodeId}/`) || path.includes(`${episodeId}/`);
  });
}

export function listEpisodeIds(paths: string[]): string[] {
  const ids = new Set<string>();
  for (const path of paths) {
    const match = path.match(/(EP\d+)/);
    if (match) ids.add(match[1]);
  }
  return [...ids].sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
}

export function tabLabel(tab: EpisodeTab): string {
  if (tab === "screenplay") return "剧本";
  if (tab === "visual") return "视觉设定";
  return "分镜";
}

export function preferProjectId(projects: { id: string; title?: string }[], preferred = "yaofei-bus"): string | undefined {
  const exact = projects.find((project) => project.id === preferred || /yaofei|姚飞/.test(project.title || ""));
  return (exact || projects[0])?.id;
}
