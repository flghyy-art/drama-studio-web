import { useEffect, useMemo, useState } from "react";
import { loadDemoProject } from "./api/demo";
import { friendlyFailure } from "./api/http";
import { loadLiveProject } from "./api/live";
import { StatusBadge } from "./components/StatusBadge";
import { applyScreenplayTitle } from "./lib/parseEpisodeMap";
import { readRoute, writeRoute } from "./lib/hashRoute";
import type { EpisodeTab, FileDoc, StudioMode, StudioProject } from "./types";
import { confirmLeaveDirty, type SavedDocument } from "./views/DocumentEditor";
import { EpisodeDesk } from "./views/EpisodeDesk";
import { ProjectHome } from "./views/ProjectHome";

const MODE_KEY = "drama-studio-mode";
const GRAY_KEY = "drama-studio-gray";

function initialMode(): StudioMode {
  const stored = localStorage.getItem(MODE_KEY);
  const fromHash = readRoute(stored === "live" ? "live" : "demo").mode;
  return fromHash;
}

export function App() {
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [gray, setGray] = useState(() => localStorage.getItem(GRAY_KEY) === "1");
  const [project, setProject] = useState<StudioProject | null>(null);
  const [episodeId, setEpisodeId] = useState<string | null>(() => readRoute("demo").episodeId);
  const [tab, setTab] = useState<EpisodeTab>(() => readRoute("demo").tab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deskDirty, setDeskDirty] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.gray = gray ? "on" : "off";
    localStorage.setItem(GRAY_KEY, gray ? "1" : "0");
  }, [gray]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    writeRoute({ mode, episodeId, tab });
  }, [mode, episodeId, tab]);

  useEffect(() => {
    const onHash = () => {
      const route = readRoute(mode);
      setMode(route.mode);
      setEpisodeId(route.episodeId);
      setTab(route.tab);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const task = mode === "demo" ? Promise.resolve(loadDemoProject()) : loadLiveProject();
    task
      .then((next) => {
        if (cancelled) return;
        setProject(next);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        const message = reason instanceof Error ? friendlyFailure(reason.message) : "无法载入项目。";
        setError(message);
        if (mode === "live") {
          setProject(loadDemoProject());
        } else {
          setProject(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const episode = useMemo(
    () => project?.episodes.find((item) => item.id === episodeId) ?? null,
    [project, episodeId],
  );

  useEffect(() => {
    if (!episode) setDeskDirty(false);
  }, [episode]);

  function requestMode(next: StudioMode) {
    if (next === mode) return;
    if (!confirmLeaveDirty(deskDirty)) return;
    setDeskDirty(false);
    setMode(next);
  }

  function applySavedDocument(update: SavedDocument) {
    setProject((current) => {
      if (!current) return current;
      const episodes = current.episodes.map((item) => ({ ...item }));
      if (update.tab === "screenplay") {
        applyScreenplayTitle(episodes, update.episodeId, update.content);
      }
      const previous: FileDoc | undefined = current.fileDocs[update.tab][update.episodeId];
      return {
        ...current,
        episodes,
        files: {
          ...current.files,
          [update.tab]: {
            ...current.files[update.tab],
            [update.episodeId]: update.content,
          },
        },
        fileDocs: {
          ...current.fileDocs,
          [update.tab]: {
            ...current.fileDocs[update.tab],
            [update.episodeId]: {
              path: previous?.path || "",
              writable: previous?.writable !== false,
              version: update.version,
            },
          },
        },
      };
    });
  }

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href={`#/${mode}`}
          onClick={(event) => {
            event.preventDefault();
            if (!confirmLeaveDirty(deskDirty)) return;
            setDeskDirty(false);
            setEpisodeId(null);
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            场
          </span>
          <span>
            <strong>短剧工作室</strong>
            <small>阅读与改稿</small>
          </span>
        </a>
        <div className="top-tools">
          <div className="mode-switch" role="group" aria-label="数据来源">
            <button
              type="button"
              className={mode === "demo" ? "is-on" : ""}
              aria-pressed={mode === "demo"}
              onClick={() => requestMode("demo")}
            >
              样例
            </button>
            <button
              type="button"
              className={mode === "live" ? "is-on" : ""}
              aria-pressed={mode === "live"}
              onClick={() => requestMode("live")}
            >
              实时
            </button>
          </div>
          <button
            type="button"
            className={gray ? "toggle is-on" : "toggle"}
            aria-pressed={gray}
            onClick={() => setGray((value) => !value)}
          >
            灰度母版
          </button>
        </div>
      </header>

      {error ? (
        <div className="banner" role="status">
          <StatusBadge label={mode === "live" ? "实时未接通" : "载入失败"} tone="warn" />
          <p>
            {error}
            {mode === "live" ? " 已回退到仓库样例，只读，无法写回。" : ""}
          </p>
        </div>
      ) : (
        <div className="banner quiet">
          <StatusBadge label={mode === "demo" ? "样例模式" : "实时模式"} tone={mode === "demo" ? "warn" : "ready"} />
          <p>{project?.sourceNote || "正在打开项目…"}</p>
        </div>
      )}

      <main>
        {loading || !project ? (
          <div className="loading-panel">正在打开项目…</div>
        ) : episode ? (
          <EpisodeDesk
            project={project}
            episode={episode}
            tab={tab}
            onTab={setTab}
            onHome={() => {
              setDeskDirty(false);
              setEpisodeId(null);
            }}
            onSaved={applySavedDocument}
            onDirtyChange={setDeskDirty}
          />
        ) : (
          <ProjectHome
            meta={project.meta}
            episodes={project.episodes}
            mode={mode}
            sourceNote={project.sourceNote}
            onOpenEpisode={(id) => {
              setEpisodeId(id);
              setTab("screenplay");
            }}
          />
        )}
      </main>
    </div>
  );
}
