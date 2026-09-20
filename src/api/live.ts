import type { DashboardProject, EpisodeTab, FileDoc, StudioProject, TreeNode } from "../types";
import { assembleProject, emptyFileDocs } from "./buildProject";
import { readProjectFile } from "./file";
import { api, establishSession } from "./http";
import { findEpisodeFile, findEpisodeMap, findProjectConfig, flattenTree, listEpisodeIds, preferProjectId } from "./paths";

type ProjectsResponse = { projects: DashboardProject[] };
type TreeResponse = { tree: TreeNode[]; warnings?: string[] };
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
      ? readProjectFile(projectId, configPath).then((file) => file.content)
      : Promise.resolve(JSON.stringify({ title: status.title || projectId, format: { aspect_ratio: "9:16", episode_count: 4 } })),
    mapPath ? readProjectFile(projectId, mapPath).then((file) => file.content) : Promise.resolve(""),
  ]);

  const files: Record<EpisodeTab, Record<string, string>> = {
    screenplay: {},
    visual: {},
    storyboard: {},
  };
  const fileDocs = emptyFileDocs();

  const episodeIds = listEpisodeIds(paths);
  await Promise.all(
    episodeIds.flatMap((episodeId) =>
      TABS.map(async (tab) => {
        const path = findEpisodeFile(paths, episodeId, tab);
        if (!path) return;
        const file = await readProjectFile(projectId, path);
        files[tab][episodeId] = file.content;
        const doc: FileDoc = {
          path,
          version: file.version || "",
          writable: file.writable !== false,
        };
        fileDocs[tab][episodeId] = doc;
      }),
    ),
  );

  const project = assembleProject({
    id: projectId,
    configJson,
    episodeMap,
    files,
    fileDocs,
    sourceNote: `已从创作台读取项目 ${projectId}。可改剧本 / 视觉设定 / 分镜并写回。`,
    liveConnected: true,
  });
  if (status.title) project.meta.title = status.title;
  return project;
}
