import { tabLabel } from "../api/paths";
import type { EpisodeCard, EpisodeTab, StudioProject } from "../types";
import { EmptyEpisode } from "./EmptyEpisode";
import { ScreenplayView } from "./ScreenplayView";
import { StoryboardView } from "./StoryboardView";
import { VisualView } from "./VisualView";

const TABS: EpisodeTab[] = ["screenplay", "visual", "storyboard"];

type Props = {
  project: StudioProject;
  episode: EpisodeCard;
  tab: EpisodeTab;
  onTab: (tab: EpisodeTab) => void;
  onHome: () => void;
};

export function EpisodeDesk({ project, episode, tab, onTab, onHome }: Props) {
  const markdown = project.files[tab][episode.id];
  return (
    <section className="desk">
      <div className="desk-chrome">
      <div className="desk-bar">
        <button type="button" className="text-btn" onClick={onHome}>
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
              onClick={() => onTab(item)}
            >
              {tabLabel(item)}
              <small>{has ? "已写入" : "缺稿"}</small>
            </button>
          );
        })}
      </div>
      </div>
      <div className="preview-stage" role="tabpanel">
        {!markdown ? (
          <EmptyEpisode episode={episode} tabLabel={tabLabel(tab)} />
        ) : tab === "screenplay" ? (
          <ScreenplayView markdown={markdown} />
        ) : tab === "visual" ? (
          <VisualView markdown={markdown} />
        ) : (
          <StoryboardView markdown={markdown} />
        )}
      </div>
    </section>
  );
}
