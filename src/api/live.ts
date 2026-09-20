import type { DashboardProject, EpisodeTab, StudioProject, TreeNode } from "../types";
import { assembleProject } from "./buildProject";
import { api, establishSession } from "./http";
import { findEpisodeFile, findEpisodeMap, findProjectConfig, flattenTree, listEpisodeIds, preferProjectId } from "./paths";

type ProjectsResponse = { projects: DashboardProject[] };
type TreeResponse = { tree: TreeNode[]; warnings?: string[] };
type FileResponse = { content: string };
type StatusResponse = { title?: string };

const TABS: EpisodeTab[] = ["screenplay", "visual", "storyboard"];

export async function loadLiveProject(preferredId = "yaofei-bus"): Promise<StudioProject> {
  await establishSession();
  const listing = await api<ProjectsResponse>("/api/projects");
  if (!listing || !Array.isArray(listing.projects)) {
    throw new Error("创作台返回了无法识别的数据。");
  }
  if (!listing.projects.length) {
    throw new Error("创作台里还没有可打开的短剧项目。");
  }

  const projectId = preferProjectId(listing.projects, preferredId);
  if (!projectId) throw new Error("创作台里还没有可打开的短剧项目。");

  const [tree, status] = await Promise.all([
    api<TreeResponse>(`/api/tree?project=${encodeURIComponent(projectId)}`),
    api<StatusResponse>(`/api/status?project=${encodeURIComponent(projectId)}`).catch(() => ({ title: undefined })),
  ]);

  const paths = flattenTree(tree.tree);
  const configPath = findProjectConfig(paths);
  const mapPath = findEpisodeMap(paths);

  const [configJson, episodeMap] = await Promise.all([
    configPath
      ? api<FileResponse>(`/api/file?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(configPath)}`).then((file) => file.content)
      : Promise.resolve(JSON.stringify({ title: status.title || projectId, format: { aspect_ratio: "9:16", episode_count: 4 } })),
    mapPath
      ? api<FileResponse>(`/api/file?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(mapPath)}`).then((file) => file.content)
      : Promise.resolve(""),
  ]);

  const files: Record<EpisodeTab, Record<string, string>> = {
    screenplay: {},
    visual: {},
    storyboard: {},
  };

  const episodeIds = listEpisodeIds(paths);
  await Promise.all(
    episodeIds.flatMap((episodeId) =>
      TABS.map(async (tab) => {
        const path = findEpisodeFile(paths, episodeId, tab);
        if (!path) return;
        const file = await api<FileResponse>(`/api/file?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`);
        files[tab][episodeId] = file.content;
      }),
    ),
  );

  const project = assembleProject({
    id: projectId,
    configJson,
    episodeMap,
    files,
    sourceNote: `实时模式：已从本机创作台读取项目 ${projectId}。`,
  });
  if (status.title) project.meta.title = status.title;
  return project;
}
