import { InlineText } from "../components/InlineText";
import { parseStoryboard } from "../lib/parseStoryboard";

const PRIMARY_FIELDS = new Set(["来源", "目的", "景别/机位", "起点", "唯一动作", "终点", "声音"]);

export function StoryboardView({ markdown }: { markdown: string }) {
  const doc = parseStoryboard(markdown);
  const total = doc.shots.reduce((sum, shot) => sum + (Number.parseInt(shot.duration, 10) || 0), 0);
  return (
    <div className="doc-stack">
      <header className="doc-lead">
        <p className="eyebrow">分镜</p>
        <h2>{doc.title}</h2>
        {doc.summary.map((line, index) => (
          <p key={index} className="lead">
            <InlineText nodes={line} />
          </p>
        ))}
        <p className="doc-count">
          {doc.shots.length} 镜 · 标注时长合计 {total}s
        </p>
      </header>
      <ol className="shot-list">
        {doc.shots.map((shot, index) => (
          <li key={shot.id} className="shot-card" id={shot.id}>
            <div className="shot-slate" aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{shot.duration || "—"}</b>
            </div>
            <div className="shot-main">
              <header className="shot-head">
                <span className="shot-id">{shot.id}</span>
                <h3>{shot.title}</h3>
              </header>
              <dl className="shot-fields">
                {shot.fields
                  .filter((field) => PRIMARY_FIELDS.has(field.label))
                  .map((field) => (
                    <div key={field.label}>
                      <dt>{field.label}</dt>
                      <dd>
                        <InlineText nodes={field.nodes} />
                      </dd>
                    </div>
                  ))}
              </dl>
              {shot.freezePrompt.length > 0 ? (
                <blockquote className="freeze-prompt">
                  <span>冻结关键帧 · 9:16</span>
                  {shot.freezePrompt.map((line, promptIndex) => (
                    <p key={promptIndex}>
                      <InlineText nodes={line} />
                    </p>
                  ))}
                </blockquote>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
