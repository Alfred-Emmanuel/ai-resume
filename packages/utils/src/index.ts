export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | undefined> | string | undefined;
}

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, getToken } = options;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path}`;
    const token = typeof getToken === "function" ? await getToken() : getToken;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init && init.headers ? (init.headers as Record<string, string>) : {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      const body = await safeJson(res);
      const message = (body && (body.error || body.message)) || res.statusText;
      throw new Error(`${res.status} ${message}`);
    }
    return (await safeJson(res)) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      }),
  };
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
