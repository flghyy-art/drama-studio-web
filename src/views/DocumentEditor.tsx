import { useEffect, useRef, useState } from "react";
import { readProjectFile, writeProjectFile } from "../api/file";
import { ApiError, friendlyFailure, isConflict } from "../api/http";
import { tabLabel } from "../api/paths";
import type { EpisodeTab, FileDoc } from "../types";
import { ScreenplayView } from "./ScreenplayView";
import { StoryboardView } from "./StoryboardView";
import { VisualView } from "./VisualView";

const LIVE_READONLY = "未连接创作台，无法保存。请确认本机 dashboard 已启动，或经隧道把 /api 转到创作台。";

export type SavedDocument = {
  tab: EpisodeTab;
  episodeId: string;
  content: string;
  version: string;
};

type Props = {
  projectId: string;
  episodeId: string;
  tab: EpisodeTab;
  markdown: string;
  fileDoc?: FileDoc;
  liveConnected: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: (update: SavedDocument) => void;
};

function ParsedPreview({ tab, markdown }: { tab: EpisodeTab; markdown: string }) {
  if (tab === "screenplay") return <ScreenplayView markdown={markdown} />;
  if (tab === "visual") return <VisualView markdown={markdown} />;
  return <StoryboardView markdown={markdown} />;
}

function leaveCopy(kind: "read" | "leave") {
  return kind === "read"
    ? "有未保存的修改。回到阅读会丢弃这些改动，继续？"
    : "有未保存的修改，继续将丢弃。";
}

