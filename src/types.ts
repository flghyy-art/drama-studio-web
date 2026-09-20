export type StudioMode = "demo" | "live";

export type EpisodeTab = "screenplay" | "visual" | "storyboard";

export type EpisodeStatus = "ready" | "planned";

export type EpisodeCard = {
  id: string;
  title: string;
  duration: string;
  coverage: string;
  cliff: string;
  status: EpisodeStatus;
  statusLabel: string;
  available: boolean;
};

export type ProjectMeta = {
  id: string;
  title: string;
  aspectRatio: string;
  episodeCount: number;
  targetSeconds: number;
  language: string;
  promptLanguage: string;
  statusLabel: string;
  statusTone: "neutral" | "ready" | "warn";
};

export type FileDoc = {
  path: string;
  version: string;
  writable: boolean;
};

export type StudioProject = {
  meta: ProjectMeta;
  episodes: EpisodeCard[];
  files: Record<EpisodeTab, Record<string, string>>;
  fileDocs: Record<EpisodeTab, Record<string, FileDoc>>;
  episodeMapMarkdown: string;
  sourceNote: string;
  liveConnected: boolean;
};

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string };

export type ScreenplayBlock =
  | { type: "action"; nodes: InlineNode[] }
  | { type: "dialogue"; speaker: string; parenthetical?: string; nodes: InlineNode[] }
  | { type: "tag"; kind: string; nodes: InlineNode[] }
  | { type: "cliff"; nodes: InlineNode[] };

export type ScreenplayScene = {
  id: string;
  heading: string;
  setting: string;
  interior: string;
  blocks: ScreenplayBlock[];
};

export type ScreenplayDoc = {
  title: string;
  summary: InlineNode[][];
  scenes: ScreenplayScene[];
};

export type VisualField = {
  label: string;
  nodes: InlineNode[];
};

export type VisualEntry = {
  kind: string;
  name: string;
  fields: VisualField[];
};

export type VisualDoc = {
  title: string;
  summary: InlineNode[][];
  groups: { kind: string; entries: VisualEntry[] }[];
};

export type StoryboardShot = {
  id: string;
  title: string;
  duration: string;
  fields: { label: string; nodes: InlineNode[] }[];
  freezePrompt: InlineNode[][];
};

export type StoryboardDoc = {
  title: string;
  summary: InlineNode[][];
  shots: StoryboardShot[];
};

export type DashboardProject = {
  id: string;
  title?: string;
};

export type TreeNode = {
  type?: string;
  path?: string;
  name?: string;
  children?: TreeNode[];
};
