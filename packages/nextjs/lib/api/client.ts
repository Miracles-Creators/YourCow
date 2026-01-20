const DEFAULT_BASE_URL = "http://localhost:3001/api";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${baseUrl}${cleanPath}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
