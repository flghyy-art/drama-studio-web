import type { EpisodeCard } from "../types";

export function EmptyEpisode({ episode, tabLabel }: { episode: EpisodeCard; tabLabel: string }) {
  return (
    <div className="empty-episode">
      <p className="eyebrow">{episode.id} · {tabLabel}</p>
      <h2>本集{tabLabel}尚未写入</h2>
      <p>分集地图已规划这一集，但仓库或创作台里还没有对应 Markdown。</p>
      <dl>
        <div>
          <dt>覆盖</dt>
          <dd>{episode.coverage || "—"}</dd>
        </div>
        <div>
          <dt>集尾悬崖</dt>
          <dd>{episode.cliff || "—"}</dd>
        </div>
        <div>
          <dt>时长目标</dt>
          <dd>{episode.duration}</dd>
        </div>
      </dl>
    </div>
  );
}
