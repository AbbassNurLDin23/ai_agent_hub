const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiErrorPayload = { error?: string; message?: string };

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg =
      (payload as ApiErrorPayload)?.message ||
      (payload as ApiErrorPayload)?.error ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg, payload ?? undefined);
  }

  return (payload ?? ({} as T)) as T;
}
