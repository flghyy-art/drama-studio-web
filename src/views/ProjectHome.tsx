import { StatusBadge } from "../components/StatusBadge";
import type { EpisodeCard, ProjectMeta } from "../types";

type Props = {
  meta: ProjectMeta;
  episodes: EpisodeCard[];
  sourceNote: string;
  onOpenEpisode: (id: string) => void;
};

export function ProjectHome({ meta, episodes, sourceNote, onOpenEpisode }: Props) {
  return (
    <section className="home">
      <div className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">短剧项目</p>
          <h1>{meta.title}</h1>
          <p className="hero-desc">
            竖屏成片，按集阅读剧本、视觉锁面和分镜。已接通创作台时可改已解析的 Markdown 并写回。生产仍在
            drama-skills 里完成，这里不假装生成画面。
          </p>
          <div className="hero-badges">
            <StatusBadge label={`画幅 ${meta.aspectRatio}`} tone="neutral" />
            <StatusBadge label={`${meta.episodeCount} 集`} tone="neutral" />
            <StatusBadge label={`单集约 ${meta.targetSeconds} 秒`} tone="neutral" />
            <StatusBadge label={meta.promptLanguage === "zh" ? "中文提示词" : meta.promptLanguage} tone="neutral" />
            <StatusBadge label={meta.statusLabel} tone={meta.statusTone} />
            <StatusBadge label="创作台已接通" tone="ready" />
          </div>
        </div>
        <aside className="aspect-frame" aria-label={`画幅 ${meta.aspectRatio}`}>
          <div className="phone">
            <span className="phone-ratio">{meta.aspectRatio}</span>
            <strong>{meta.title}</strong>
            <small>目标单集 {meta.targetSeconds}s · {meta.episodeCount} 集单元</small>
          </div>
        </aside>
      </div>

      <div className="map-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">分集地图</p>
            <h2>EP001–EP{String(meta.episodeCount).padStart(3, "0")}</h2>
          </div>
          <p className="section-note">{sourceNote}</p>
        </div>
        <ol className="episode-map">
          {episodes.map((episode) => (
            <li key={episode.id}>
              <button
                type="button"
                className={`episode-card ${episode.available ? "is-ready" : "is-planned"}`}
                onClick={() => onOpenEpisode(episode.id)}
              >
                <span className="ep-id">{episode.id}</span>
                <StatusBadge label={episode.statusLabel} tone={episode.available ? "ready" : "planned"} />
                <h3>{episode.title}</h3>
                <p className="ep-duration">{episode.duration}</p>
                <p className="ep-cover">{episode.coverage}</p>
                {episode.cliff ? (
                  <p className="ep-cliff">
                    <span>集尾</span>
                    {episode.cliff}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
