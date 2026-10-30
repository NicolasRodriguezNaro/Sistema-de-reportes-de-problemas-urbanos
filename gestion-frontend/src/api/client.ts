import type { ErrorApi } from "../types/api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
let token: string | null = null;

export class ApiError extends Error {
  status: number;
  body: ErrorApi;

  constructor(status: number, body: ErrorApi) {
    super(body.mensaje ?? body.error ?? `Error HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function setApiToken(nuevoToken: string | null) {
  token = nuevoToken;
}

export function getApiToken() {
  return token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, {
      error: "Sin conexión",
      mensaje: "No se pudo conectar con el backend. Verifica que esté en ejecución.",
    });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      error: `Error HTTP ${response.status}`,
    }))) as ErrorApi;
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function construirQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
