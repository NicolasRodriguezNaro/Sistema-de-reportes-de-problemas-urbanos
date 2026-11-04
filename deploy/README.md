# Despliegue en VPS

Esta carpeta contiene la configuración de producción para el VPS de
`mosqueteros.cloud`.

## Arquitectura

```text
reportes.mosqueteros.cloud
  └── Caddy
       ├── frontend React
       └── /api → backend Spring Boot

s3.mosqueteros.cloud
  └── Caddy → Silo

backend → PostgreSQL/PostGIS
backend → Silo
backend → Gemini
backend → Fuseki (red interna, sin publicación)
```

Fuseki es la base semántica separada. Escucha en `3030` únicamente dentro
de la red Docker `interna`; no se agrega a Caddy y no se publica en el host.


## DNS

En el panel DNS de `mosqueteros.cloud`:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `reportes` | `169.58.255.147` |
| A | `s3` | `169.58.255.147` |

Comprobar:

```bash
nslookup reportes.mosqueteros.cloud
nslookup s3.mosqueteros.cloud
```

## Puertos

En el firewall del VPS y del proveedor:

```text
22/tcp
80/tcp
443/tcp
```

No se exponen PostgreSQL, la consola de Silo ni Fuseki. El puerto `3030`
de Fuseki queda solo en la red interna de Docker.

## Preparar el servidor

Requisitos: Ubuntu 24.04, Docker Engine y Docker Compose plugin.

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
docker --version
docker compose version
```

## Variables de entorno

```bash
cd deploy
cp .env.production.example .env
chmod 600 .env
```

Completar `.env` con contraseñas nuevas. Para generar secretos:

```bash
openssl rand -hex 32
```

No usar los valores de ejemplo en producción.

Variables relevantes para la base semántica:

| Variable | Uso |
|---|---|
| `FUSEKI_ADMIN_PASSWORD` | Contraseña del administrador de Fuseki; no se usa en la API |
| `GESTION_SEMANTICA_FUSEKI_URL` | Endpoint interno; por defecto `http://fuseki:3030/gestion` |

Fuseki no recibe tráfico público. La ontología se envía desde el backend por
Graph Store Protocol al arrancar; las reglas se montan desde
`gestion-backend/src/main/resources/semantica/reglas.rules` y la configuración
del dataset está en `deploy/fuseki/config.ttl`.

## Desplegar

Desde la raíz del repositorio:

```bash
cd deploy
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

La primera ejecución:

1. descarga las imágenes;
2. construye backend y frontend;
3. levanta PostgreSQL/PostGIS;
4. levanta Fuseki con TDB2 y el razonador;
5. crea el bucket de Silo;
6. ejecuta las migraciones Flyway;
7. sincroniza ontología, entidades y sitios hacia Fuseki;
8. levanta Caddy y solicita los certificados HTTPS.

## Importar las capas geográficas

La base de producción se crea limpia. Después de que PostgreSQL esté arriba,
hay que importar barrios y sitios de interés.

Desde el PC local, exportar solo los datos geográficos:

```bash
PGPASSWORD=root pg_dump -h localhost -U postgres -d gestion_db \
  --data-only --table=barrios --table=sitios_interes \
  --inserts --no-owner --no-privileges > geodata.sql
```

Copiar el archivo al VPS:

```bash
scp geodata.sql nicolas@169.58.255.147:/home/nicolas/
```

En el VPS:

```bash
cd /home/nicolas
docker compose -f /home/nicolas/gestion/deploy/docker-compose.prod.yml \
  exec -T postgres psql -U gestion -d gestion_db \
  -c "DELETE FROM sitios_interes WHERE nombre LIKE '%(demo)%';"
docker compose -f /home/nicolas/gestion/deploy/docker-compose.prod.yml \
  exec -T postgres psql -U gestion -d gestion_db < geodata.sql
```

Reiniciar el backend para que Fuseki reciba la ontología y la referencia real:

```bash
cd /home/nicolas/gestion/deploy
docker compose -f docker-compose.prod.yml restart backend
```

## Crear el administrador inicial

Registrar un ciudadano con la API pública:

```bash
curl -X POST https://reportes.mosqueteros.cloud/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Administrador","email":"admin@mosqueteros.cloud","password":"UNA_CLAVE_SEGURA"}'
```

Después promoverlo a administrador en PostgreSQL:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U gestion -d gestion_db \
  -c "UPDATE usuarios SET rol='ADMINISTRADOR' WHERE email='admin@mosqueteros.cloud';"
```