export function DocumentEditor({
  projectId,
  episodeId,
  tab,
  markdown,
  fileDoc,
  liveConnected,
  onDirtyChange,
  onSaved,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(markdown);
  const [baseline, setBaseline] = useState(markdown);
  const [version, setVersion] = useState(fileDoc?.version || "");
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn" | "danger"; text: string } | null>(null);
  const [conflict, setConflict] = useState(false);
  const saveSequence = useRef(0);
  const loadSequence = useRef(0);

  const dirty = draft !== baseline;
  const canWrite = Boolean(liveConnected && fileDoc?.path && fileDoc.writable !== false && version);
  const readOnlyReason = !liveConnected
    ? LIVE_READONLY
    : !fileDoc?.path
      ? "还没有对应 Markdown 路径，无法写回。"
      : fileDoc.writable === false
        ? "这份文件受保护，创作台不允许在这里改。"
        : !version
          ? "尚未拿到文件版本，请重新载入后再保存。"
          : "";

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function applyLoaded(content: string, nextVersion: string) {
    setDraft(content);
    setBaseline(content);
    setVersion(nextVersion);
    setConflict(false);
    if (nextVersion) {
      onSaved({ tab, episodeId, content, version: nextVersion });
    }
  }

  async function reloadFromDashboard(prompt: boolean) {
    if (!fileDoc?.path || !liveConnected) return false;
    if (prompt && dirty && !window.confirm("重新载入会丢掉未保存的修改。继续？")) return false;
    const sequence = ++loadSequence.current;
    setReloading(true);
    setNotice(null);
    try {
      const file = await readProjectFile(projectId, fileDoc.path);
      if (sequence !== loadSequence.current) return false;
      applyLoaded(file.content, file.version || "");
      setNotice({ tone: "ok", text: "已重新载入创作台最新内容。" });
      return true;
    } catch (error) {
      if (sequence !== loadSequence.current) return false;
      const message = error instanceof Error ? friendlyFailure(error.message) : "无法重新载入。";
      setNotice({ tone: "danger", text: message });
      return false;
    } finally {
      if (sequence === loadSequence.current) setReloading(false);
    }
  }

  async function enterEdit() {
    setEditing(true);
    setNotice(null);
    if (liveConnected && fileDoc?.path && !dirty) {
      await reloadFromDashboard(false);
    }
  }

  function leaveEdit() {
    if (dirty && !window.confirm(leaveCopy("read"))) return;
    setDraft(baseline);
    setConflict(false);
    setEditing(false);
  }

  function cancelEdits() {
    setDraft(baseline);
    setConflict(false);
    setNotice(null);
  }

  async function save() {
    if (!canWrite || !fileDoc?.path || saving || !dirty) return;
    const snapshot = {
      sequence: ++saveSequence.current,
      path: fileDoc.path,
      content: draft,
      version,
    };
    setSaving(true);
    setNotice(null);
    setConflict(false);
    try {
      const result = await writeProjectFile(projectId, snapshot.path, snapshot.content, snapshot.version);
      if (snapshot.sequence !== saveSequence.current) return;
      setBaseline(snapshot.content);
      setVersion(result.version);
      onSaved({ tab, episodeId, content: snapshot.content, version: result.version });
      setNotice({
        tone: "ok",
        text: `已写回创作台 · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`,
      });
    } catch (error) {
      if (snapshot.sequence !== saveSequence.current) return;
      const message = error instanceof ApiError ? error.message : error instanceof Error ? friendlyFailure(error.message) : "保存失败。";
      setNotice({ tone: "danger", text: message });
      if (isConflict(error)) {
        setConflict(true);
        if (window.confirm(`${message}\n\n要重新载入最新内容吗？未保存的修改会丢失。`)) {
          await reloadFromDashboard(false);
        }
      }
    } finally {
      if (snapshot.sequence === saveSequence.current) setSaving(false);
    }
  }

  return (
    <div className="doc-editor">
      <div className="editor-toolbar">
        <div className="mode-switch" role="group" aria-label="阅读或编辑">
          <button type="button" className={editing ? "" : "is-on"} aria-pressed={!editing} onClick={leaveEdit}>
            阅读
          </button>
          <button type="button" className={editing ? "is-on" : ""} aria-pressed={editing} onClick={enterEdit}>
            编辑
          </button>
        </div>
        <p className="editor-status">
          {dirty ? <span className="dirty-dot">未保存</span> : null}
          {fileDoc?.path ? <span className="file-path">{fileDoc.path}</span> : <span>{tabLabel(tab)}</span>}
        </p>
        {editing ? (
          <div className="editor-actions">
            <button type="button" className="text-btn" onClick={cancelEdits} disabled={!dirty || saving}>
              取消
            </button>
            <button
              type="button"
              className="text-btn btn-primary"
              onClick={save}
              disabled={!canWrite || !dirty || saving}
              title={!canWrite ? readOnlyReason : undefined}
            >
              {saving ? "正在保存…" : "保存"}
            </button>
          </div>
        ) : null}
      </div>

      {!canWrite ? (
        <p className="editor-hint" role="note">
          {readOnlyReason}
        </p>
      ) : editing ? (
        <p className="editor-hint quiet" role="note">
          保存会以当前版本号写回本机创作台；若文件在别处改过，会提示你重新载入。
        </p>
      ) : null}

      {notice ? (
        <p className={`editor-notice tone-${notice.tone}`} role="status">
          {notice.text}
        </p>
      ) : null}

      {conflict ? (
        <div className="editor-conflict" role="alert">
          <p>创作台上的文件已经变了。重新载入后再改，以免覆盖别人的稿。</p>
          <button type="button" className="text-btn" onClick={() => reloadFromDashboard(true)} disabled={reloading}>
            {reloading ? "正在载入…" : "重新载入"}
          </button>
        </div>
      ) : null}

      {editing ? (
        <div className="editor-split">
          <label className="editor-pane">
            <span className="eyebrow">Markdown 正文</span>
            <textarea
              className="markdown-editor"
              value={draft}
              spellCheck={false}
              onChange={(event) => {
                setDraft(event.target.value);
                setNotice(null);
              }}
              aria-label={`${tabLabel(tab)} Markdown`}
            />
          </label>
          <div className="preview-stage editor-preview" role="region" aria-label="解析预览">
            <ParsedPreview tab={tab} markdown={draft} />
          </div>
        </div>
      ) : (
        <div className="preview-stage" role="tabpanel">
          <ParsedPreview tab={tab} markdown={markdown} />
        </div>
      )}
    </div>
  );
}

export function confirmLeaveDirty(dirty: boolean): boolean {
  if (!dirty) return true;
  return window.confirm(leaveCopy("leave"));
}
