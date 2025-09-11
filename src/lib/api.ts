export type ApiResponse<T = unknown> = { status: number; data?: T };
export type ApiError = { status: number; message: string };

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include", // HttpOnly JWT cookie z backendu
  });

  if (!res.ok) {
    const msg = await safeMessage(res);
    throw { status: res.status, message: msg } as ApiError;
  }
  return { status: res.status, data: await safeJson<T>(res) };
}

async function safeJson<T>(res: Response) { try { return (await res.json()) as T; } catch { return undefined; } }
async function safeMessage(res: Response) {
  try { const b = await res.json(); return b?.message || res.statusText || "Unknown error"; }
  catch { return res.statusText || "Unknown error"; }
}

export const api = {
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  isUnauthorized: (e: ApiError) => e?.status === 401,
  message: (e: ApiError) => e?.message ?? "",
};