Iniciar sesión de nuevo para obtener un token con el rol actualizado.

## Verificación

```bash
curl -I https://reportes.mosqueteros.cloud
curl -I https://s3.mosqueteros.cloud/minio/health/live
```

También verificar:

- login en el dashboard;
- cambio de estado y asignación;
- subida de una imagen;
- visualización de imagen HD y miniatura;
- app móvil apuntando a `https://reportes.mosqueteros.cloud`.

Comprobar que Fuseki tiene los sitios sincronizados, sin exponerlo:

```bash
cd /home/nicolas/gestion/deploy
docker compose -f docker-compose.prod.yml exec -T fuseki \
  wget -qO- 'http://localhost:3030/gestion/sparql?query=SELECT%20%28COUNT%28DISTINCT%20%3Fs%29%20AS%20%3Fsitios%29%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%20FILTER%28STRSTARTS%28STR%28%3Fs%29%2C%20%22http%3A%2F%2Finfraestructura.org%2Fontologia%23Sitio_%22%29%29%7D'
```

El backend debe registrar en sus logs `Ontologia enviada a Fuseki` y no debe
haber errores de sincronización semántica.

## Actualizaciones

En este VPS el código se copió inicialmente mediante un archivo tar porque el
repositorio de GitHub es privado. Para actualizar hay dos opciones:

### Opción rápida: transferir un nuevo tar

Desde el PC local, crear un nuevo archivo y copiarlo al VPS. Después:

```bash
cd /home/nicolas/gestion/deploy
docker compose -f docker-compose.prod.yml up -d --build
```

### Opción recomendada: configurar una deploy key de GitHub

Crear una clave en el VPS:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_gestion -N ""
cat ~/.ssh/github_gestion.pub
```

Agregar la clave pública como **Deploy Key** de solo lectura en GitHub. Luego,
si el repositorio se clona con git en `/home/nicolas/gestion`, se puede usar:

```bash
cd /home/nicolas/gestion
git pull
cd deploy
docker compose -f docker-compose.prod.yml up -d --build
```

Antes de una migración de base de datos, hacer backup. No ejecutar
`docker compose down -v` porque elimina los volúmenes de PostgreSQL, Silo y
Fuseki.

## Backup

Ejemplo de backup de PostgreSQL:

```bash
mkdir -p /home/nicolas/backups
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U gestion -d gestion_db -Fc \
  > /home/nicolas/backups/gestion-$(date +%Y%m%d-%H%M).dump
```

También se debe respaldar el volumen de Silo y el volumen de Fuseki. Para un
backup consistente de TDB2, detener Fuseki antes de copiar el volumen y
volver a levantarlo después:

```bash
cd /home/nicolas/gestion/deploy
docker compose -f docker-compose.prod.yml stop fuseki
docker run --rm -v gestion-produccion_fuseki-data:/data:ro \
  -v /home/nicolas/backups:/backup alpine \
  tar -czf /backup/fuseki-$(date +%Y%m%d-%H%M).tgz -C /data .
docker compose -f docker-compose.prod.yml start fuseki
```

El grafo también es reconstruible: si se pierde el volumen, el backend vuelve
a cargar la ontología y a sincronizar entidades y sitios desde PostgreSQL.

## Limitaciones actuales

- No hay recuperación de contraseña por correo; queda para una fase posterior.
- No hay alta disponibilidad; el despliegue es de una sola instancia.
- El certificado HTTPS depende de que DNS y puertos 80/443 estén correctos.
- El repositorio de GitHub es privado y el VPS no tiene una deploy key configurada;
  las actualizaciones actuales se hacen por transferencia de archivos.
- El usuario `admin@mosqueteros.cloud` no tiene un buzón de correo real; si se
  habilita recuperación, habrá que cambiarlo o configurar correo del dominio.
- El login por contraseña SSH sigue disponible; se recomienda desactivarlo cuando
  se confirme que la clave SSH funciona correctamente.
