# Resultados de evaluacion de clasificacion

- Fecha: 2026-11-02T20:34:16.1162549-05:00
- Modelo: `gemini-3.5-flash-lite`
- Umbral de confianza: `0.60`
- Imagenes evaluadas: 50
- Accuracy: 82.00% (41/50)
- F1 macro: 81.53%
- Predicciones `PENDIENTE`: 0
- Errores tecnicos: 0

## Matriz de confusion

Filas = categoria esperada; columnas = prediccion.

| Esperado | HUECO_VIA | FUGA_AGUA | FALLA_ALUMBRADO | ACUMULACION_BASURA | NO_RELACIONADO | PENDIENTE | ERROR |
|---|---:|---:|---:|---:|---:|---:|---:|
| HUECO_VIA | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUGA_AGUA | 3 | 7 | 0 | 0 | 0 | 0 | 0 |
| FALLA_ALUMBRADO | 0 | 0 | 5 | 0 | 5 | 0 | 0 |
| ACUMULACION_BASURA | 0 | 0 | 0 | 9 | 1 | 0 | 0 |
| NO_RELACIONADO | 0 | 0 | 0 | 0 | 10 | 0 | 0 |

## Metricas por categoria

| Categoria | Precision | Recall | F1 | Soporte |
|---|---:|---:|---:|---:|
| HUECO_VIA | 76.92% | 100.00% | 86.96% | 10 |
| FUGA_AGUA | 100.00% | 70.00% | 82.35% | 10 |
| FALLA_ALUMBRADO | 100.00% | 50.00% | 66.67% | 10 |
| ACUMULACION_BASURA | 100.00% | 90.00% | 94.74% | 10 |
| NO_RELACIONADO | 62.50% | 100.00% | 76.92% | 10 |

## Latencia

- Promedio: 4938 ms
- Minima: 1628 ms
- Maxima: 25424 ms

## Errores y pendientes

| Archivo | Esperado | Prediccion | Confianza | Descripcion |
|---|---|---|---:|---|
| Burst_pipe_-_Hawley_Lane_-_geograph.org.uk_-_7361881.jpg | FUGA_AGUA | HUECO_VIA | 0.85 | Se observa una zona en la vía señalizada con conos y vallas de advertencia, indicando posibles trabajos en curso o una afectación en la malla vial. |
| Burst_water_pipe_-_geograph.org.uk_-_6866868.jpg | FUGA_AGUA | HUECO_VIA | 0.85 | Se observan múltiples baches y acumulación de agua en la vía pública. |
| Burst_water_pipe_in_Churchland_Lane_Sedlescombe_-_geograph.org.uk_-_7506999.jpg | FUGA_AGUA | HUECO_VIA | 0.85 | Se observa una vía en mal estado, sin pavimentar y con irregularidades, acompañada de una señal de advertencia de trabajos en la vía. |
| Apollostraat_broken_street_light_In_behandeling_bij_de_gemeente_Rotterdam_Hillegersberg_Rotterdam_2020_01.jpg | FALLA_ALUMBRADO | NO_RELACIONADO | 0.95 | La imagen muestra un poste con una etiqueta en holandés de la ciudad de Rotterdam, sin relación con incidencias urbanas en Florencia. |
| Apollostraat_broken_street_light_In_behandeling_bij_de_gemeente_Rotterdam_Hillegersberg_Rotterdam_2020_02.jpg | FALLA_ALUMBRADO | NO_RELACIONADO | 0.95 | La imagen muestra un poste o cilindro urbano con inscripciones en holandés, no relacionado con incidencias en Florencia, Caquetá. |
| Damaged_public_street_light_Feijenoord_Rotterdam_2021_01.jpg | FALLA_ALUMBRADO | NO_RELACIONADO | 0.95 | La imagen muestra un muelle junto a un cuerpo de agua y edificios al fondo, sin evidencia de ninguna incidencia urbana reportable. |
| Damaged_public_street_light_Feijenoord_Rotterdam_2021_03.jpg | FALLA_ALUMBRADO | NO_RELACIONADO | 0.95 | La imagen muestra un poste con un aviso escrito en holandés, sin relación con incidencias urbanas en Florencia. |
| Damaged_public_street_light_Feijenoord_Rotterdam_2021_04.jpg | FALLA_ALUMBRADO | NO_RELACIONADO | 0.95 | La imagen muestra un poste con un aviso en un entorno portuario, sin relación con incidencias urbanas en Florencia. |
| Puerto_Vallarta_trash_in_the_road.jpg | ACUMULACION_BASURA | NO_RELACIONADO | 0.95 | La imagen muestra una vista urbana general desde un balcón, sin evidenciar ninguna incidencia o problema reportable. |
