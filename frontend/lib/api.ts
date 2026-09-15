export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type User = { _id: string; full_name: string; username?: string | null; email: string; mobile?: string | null; role: "victim" | "trusted_person" | "official" | "admin"; consent_status: boolean; must_change_password?: boolean; enabled?: boolean };
export type Risk = { dynamic_score: number; risk_level: "low" | "moderate" | "high" | "critical"; reasons: string[]; created_at: string; clinical_note: string };

export function token() { return typeof window === "undefined" ? null : localStorage.getItem("mindmesh_token") ?? sessionStorage.getItem("mindmesh_token"); }
export function storeSession(accessToken: string, user: User, persist = true) {
  const storage = persist ? localStorage : sessionStorage;
  storage.setItem("mindmesh_token", accessToken);
  storage.setItem("mindmesh_user", JSON.stringify(user));
}
export function clearSession() { for (const storage of [localStorage, sessionStorage]) { storage.removeItem("mindmesh_token"); storage.removeItem("mindmesh_user"); } }
export function storedUser(): User | null {
  try { return JSON.parse(localStorage.getItem("mindmesh_user") ?? sessionStorage.getItem("mindmesh_user") ?? "null"); } catch { return null; }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers },
    });
  } catch {
    throw new Error("Unable to reach MindMesh. Start the backend service and confirm NEXT_PUBLIC_API_URL is correct.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(body.detail)
      ? body.detail.map((issue: { loc?: unknown[]; msg?: string }) => `${Array.isArray(issue.loc) ? issue.loc.filter((part) => part !== "body").join(" ") : "Field"}: ${issue.msg ?? "Invalid value"}`).join(". ")
      : typeof body.detail === "string" ? body.detail : "We could not complete that request. Please try again.";
    throw new Error(detail);
  }
  return body as T;
}

/** Fetch protected binary content without exposing a token in an audio URL. */
export async function apiBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...init.headers },
    });
  } catch {
    throw new Error("Unable to reach MindMesh. Start the backend service and confirm NEXT_PUBLIC_API_URL is correct.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "The recording could not be loaded.");
  }
  return response.blob();
}

export function displayLevel(level?: string) {
  return level ? level.charAt(0).toUpperCase() + level.slice(1) : "Getting started";
}
