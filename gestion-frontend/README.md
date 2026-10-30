# Reporte Urbano — Panel de operaciones

Frontend web del dashboard administrativo de la Plataforma Inteligente de Gestión de Incidencias Urbanas.

## Stack

- React 19
- Vite
- TypeScript
- React Router
- Leaflet / OpenStreetMap
- Cliente HTTP propio sobre `fetch`

## Requisitos

El backend debe estar disponible en `http://localhost:8080`.

## Configuración

Crea un archivo `.env` a partir de `.env.example`:

```env
VITE_API_URL=http://localhost:8080
```

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Compilación

```bash
npm run build
npm run preview
```

## Pantallas

- Login institucional.
- Dashboard con métricas, gráficas y mapa.
- Listado de reportes con filtros y paginación.
- Detalle de reporte con evidencia, mapa y acciones.
- Mapa territorial con capas.
- Catálogo de entidades para administradores.
- Perfil y cierre de sesión.

## Roles

- `ADMINISTRADOR`: acceso total, asignación de entidades.
- `FUNCIONARIO`: reportes de su entidad y cambio de estado.
- `EMPRESA`: consulta de reportes de su entidad.
- `CIUDADANO`: no usa este panel; debe usar la app móvil.

## Usuarios de prueba

Los usuarios de smoke test se crean desde el backend. Ejemplo:

```text
admin:       smoke.<timestamp>.admin@test.local / Password123
funcionario: smoke.<timestamp>.funcionario@test.local / Password123
empresa:     smoke.<timestamp>.empresa@test.local / Password123
```

## Notas

- No se reutilizó el HTML de Stitch; el panel fue reconstruido como aplicación React mantenible.
- Las URLs de miniaturas dependen del almacenamiento configurado en el backend.
- Con almacenamiento local, `/api/archivos/**` requiere token; con S3/Silo las URLs son firmadas.
