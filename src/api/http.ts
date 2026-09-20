export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const FAILURE_COPY: Record<string, string> = {
  "project not found": "找不到这个项目。",
  "path is not a file": "找不到这份内容，可能已被移动。",
  "file exceeds preview limit": "内容太长，无法在这里展示。",
  "internal dashboard error": "创作台遇到问题，请刷新后重试。",
  "invalid dashboard response": "创作台返回了无法识别的数据。",
};

export function friendlyFailure(message: string): string {
  return FAILURE_COPY[message.trim()] || message;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(response.ok ? "创作台返回了无法识别的数据。" : `HTTP ${response.status}`);
  }
  if (!response.ok) {
    const error = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `HTTP ${response.status}`;
    throw new ApiError(friendlyFailure(error));
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
  if (!response.ok) throw new ApiError(friendlyFailure(data.error || `HTTP ${response.status}`));
  history.replaceState(null, "", `${location.pathname}${location.search}${location.hash.startsWith("#/") ? location.hash : ""}`);
}
