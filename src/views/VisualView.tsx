import { InlineText } from "../components/InlineText";
import { parseVisual } from "../lib/parseVisual";

export function VisualView({ markdown }: { markdown: string }) {
  const doc = parseVisual(markdown);
  return (
    <div className="doc-stack">
      <header className="doc-lead">
        <p className="eyebrow">视觉设定</p>
        <h2>{doc.title}</h2>
        {doc.summary.map((line, index) => (
          <p key={index} className="lead">
            <InlineText nodes={line} />
          </p>
        ))}
      </header>
      {doc.groups.map((group) => (
        <section key={group.kind} className="visual-group">
          <h3 className="group-title">{group.kind}</h3>
          <div className="card-grid">
            {group.entries.map((entry) => (
              <article key={`${entry.kind}-${entry.name}`} className="visual-card">
                <header>
                  <span>{entry.kind}</span>
                  <h4>{entry.name}</h4>
                </header>
                <dl>
                  {entry.fields.map((field, index) => (
                    <div key={index} className={field.label === "连续性锁" ? "lock-field" : undefined}>
                      <dt>{field.label}</dt>
                      <dd>
                        <InlineText nodes={field.nodes} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
