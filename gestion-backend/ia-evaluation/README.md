# Evaluacion de clasificacion con Gemini

Este directorio contiene un set de imagenes publicas para medir la clasificacion
del backend con Gemini 3.5 Flash-Lite. No es una validacion definitiva: es una
linea base antes de usar fotos de campo.

## Estructura

```text
ia-evaluation/
├── descargar-imagenes.mjs
├── manifest.csv
├── resultados.csv            # salida por imagen de la ultima evaluacion
├── metricas.md               # resumen de la ultima evaluacion
├── imagenes/                 # ignorado por Git
│   ├── HUECO_VIA/
│   ├── FUGA_AGUA/
│   ├── FALLA_ALUMBRADO/
│   ├── ACUMULACION_BASURA/
│   ├── NO_RELACIONADO/
│   └── descartadas/          # muestras ambiguas, no evaluadas
└── README.md
```

Las imagenes se descargan de Wikimedia Commons. El manifiesto conserva la
fuente, el autor y la licencia de cada archivo. Las imagenes no se versionan
para no cargar binarios innecesarios al repositorio.

## Preparar las imagenes

```bash
cd gestion-backend
node ia-evaluation/descargar-imagenes.mjs
```

El descargador hace las consultas en lotes y reintenta cuando Wikimedia
devuelve `429`.

## Ejecutar la evaluacion real

La clave debe estar en `gestion-backend/.env` o en el entorno del proceso:

```bash
cd gestion-backend
set -a
source .env
set +a
./mvnw -Dtest=EvaluacionGeminiManual test
```

`EvaluacionGeminiManual` no termina en `Test`, por lo que no forma parte de la
suite normal. Se ejecuta solo de forma explicita y consume cuota real de la API.

Se puede filtrar por archivo para reintentar casos concretos:

```bash
./mvnw -Dtest=EvaluacionGeminiManual \
  -Devaluacion.filtro="archivo1.jpg,archivo2.jpg" test
```

La evaluacion genera:

- `resultados.csv`: categoria esperada, prediccion, confianza, latencia y
  descripcion para cada imagen.
- `metricas.md`: accuracy, F1 macro, matriz de confusion, metricas por
  categoria, latencia y errores.

## Set actual

El set actual tiene **50 imagenes**, 10 por categoria:

| Categoria | Soporte |
|---|---:|
| `HUECO_VIA` | 10 |
| `FUGA_AGUA` | 10 |
| `FALLA_ALUMBRADO` | 10 |
| `ACUMULACION_BASURA` | 10 |
| `NO_RELACIONADO` | 10 |
| **Total** | **50** |

La distribucion es balanceada. Las imagenes siguen siendo publicas y no
corresponden a Florencia.

## Resultado del set actual

Ejecucion con `gemini-3.5-flash-lite`, umbral de confianza `0.60` y timeout de
60 segundos:

```text
Imagenes evaluadas: 50
Accuracy: 41/50 = 82.00%
F1 macro: 81.53%
Latencia promedio: 4.94 s
Latencia maxima: 25.42 s
Predicciones PENDIENTE: 0
Errores tecnicos: 0
```

### Matriz de confusion

| Esperado | HUECO_VIA | FUGA_AGUA | FALLA_ALUMBRADO | ACUMULACION_BASURA | NO_RELACIONADO |
|---|---:|---:|---:|---:|---:|
| `HUECO_VIA` | 10 | 0 | 0 | 0 | 0 |
| `FUGA_AGUA` | 3 | 7 | 0 | 0 | 0 |
| `FALLA_ALUMBRADO` | 0 | 0 | 5 | 0 | 5 |
| `ACUMULACION_BASURA` | 0 | 0 | 0 | 9 | 1 |
| `NO_RELACIONADO` | 0 | 0 | 0 | 0 | 10 |

### Metricas por categoria

| Categoria | Precision | Recall | F1 | Soporte |
|---|---:|---:|---:|---:|
| `HUECO_VIA` | 76.92% | 100.00% | 86.96% | 10 |
| `FUGA_AGUA` | 100.00% | 70.00% | 82.35% | 10 |
| `FALLA_ALUMBRADO` | 100.00% | 50.00% | 66.67% | 10 |
| `ACUMULACION_BASURA` | 100.00% | 90.00% | 94.74% | 10 |
| `NO_RELACIONADO` | 62.50% | 100.00% | 76.92% | 10 |

## Analisis de errores

Se produjeron 9 errores. No se eliminaron despues de ver el resultado para no
inflar artificialmente la metrica; se conservan en el set y se documentan.

### FUGA_AGUA clasificada como HUECO_VIA

- `Burst_pipe_-_Hawley_Lane...`
- `Burst_water_pipe_-_geograph...6866868...`
- `Burst_water_pipe_in_Churchland_Lane...`

Las tres muestran pavimento mojado, zanjas o trabajos viales, pero no siempre
una fuga claramente visible. Son casos donde la etiqueta depende del contexto
de la fuente.

### FALLA_ALUMBRADO clasificada como NO_RELACIONADO

- `Apollostraat...01`
- `Apollostraat...02`
- `Damaged_public_street_light_Feijenoord...01`
- `Damaged_public_street_light_Feijenoord...03`
- `Damaged_public_street_light_Feijenoord...04`

Varias muestran postes con avisos o etiquetas de mantenimiento, o una vista
general del puerto, sin una luminaria rota claramente visible. El modelo tiende
a no considerar que exista una incidencia visual.

### ACUMULACION_BASURA clasificada como NO_RELACIONADO

- `Puerto_Vallarta_trash_in_the_road.jpg`

La imagen es una vista urbana general; la basura no es evidente desde el angulo
capturado.

## Interpretacion

El resultado es util como linea base, pero **no debe interpretarse como una
precision del 82% en produccion**:

- el set es pequeno y publico;
- algunas etiquetas dependen del contexto de la fuente;
- hay imagenes con dano indicado por avisos, no visible directamente;
- no se probaron fotos nocturnas, lluvia fuerte, imagenes borrosas ni angulos
  extremos;
- Gemini puede variar entre ejecuciones y la confianza no esta calibrada;
- no se activa rechazo automatico con IA.

La siguiente medicion debe hacerse con fotos de campo, idealmente 10-20 por
categoria, separando un conjunto para ajustar el prompt y otro para prueba. La
validacion con imagenes publicas sirve para detectar errores y preparar el
protocolo, no para sustituir la validacion local.

## Historial de evaluaciones

- **Linea base inicial:** 15 imagenes, 10/15 = 66.67%, con 3 timeouts de 20 s
  y etiquetas ambiguas.
- **Set curado inicial:** 12 imagenes, 12/12 = 100%; era una linea base muy
  pequena.
- **Set ampliado actual:** 50 imagenes, 41/50 = 82.00%; se conservaron los
  errores para analizarlos.

## Privacidad y licencias

- No se deben enviar imagenes de ciudadanos sin autorizacion.
- La capa gratuita de Gemini puede usar el contenido para mejorar sus productos.
- Para produccion se debe usar la capa de pago o un modelo local.
- Las imagenes publicas conservan la atribucion y licencia indicadas en
  `manifest.csv`.
