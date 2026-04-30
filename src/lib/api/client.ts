// 클라이언트 fetch 래퍼 — JSON 파싱 + 에러 메시지 통일
// SWR과 호환: 단일 인자(url) 호출도 지원한다

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.error ?? data.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

// SWR fetcher alias
export const swrFetcher = apiGet;

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiDelete<T = { success: boolean }>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}

export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json();
}
