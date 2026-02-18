const SESSION_KEY = "preview_session_token";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    new URLSearchParams(window.location.search).get("session") ||
    sessionStorage.getItem(SESSION_KEY)
  );
}

export function setSessionToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, token);
  }
}

export async function previewFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getSessionToken();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";

  return fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "X-Preview-Session": token }),
      ...options.headers,
    },
  });
}

// Convenience helpers
export async function previewGet<T>(path: string): Promise<T> {
  const res = await previewFetch(path);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function previewPost<T>(path: string, body: unknown): Promise<T> {
  const res = await previewFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}
