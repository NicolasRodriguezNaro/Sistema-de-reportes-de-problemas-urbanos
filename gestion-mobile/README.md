# Reporte Urbano — App móvil ciudadana

Aplicación móvil de la Plataforma Inteligente de Gestión de Incidencias Urbanas.

## Stack

- Expo SDK 58
- Expo Router
- React Native
- TypeScript
- Expo Image Picker
- Expo Location
- Expo SecureStore
- Plus Jakarta Sans

## Requisitos

El backend debe estar disponible y accesible desde el dispositivo o emulador.

## Configuración

Crea un archivo `.env` a partir de `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

Valores según el entorno:

| Entorno | URL |
|---|---|
| Web de Expo | `http://localhost:8080` |
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Dispositivo físico | `http://<IP-LAN-de-tu-PC>:8080` |

En un dispositivo físico, el teléfono y el computador deben estar en la misma red.

## Ejecutar

```bash
npm install
npx expo start
```

Luego abre con Expo Go o presiona `w` para la versión web.

## Estructura de rutas

```text
src/app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (app)/
│   ├── index.tsx
│   ├── reportar.tsx
│   ├── mis-reportes.tsx
│   └── perfil.tsx
└── reporte/[id].tsx
```

## Funcionalidad

- Registro e inicio de sesión de ciudadanos.
- Inicio con acción principal para reportar.
- Flujo de reporte en tres pasos:
  1. foto desde cámara o galería;
  2. ubicación GPS;
  3. revisión y envío.
- Subida de imagen y creación del reporte en el backend.
- Consulta de “Mis reportes”.
- Detalle del reporte con estado, prioridad y metadatos reales.
- Perfil y cierre de sesión.

## Permisos

La app solicita:

- cámara;
- galería de imágenes;
- ubicación mientras se usa la app.

Si el usuario niega un permiso, se muestra una explicación y se ofrece abrir los ajustes del sistema.

## Roles

La app está diseñada para `CIUDADANO`. Los roles administrativos usan el panel web.

## Cuentas de prueba

El registro desde la app crea ciudadanos. Para pruebas se puede usar:

```text
smoke.<timestamp>.ciudadano@test.local / Password123
```

## Notas de diseño

- No se reutilizó el HTML de Stitch; la app fue reconstruida con componentes nativos.
- No se muestran notificaciones push, SMS, cuadrillas ni historial de estados porque el backend actual no los expone.
- La ubicación se muestra como coordenadas reales, sin mapas simulados.
