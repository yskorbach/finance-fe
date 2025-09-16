export type ApiResponse<T = unknown> = { status: number; data?: T };
export type ApiError = { status: number; message: string };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const TOKEN_KEY = "access_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const msg = await safeMessage(res);
    // jeśli dostaliśmy 401 → usuń token z localStorage
    // if (res.status === 401) clearToken();
    throw { status: res.status, message: msg } as ApiError;
  }

  return { status: res.status, data: await safeJson<T>(res) };
}

async function safeJson<T>(res: Response) {
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

async function safeMessage(res: Response) {
  try {
    const b = await res.json();
    return b?.message || res.statusText || "Unknown error";
  } catch {
    return res.statusText || "Unknown error";
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  // auth helpers
  saveToken: setToken,
  clearToken,
  getToken,

  isUnauthorized: (e: ApiError) => e?.status === 401,
  message: (e: ApiError) => e?.message ?? "",
};
