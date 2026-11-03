# Clasificacion de incidencias con Gemini

La clasificacion real usa la API `generateContent` de Gemini con el modelo
`gemini-3.5-flash-lite`. El clasificador sigue implementando la interfaz
`ClasificadorIncidencias`; la asignacion de entidad y la prioridad siguen
calculandose con Jena.

## Configuracion

En `application.properties`:

```properties
gestion.ia.modo=simulado
gestion.ia.gemini.api-key=${GEMINI_API_KEY:}
gestion.ia.gemini.modelo=gemini-3.5-flash-lite
gestion.ia.gemini.timeout-segundos=60
gestion.ia.gemini.confianza-minima=0.60
```

La clave **no se escribe en los archivos**. Se pasa al proceso del backend:

```bash
export GEMINI_API_KEY="..."
SPRING_PROFILES_ACTIVE=dev,minio GESTION_IA_MODO=gemini ./mvnw spring-boot:run
```

En PowerShell:

```powershell
$env:GEMINI_API_KEY = "..."
$env:GESTION_IA_MODO = "gemini"
$env:SPRING_PROFILES_ACTIVE = "dev,minio"
.\mvnw.cmd spring-boot:run
```

`GESTION_IA_MODO` tiene prioridad sobre `gestion.ia.modo`.

## Modos

| Modo | Implementacion |
|---|---|
| `simulado` | `ClasificadorSimulado`; no consume API |
| `gemini` | `ClasificadorGemini`; usa la API real |

El modo simulado se mantiene para pruebas automatizadas y desarrollo sin
internet.

## Respuesta esperada

Gemini debe devolver un JSON con esta forma:

```json
{
  "esIncidencia": true,
  "categoria": "ACUMULACION_BASURA",
  "severidad": "MEDIA",
  "confianza": 0.91,
  "descripcion": "Acumulacion de residuos en la via publica"
}
```

El backend valida:

- categoria entre las cuatro existentes;
- severidad valida;
- confianza entre 0 y 1;
- `esIncidencia` para descartar imagenes no relacionadas;
- umbral minimo de confianza.

## Comportamiento ante fallos

- Si Gemini falla, no responde o devuelve un JSON invalido, el reporte queda
  `PENDIENTE`, sin categoria y sin entidad.
- Si la confianza es inferior al umbral, tambien queda pendiente.
- Si la imagen no es una incidencia, queda pendiente para revision manual.
- No se usa una clasificacion simulada como respaldo silencioso en produccion.
- No se envian imagenes ni claves a los logs.

## Imagen enviada

Antes de llamar a Gemini, la imagen se reduce a un lado maximo de 1024 px y se
convierte a JPEG cuando es necesario. La imagen HD original permanece en Silo.

## Privacidad

En la capa gratuita de Gemini, Google puede usar el contenido para mejorar sus
productos y revisores humanos podrian procesarlo. Para el prototipo se deben
usar imagenes de prueba o autorizadas; para datos reales de ciudadanos se debe
usar la capa de pago o un modelo local, y definir la politica de tratamiento de
datos.

## Pruebas

- `ClasificadorGeminiTest` prueba el parser y las validaciones.
- `ClasificadorGeminiHttpTest` simula la API con un servidor HTTP local y
  verifica que se envien la imagen y la clave en los headers, sin consumir la
  API real.
- `ia-evaluation/` contiene el set publico de evaluacion, el comando
  `EvaluacionGeminiManual` y los resultados reproducibles en `resultados.csv`
  y `metricas.md`. La ejecucion ampliada actual usa 50 imagenes y obtuvo
  41/50 = 82% de accuracy.
