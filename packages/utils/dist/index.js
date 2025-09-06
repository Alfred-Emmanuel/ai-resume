export function createApiClient(options) {
    const { baseUrl, getToken } = options;
    async function request(path, init) {
        const url = `${baseUrl}${path}`;
        const token = typeof getToken === "function" ? await getToken() : getToken;
        const headers = {
            "Content-Type": "application/json",
            ...(init && init.headers ? init.headers : {}),
        };
        if (token)
            headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(url, { ...init, headers });
        if (!res.ok) {
            const body = await safeJson(res);
            const message = (body && (body.error || body.message)) || res.statusText;
            throw new Error(`${res.status} ${message}`);
        }
        return (await safeJson(res));
    }
    return {
        get: (path) => request(path, { method: "GET" }),
        post: (path, body) => request(path, {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        }),
    };
}
async function safeJson(res) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
export function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
