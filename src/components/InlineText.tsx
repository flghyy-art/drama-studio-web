import type { InlineNode } from "../types";

export function InlineText({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === "strong") return <strong key={index}>{node.text}</strong>;
        if (node.type === "code") return <code key={index}>{node.text}</code>;
        return <span key={index}>{node.text}</span>;
      })}
    </>
  );
}
