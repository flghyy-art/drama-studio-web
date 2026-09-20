export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 0, code = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isConflict(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 409 || error.code === "file changed since it was opened")
  );
}

const FAILURE_COPY: Record<string, string> = {
  "file changed since it was opened": "这份内容在别处已经更新，请重新打开后再修改。",
  "text file cannot be opened safely": "这份内容暂时无法打开，请刷新后重试。",
  "text file cannot be replaced safely": "这份内容暂时无法保存，请刷新后重试。",
  "file is locked or not writable": "这份文件被其他程序占用或不可写；关掉正在用它的程序，或检查文件权限。",
  "file is protected and read-only": "这份文件受保护，创作台不允许在这里改。",
  "file type is not editable text": "这种内容不能在工作台里直接修改。",
  "content exceeds file limit": "内容太长，无法保存。",
  "file exceeds preview limit": "内容太长，无法在这里展示。",
  "path is not a file": "找不到这份内容，可能已被移动。",
  "project not found": "找不到这个项目。",
  "project path changed during the save": "项目位置在保存过程中发生变化，请重新打开。",
  "request body is too large": "内容太长，无法提交。",
  "internal dashboard error": "创作台遇到问题，请刷新后重试。",
  "invalid dashboard response": "创作台返回了无法识别的数据。",
  "content and expectedVersion are required strings": "保存缺少正文或版本，请重新载入后再试。",
  "expectedVersion must be a SHA-256 digest": "文件版本无效，请重新载入后再保存。",
};

export function friendlyFailure(message: string): string {
  return FAILURE_COPY[message.trim()] || message;
}

const DASHBOARD_DOWN = "连不上本机创作台。请确认 dashboard 已启动，并把 .env 里的 DASHBOARD_ORIGIN 指到同一端口后重启 npm run dev。";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new ApiError(DASHBOARD_DOWN);
  }
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    if (response.status >= 500) throw new ApiError(DASHBOARD_DOWN);
    throw new ApiError(response.ok ? "创作台返回了无法识别的数据。" : `HTTP ${response.status}`);
  }
  if (!response.ok) {
    if (response.status >= 500) throw new ApiError(DASHBOARD_DOWN, response.status);
    const error =
      typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `HTTP ${response.status}`;
    throw new ApiError(friendlyFailure(error), response.status, error);
  }
  return data as T;
}

export async function establishSession(): Promise<void> {
  const hashValue = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  const token = hashValue.includes("/") ? "" : hashValue;
  if (!token || ["home", "demo", "live"].includes(token)) return;
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "X-Short-Drama-Token": token },
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new ApiError(friendlyFailure(data.error || `HTTP ${response.status}`), response.status, data.error);
  history.replaceState(null, "", `${location.pathname}${location.search}${location.hash.startsWith("#/") ? location.hash : ""}`);
}
