import { api } from "./http";

export type FilePayload = {
  path?: string;
  content: string;
  version?: string;
  writable?: boolean;
};

export type SavePayload = {
  path: string;
  version: string;
  saved: boolean;
};

export function fileUrl(projectId: string, path: string): string {
  return `/api/file?project=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`;
}

export function readProjectFile(projectId: string, path: string): Promise<FilePayload> {
  return api<FilePayload>(fileUrl(projectId, path));
}

export function writeProjectFile(
  projectId: string,
  path: string,
  content: string,
  expectedVersion: string,
): Promise<SavePayload> {
  return api<SavePayload>(fileUrl(projectId, path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, expectedVersion }),
  });
}
