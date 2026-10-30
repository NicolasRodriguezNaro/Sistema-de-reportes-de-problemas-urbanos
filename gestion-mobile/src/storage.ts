import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const esWeb = Platform.OS === "web";

export async function guardarValor(clave: string, valor: string) {
  if (esWeb) {
    localStorage.setItem(clave, valor);
    return;
  }
  await SecureStore.setItemAsync(clave, valor);
}

export async function leerValor(clave: string): Promise<string | null> {
  if (esWeb) {
    return localStorage.getItem(clave);
  }
  return SecureStore.getItemAsync(clave);
}

export async function borrarValor(clave: string) {
  if (esWeb) {
    localStorage.removeItem(clave);
    return;
  }
  await SecureStore.deleteItemAsync(clave);
}
