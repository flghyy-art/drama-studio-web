import { InlineText } from "../components/InlineText";
import { parseScreenplay } from "../lib/parseScreenplay";

export function ScreenplayView({ markdown }: { markdown: string }) {
  const doc = parseScreenplay(markdown);
  return (
    <div className="doc-stack">
      <header className="doc-lead">
        <p className="eyebrow">本集剧本</p>
        <h2>{doc.title}</h2>
        {doc.summary.map((line, index) => (
          <p key={index} className="lead">
            <InlineText nodes={line} />
          </p>
        ))}
        <p className="doc-count">{doc.scenes.length} 场</p>
      </header>
      {doc.scenes.map((scene) => (
        <article key={scene.id} className="scene-card" id={scene.id}>
          <header className="scene-head">
            <span className="scene-id">{scene.id}</span>
            <span className="scene-int">{scene.interior}</span>
            <h3>{scene.setting}</h3>
          </header>
          <div className="scene-body">
            {scene.blocks.map((block, index) => {
              if (block.type === "dialogue") {
                return (
                  <p key={index} className="dialogue">
                    <span className="speaker">
                      {block.speaker}
                      {block.parenthetical ? <em>（{block.parenthetical}）</em> : null}
                    </span>
                    <span className="line">
                      <InlineText nodes={block.nodes} />
                    </span>
                  </p>
                );
              }
              if (block.type === "tag") {
                return (
                  <p key={index} className="prod-tag">
                    <span>{block.kind}</span>
                    <InlineText nodes={block.nodes} />
                  </p>
                );
              }
              if (block.type === "cliff") {
                return (
                  <p key={index} className="cliff">
                    <InlineText nodes={block.nodes} />
                  </p>
                );
              }
              return (
                <p key={index} className="action">
                  <InlineText nodes={block.nodes} />
                </p>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
