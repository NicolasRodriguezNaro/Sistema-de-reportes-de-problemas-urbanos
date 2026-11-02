# Evaluacion de clasificacion con Gemini

Este directorio contiene un set pequeno de imagenes publicas para medir la
clasificacion del backend con Gemini 3.5 Flash-Lite. No es una validacion
definitiva: es una linea base para detectar errores evidentes antes de usar
fotos de campo.

## Estructura

```text
ia-evaluation/
├── descargar-imagenes.mjs
├── manifest.csv
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

Si Wikimedia devuelve `429`, esperar unos segundos y volver a ejecutar.

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

## Metodologia

El evaluador reutiliza el mismo `ClasificadorGemini`, el mismo modelo y el mismo
prompt del backend. Compara la categoria esperada con la obtenida.

Para una primera prueba se usaron 15 imagenes: 3 por categoria y 3 no
relacionadas. Los resultados iniciales fueron:

```text
Accuracy inicial: 10/15 = 66,67%
Timeouts con limite de 20 s: 3
Imagenes con etiqueta ambigua al revisarlas: 3
```

Los timeouts no eran errores de clasificacion: el limite de 20 s era demasiado
corto para algunas llamadas. Se subio el timeout a 60 s y se reintentaron los
tres casos fallidos:

- `A_photo_of_a_water_leak_on_Camberwell_Place_2022-10-08_9.jpg` → `FUGA_AGUA`
- `mer.png` → `NO_RELACIONADO`
- `Damaged_street_light_25593659424_.jpg` → la imagen era realmente una escena
  de escombros/demolicion, no una falla de alumbrado; se descarto por etiqueta
  incorrecta.

Tambien se descartaron dos muestras por no ser claramente representativas:

- `Tiverton_Bampton_Street_Water_Leak...`: calle mojada, sin fuga evidente.
- `Broken_Street_Light_Stevenage...`: la luminaria aparece encendida.

## Resultado del set curado

Set final: 12 imagenes evaluadas correctamente.

| Categoria | Soporte | Aciertos |
|---|---:|---:|
| HUECO_VIA | 3 | 3 |
| FUGA_AGUA | 2 | 2 |
| FALLA_ALUMBRADO | 1 | 1 |
| ACUMULACION_BASURA | 3 | 3 |
| NO_RELACIONADO | 3 | 3 |
| **Total** | **12** | **12** |

```text
Accuracy del set curado: 12/12 = 100%
```

## Interpretacion

El resultado es bueno para una demostracion, pero **no debe interpretarse como
100% de precision en produccion**:

- el set es muy pequeno;
- las imagenes son publicas y no de Florencia;
- hay solo una muestra de alumbrado;
- las etiquetas fueron revisadas visualmente y se descartaron las ambiguas;
- no se probaron fotos nocturnas, lluvia fuerte, imagenes borrosas ni angulos
  extremos;
- Gemini puede variar entre ejecuciones y la confianza no esta calibrada.

La siguiente medicion debe hacerse con fotos de campo, al menos 10 por
categoria, y con un conjunto separado para ajustar el prompt.

## Privacidad y licencias

- No se deben enviar imagenes de ciudadanos sin autorizacion.
- La capa gratuita de Gemini puede usar el contenido para mejorar sus productos.
- Para produccion se debe usar la capa de pago o un modelo local.
- Las imagenes publicas conservan la atribucion y licencia indicadas en
  `manifest.csv`.
