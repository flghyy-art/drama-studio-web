import { useState } from "react";
import { tabLabel } from "../api/paths";
import type { EpisodeCard, EpisodeTab, StudioProject } from "../types";
import { confirmLeaveDirty, DocumentEditor, type SavedDocument } from "./DocumentEditor";
import { EmptyEpisode } from "./EmptyEpisode";

const TABS: EpisodeTab[] = ["screenplay", "visual", "storyboard"];

type Props = {
  project: StudioProject;
  episode: EpisodeCard;
  tab: EpisodeTab;
  onTab: (tab: EpisodeTab) => void;
  onHome: () => void;
  onSaved: (update: SavedDocument) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function EpisodeDesk({ project, episode, tab, onTab, onHome, onSaved, onDirtyChange }: Props) {
  const [dirty, setDirty] = useState(false);

  function reportDirty(next: boolean) {
    setDirty(next);
    onDirtyChange(next);
  }
  const markdown = project.files[tab][episode.id];
  const fileDoc = project.fileDocs[tab]?.[episode.id];

  function requestTab(next: EpisodeTab) {
    if (next === tab) return;
    if (!confirmLeaveDirty(dirty)) return;
    onTab(next);
  }

  function requestHome() {
    if (!confirmLeaveDirty(dirty)) return;
    onHome();
  }

  return (
    <section className="desk">
      <div className="desk-chrome">
        <div className="desk-bar">
          <button type="button" className="text-btn" onClick={requestHome}>
            ← 项目首页
          </button>
          <div className="desk-identity">
            <p className="eyebrow">{episode.id}</p>
            <h2>{episode.title}</h2>
          </div>
          <p className="desk-meta">
            {episode.duration} · {episode.statusLabel}
          </p>
        </div>
        <div className="tab-row" role="tablist" aria-label="本集文稿">
          {TABS.map((item) => {
            const has = Boolean(project.files[item][episode.id]);
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? "tab is-active" : "tab"}
                onClick={() => requestTab(item)}
              >
                {tabLabel(item)}
                <small>{has ? "已写入" : "缺稿"}</small>
              </button>
            );
          })}
        </div>
      </div>
      {!markdown ? (
        <div className="preview-stage" role="tabpanel">
          <EmptyEpisode episode={episode} tabLabel={tabLabel(tab)} />
        </div>
      ) : (
        <DocumentEditor
          key={`${episode.id}:${tab}`}
          projectId={project.meta.id}
          episodeId={episode.id}
          tab={tab}
          markdown={markdown}
          fileDoc={fileDoc}
          liveConnected={project.liveConnected}
          onDirtyChange={reportDirty}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}
