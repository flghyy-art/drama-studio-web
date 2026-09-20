import { useEffect, useMemo, useState } from "react";
import { friendlyFailure } from "./api/http";
import { loadLiveProject } from "./api/live";
import { StatusBadge } from "./components/StatusBadge";
import { applyScreenplayTitle } from "./lib/parseEpisodeMap";
import { readRoute, writeRoute } from "./lib/hashRoute";
import type { EpisodeTab, FileDoc, StudioProject } from "./types";
import { confirmLeaveDirty, type SavedDocument } from "./views/DocumentEditor";
import { EpisodeDesk } from "./views/EpisodeDesk";
import { ProjectHome } from "./views/ProjectHome";

const GRAY_KEY = "drama-studio-gray";

export function App() {
  const [gray, setGray] = useState(() => localStorage.getItem(GRAY_KEY) === "1");
  const [project, setProject] = useState<StudioProject | null>(null);
  const [episodeId, setEpisodeId] = useState<string | null>(() => readRoute().episodeId);
  const [tab, setTab] = useState<EpisodeTab>(() => readRoute().tab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deskDirty, setDeskDirty] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.gray = gray ? "on" : "off";
    localStorage.setItem(GRAY_KEY, gray ? "1" : "0");
  }, [gray]);

  useEffect(() => {
    writeRoute({ episodeId, tab });
  }, [episodeId, tab]);

  useEffect(() => {
    const onHash = () => {
      const route = readRoute();
      setEpisodeId(route.episodeId);
      setTab(route.tab);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProject(null);
    loadLiveProject()
      .then((next) => {
        if (cancelled) return;
        setProject(next);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        const message = reason instanceof Error ? friendlyFailure(reason.message) : "无法载入项目。";
        setError(message);
        setProject(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const episode = useMemo(
    () => project?.episodes.find((item) => item.id === episodeId) ?? null,
    [project, episodeId],
  );

  useEffect(() => {
    if (!episode) setDeskDirty(false);
  }, [episode]);

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
          href="#/"
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
          <StatusBadge label="创作台未接通" tone="warn" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="banner quiet">
          <StatusBadge label="实时项目" tone="ready" />
          <p>{project?.sourceNote || "正在从创作台打开项目…"}</p>
        </div>
      )}

      <main>
        {loading ? (
          <div className="loading-panel">正在从创作台打开项目…</div>
        ) : error || !project ? (
          <section className="error-panel" role="alert">
            <p className="eyebrow">实时项目</p>
            <h1>创作台未接通</h1>
            <p>
              打不开短剧创作台，因此无法载入项目。这里不会回退到仓库样例，也不会假装这是正在编辑的稿。
            </p>
            <p>{error || "创作台不可达。"}</p>
            <ol>
              <li>本机启动创作台：<code>python3 dashboard_server.py --workspace &lt;工作区&gt; --port 8787</code></li>
              <li>
                开发时复制 <code>.env.example</code> 为 <code>.env</code>，把 <code>DASHBOARD_ORIGIN</code> 指到同一端口，再{" "}
                <code>npm run dev</code>
              </li>
              <li>经 Cloudflare 隧道远程改稿时，把隧道指到本机 Vite（<code>5173</code> / <code>4173</code>），由代理转发 <code>/api</code></li>
              <li>GitHub Pages 是静态页，浏览器不能直连你本机的创作台；要阅读和写回，请用本机或隧道。</li>
            </ol>
            <button type="button" className="text-btn btn-primary" onClick={() => setReloadToken((n) => n + 1)}>
              重新连接
            </button>
          </section>
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
