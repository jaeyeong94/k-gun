import { kisQueue } from "./queue";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  url: string,
  options?: RequestInit,
  useQueue = true,
): Promise<T> {
  const fn = async () => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body.code ?? `HTTP_${res.status}`,
        body.detail ?? body.message ?? `요청 실패 (${res.status})`,
      );
    }

    return res.json() as Promise<T>;
  };

  return useQueue ? kisQueue.enqueue(fn) : fn();
}

export function apiGet<T>(url: string, useQueue = true): Promise<T> {
  return request<T>(url, { method: "GET" }, useQueue);
}

export function apiPost<T>(
  url: string,
  body?: unknown,
  useQueue = true,
): Promise<T> {
  return request<T>(
    url,
    { method: "POST", body: body ? JSON.stringify(body) : undefined },
    useQueue,
  );
}

export function apiDelete<T>(url: string, useQueue = true): Promise<T> {
  return request<T>(url, { method: "DELETE" }, useQueue);
}
