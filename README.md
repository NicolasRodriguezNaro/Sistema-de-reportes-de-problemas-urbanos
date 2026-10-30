# Plataforma Inteligente de Gestión de Incidencias Urbanas

Proyecto académico para reportar, clasificar y gestionar incidencias urbanas en Florencia, Caquetá.

## Proyectos

| Carpeta | Descripción | Stack |
|---|---|---|
| `gestion-backend` | API, seguridad, IA, semántica y almacenamiento | Spring Boot, PostgreSQL/PostGIS, Jena |
| `gestion-frontend` | Panel operativo para funcionarios, empresas y administradores | React, Vite, TypeScript, Leaflet |
| `gestion-mobile` | App ciudadana para crear y consultar reportes | Expo, React Native, Expo Router |

## Documentación

- Guía de API para frontend: `gestion-backend/docs/api-frontend.md`
- API del dashboard: `gestion-backend/docs/dashboard-api.md`
- Guía de diseño e implementación: `gestion-backend/docs/diseno-frontend.md`
- Seguridad: `gestion-backend/docs/seguridad.md`

## Ejecutar el backend

Requisitos: PostgreSQL/PostGIS, Docker Desktop y Java 17.

```bash
cd gestion-backend
docker compose up -d
SPRING_PROFILES_ACTIVE=dev,minio ./mvnw spring-boot:run
```

Backend: `http://localhost:8080`

Swagger: `http://localhost:8080/swagger-ui.html`

## Ejecutar el panel web

```bash
cd gestion-frontend
npm install
npm run dev
```

Panel: `http://localhost:5173`

Variables:

```env
VITE_API_URL=http://localhost:8080
```

## Ejecutar la app móvil

```bash
cd gestion-mobile
npm install
npx expo start
```

Variables:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

Para emulador Android usa `http://10.0.2.2:8080`; para un dispositivo físico usa la IP LAN del computador.

## Usuarios de prueba

Los usuarios de smoke test se crean desde el backend. Ejemplo:

```text
admin:       smoke.<timestamp>.admin@test.local / Password123
funcionario: smoke.<timestamp>.funcionario@test.local / Password123
empresa:     smoke.<timestamp>.empresa@test.local / Password123
ciudadano:   smoke.<timestamp>.ciudadano@test.local / Password123
```

El dashboard web es solo para personal municipal. La app móvil es para ciudadanos.

## Calidad

Backend:

```bash
cd gestion-backend
./mvnw clean test
```

Web:

```bash
cd gestion-frontend
npm run build
```

Móvil:

```bash
cd gestion-mobile
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
