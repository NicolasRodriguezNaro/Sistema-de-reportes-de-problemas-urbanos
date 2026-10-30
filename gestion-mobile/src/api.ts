import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

import type { ArchivoResponse, ErrorApi } from "./types";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

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
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, {
      error: "Sin conexión",
      mensaje:
        "No se pudo conectar con el backend. Revisa la URL de Expo y que el servidor esté encendido.",
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

export async function subirImagen(
  uri: string,
  nombre: string,
  tipo: string,
  archivoWeb?: File
): Promise<ArchivoResponse> {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const archivo =
      archivoWeb ??
      (await fetch(uri)
        .then((respuesta) => respuesta.blob())
        .catch(() => null));

    if (!archivo) {
      throw new ApiError(0, {
        error: "Archivo inválido",
        mensaje: "No se pudo leer la imagen seleccionada.",
      });
    }

    formData.append("archivo", archivo, nombre);
  } else {
    // Expo SDK 58 usa expo/fetch: no acepta el objeto { uri, name, type } de React Native.
    // File implementa Blob y permite que expo/fetch lo serialice correctamente.
    formData.append("archivo", new ExpoFile(uri), nombre);
  }

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/archivos`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    console.error("No se pudo subir la imagen", error);
    throw new ApiError(0, {
      error: "Sin conexión",
      mensaje: "No se pudo subir la imagen. Verifica la conexión con el backend.",
    });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      error: `Error HTTP ${response.status}`,
    }))) as ErrorApi;
    throw new ApiError(response.status, body);
  }

  return (await response.json()) as ArchivoResponse;
}
