import type { StudioProject } from "../types";
import { assembleProject } from "./buildProject";
import configJson from "../fixtures/yaofei-bus/short-drama.json?raw";
import episodeMap from "../fixtures/yaofei-bus/episode-map.md?raw";
import ep001Screenplay from "../fixtures/yaofei-bus/EP001-screenplay.md?raw";
import ep001Visual from "../fixtures/yaofei-bus/EP001-visual.md?raw";
import ep001Storyboard from "../fixtures/yaofei-bus/EP001-storyboard.md?raw";

export const DEMO_PROJECT_ID = "yaofei-bus";

export function loadDemoProject(): StudioProject {
  return assembleProject({
    id: DEMO_PROJECT_ID,
    configJson,
    episodeMap,
    files: {
      screenplay: { EP001: ep001Screenplay },
      visual: { EP001: ep001Visual },
      storyboard: { EP001: ep001Storyboard },
    },
    sourceNote: "样例数据来自本仓库附带的 yaofei-bus 正文，只读，未连接本机创作台。",
    liveConnected: false,
  });
}
