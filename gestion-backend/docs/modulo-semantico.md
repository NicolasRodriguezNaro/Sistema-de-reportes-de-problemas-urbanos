# Módulo semántico — Documentación técnica

**Proyecto:** Plataforma Inteligente de Gestión de Incidencias Urbanas
**Backend:** Spring Boot 4.1.2 · Java 17 · PostgreSQL 17 + PostGIS 3.5.3
**Base semántica:** Apache Jena Fuseki 5.6.0 · TDB2 persistente
**Ontología:** `ontologia.ttl` v1.1.0
**Última actualización:** noviembre de 2026

---

## 1. Propósito

Cuando llega un reporte, la plataforma ya sabe **qué es** (módulo IA) y **dónde está** (PostGIS). Faltan las dos decisiones de negocio:

1. **¿Qué tan urgente es?** → si está cerca de una zona crítica, se eleva la prioridad.
2. **¿Quién debe atenderlo?** → según el tipo de incidencia, se asigna la entidad competente.

El módulo semántico responde esas preguntas con **conocimiento explícito y reglas de inferencia**, en lugar de condicionales dispersos en el código. La ontología, las competencias y las reglas viven versionadas en el repositorio, y las decisiones son consultables y explicables.

---

## 2. Arquitectura: responsabilidades

```text
                       ┌─────────────────────────────┐
                       │  PostgreSQL + PostGIS       │
                       │  fuente de verdad operativa │
                       │  reportes, estados,         │
                       │  geometrías, distancias     │
                       └─────────────┬───────────────┘
                                     │ HTTP/SPARQL
                       ┌─────────────▼───────────────┐
                       │  Backend Spring Boot        │
                       │  orquesta el flujo          │
                       └─────────────┬───────────────┘
                                     │ HTTP/SPARQL
                       ┌─────────────▼───────────────┐
                       │  Apache Jena Fuseki 5.6.0   │
                       │  TDB2 + GenericRuleReasoner │
                       │  ontología, referencia,     │
                       │  reportes e inferencias     │
                       └─────────────────────────────┘
```

| Componente | Responsabilidad | Dato que posee |
|---|---|---|
| **PostgreSQL** | Verdad operativa: reportes, estados, prioridad y entidad asignada | Filas de negocio |
| **PostGIS** | Cálculo espacial: deduplicación a 5 m, distancia a sitios, barrio contenedor | Geometrías (SRID 9377) |
| **Apache Jena Fuseki** | Conocimiento: ontología, individuos, competencias e inferencias | Tripletas RDF en TDB2 |
| **GenericRuleReasoner** | Política de priorización y asignación, ejecutada dentro de Fuseki | Reglas declarativas |
| **Backend Java** | Orquestación, cálculo espacial y resolución de candidatos | — |

Principio de diseño: **PostGIS calcula distancias; el grafo razona sobre relaciones**. El grafo no guarda coordenadas (no duplica geometrías) y la base de datos no guarda reglas (no duplica conocimiento). **Fuseki es interno**: no se publica a través de Caddy ni de Internet; solo el backend lo consume dentro de la red Docker `interna`.

---

## 3. Ontología (`src/main/resources/semantica/ontologia.ttl`, v1.1.0)

### 3.1 Jerarquía de conceptos

```text
IncidenciaUrbana
├── DeterioroVial
│   ├── HuecoVia            ← enum HUECO_VIA
│   └── FallaSemaforica     (categoría futura)
├── FallaServicioPublico
│   ├── FugaAgua            ← enum FUGA_AGUA
│   └── FallaAlumbrado      ← enum FALLA_ALUMBRADO
└── ResiduoUrbano
    ├── AcumulacionBasura   ← enum ACUMULACION_BASURA
    └── Escombros           (categoría futura)
AtencionCritica             ← clase inferida por regla

SitioInteres
└── ZonaCritica
    ├── CentroSalud ── Hospital
    ├── InstitucionEducativa ── Colegio, Universidad
    └── ViaPrincipal ── Avenida

EntidadResponsable
├── SecretariaObrasPublicas
├── EmpresaServiciosPublicos
└── EmpresaAseo
```

Las tres ramas raíz son disjuntas (`owl:disjointWith`): un nodo no puede ser a la vez incidencia, sitio y entidad.

### 3.2 Propiedades

| Tipo | Propiedad | Dominio → Rango |
|---|---|---|
| Objeto | `cercanoA` | IncidenciaUrbana → SitioInteres |
| Objeto | `esCompetentePara` | EntidadResponsable → IncidenciaUrbana |
| Objeto | `asignadoA` (inferida) | IncidenciaUrbana → EntidadResponsable |
| Datos | `reporteId`, `severidadIA`, `confianzaIA`, `prioridadCalculada`, `distanciaMetros` | IncidenciaUrbana |
| Datos | `sitioId` | SitioInteres |
| Datos | `entidadId` | EntidadResponsable (puente grafo → PostgreSQL) |

### 3.3 Política de competencias (declarada en el TTL, no en Java)

```turtle
ex:Entidad_1 ex:esCompetentePara ex:HuecoVia .
ex:Entidad_2 ex:esCompetentePara ex:FugaAgua, ex:FallaAlumbrado .
ex:Entidad_3 ex:esCompetentePara ex:AcumulacionBasura .
```

Si cambia una competencia, se edita este archivo y se versiona; no se recompila código.

---

## 4. Reglas de inferencia (`src/main/resources/semantica/reglas.rules`)

Son 10 reglas forward-chaining, cargadas por Fuseki en su `GenericRuleReasoner`:

| Regla | Qué infiere |
|---|---|
| `clausuraSubclase` | Cierra transitivamente la jerarquía (`HuecoVia ⊑ DeterioroVial ⊑ IncidenciaUrbana`) |
| `asignarEntidad` | Si la incidencia es de un tipo con entidad competente → `asignadoA` |
| `marcarAtencionCritica` | Si está `cercanoA` a un sitio cuyo tipo cuelga de `ZonaCritica` → la incidencia es `AtencionCritica` |
| `prioridadBaseBaja/Media/Alta/Critica` | Candidato de prioridad según `severidadIA` |
| `prioridadZonaAlta` | Zona crítica → candidato mínimo `ALTA` |
| `prioridadZonaCriticaSeveridadAlta/Critica` | Zona crítica + severidad ALTA/CRÍTICA → candidato `CRITICA` |

La configuración del razonador está en `deploy/fuseki/config.ttl`; las reglas se montan en el contenedor desde `reglas.rules`. **La inferencia no ocurre en el backend de producción**: Fuseki la aplica virtualmente sobre el grafo base cada vez que se consulta.

**Resolución de conflictos:** las reglas producen candidatos; `ServicioSemantico` elige el más fuerte (`CRITICA > ALTA > MEDIA > BAJA`). El motor declara conocimiento; la política de negocio resuelve.

---

## 5. Almacenamiento y separación

### 5.1 Fuseki en producción

- Servicio `fuseki` del `docker-compose.prod.yml`, imagen `secoresearch/fuseki:5.6.0`.
- Dataset `gestion`, con **TDB2 persistente** en el volumen `fuseki-data`.
- Configuración del dataset en `deploy/fuseki/config.ttl`:

```turtle
<#dataset> a ja:RDFDataset ;
    ja:defaultGraph <#inference> .

<#inference> a ja:InfModel ;
    ja:baseModel <#base> ;
    ja:reasoner [
        ja:reasonerURL <http://jena.hpl.hp.com/2003/GenericRuleReasoner> ;
        ja:rulesFrom <file:///fuseki/reglas.rules>
    ] .

<#base> a tdb2:GraphTDB2 ;
    tdb2:location "/fuseki-base/databases/gestion" .
```

- El backend usa HTTP/SPARQL contra `http://fuseki:3030/gestion` (`sparql`, `update`, `data`).
- **No se publica el puerto 3030** en el host ni se agrega a Caddy. Solo es accesible desde la red interna de Docker.
- El grafo es **derivado y reconstruible**: si se elimina el volumen, se vuelve a cargar la ontología y se re-sincronizan las referencias desde PostgreSQL.

### 5.2 Modos del backend

| Modo | Implementación | Uso |
|---|---|---|
| `fuseki` | `GrafoSemanticoFuseki` (HTTP/SPARQL) | Producción |
| `tdb2` (predeterminado en tests) | `GrafoSemantico` (TDB2 embebido) | Pruebas locales |

La propiedad `gestion.semantica.modo` selecciona el bean de Spring. `application-prod.properties` fija `fuseki`; los tests usan `tdb2` y no necesitan un servidor externo.

### 5.3 Datos en el grafo

- Ontología: se envía una vez por arranque mediante Graph Store Protocol y se conserva en el mismo grafo.
- Referencia: espejo de `entidades` y `sitios_interes`; se reconstruye en cada arranque. La sincronización **preserva las competencias** `esCompetentePara` de la ontología.
- Reportes: una IRI por reporte, `ex:Reporte_{id}`; se borran y reinsertan sus triples al crearlo o reanalizarlo.
- Las conclusiones de las reglas (`prioridadCalculada`, `asignadoA`, `AtencionCritica`) son **virtuales**: no se escriben en TDB2 salvo la prioridad y entidad finales que el backend persiste en PostgreSQL.

---

## 6. Sincronización del espejo estático

Al evento `ApplicationReadyEvent` (después de Flyway y con la BD lista):

1. Lee `entidades` y `sitios_interes` completos.
2. Genera IRIs canónicas desde el id: `ex:Entidad_{id}` y `ex:Sitio_{gid}`.
3. `rdfs:label` almacena el nombre legible (cambiable sin romper identidades).
4. Mapea el tipo a clase ontológica:
   - `HOSPITAL` → `Hospital`
   - `INSTITUCION_EDUCATIVA` → `Colegio`
   - `UNIVERSIDAD` → `Universidad`
   - `VIA_ARTERIA` → `ViaPrincipal`
   - demás tipos → `SitioInteres` genérico (no crítico)
5. Envía la referencia a Fuseki mediante Graph Store Protocol.

**Datos actuales:** 3 entidades (ids 1–3), **36 sitios reales** de Florencia (14 críticos: 2 hospitales, 10 instituciones educativas, 2 universidades), radios de influencia 300/150/200/100 m.

---

## 7. Flujo completo de un reporte

```text
POST /api/reportes
   │
   ├─ 1. IA completa campos vacíos (mock en dev / Gemini en prod): categoría, severidad, confianza, borrador
   ├─ 2. PostGIS transforma GPS 4326 → 9377
   ├─ 3. Deduplicación: ¿otro reporte de la MISMA categoría a ≤ 5 m? → padre / nuevo
   ├─ 4. Barrio: ST_Intersects(barrios.geom, punto) → barrio_id
   ├─ 5. INSERT en PostgreSQL (se necesita el id para el RDF)
   ├─ 6. Módulo semántico:
   │      a. PostGIS: sitio CRÍTICO más cercano dentro de su radio (LIMIT 1)
   │      b. Backend: escribe ex:Reporte_{id} + tipo + severidad + cercanoA + distancia en Fuseki
   │      c. Fuseki: GenericRuleReasoner aplica las 10 reglas y responde prioridad/asignación
   │      d. Java: resuelve candidatos de prioridad (el más fuerte gana)
   ├─ 7. UPDATE en PostgreSQL: prioridad_calculada y entidad_asignada_id
   └─ 8. Respuesta JSON (incluye prioridadCalculada, entidadAsignadaId, barrioId)
```

**Tolerancia a fallos:** si Fuseki no está disponible, la API no se cae: la prioridad cae al mapeo por severidad, la entidad queda nula y se registra un warning. La creación del reporte no depende del grafo.

---

## 8. Archivos del módulo

| Archivo | Rol |
|---|---|
| `src/main/resources/semantica/ontologia.ttl` | Ontología v1.1.0 (conocimiento estable + política de competencias) |
| `src/main/resources/semantica/reglas.rules` | Las 10 reglas de inferencia |
| `../deploy/fuseki/config.ttl` | Configuración de Fuseki: dataset, TDB2, `GenericRuleReasoner` |
| `semantica/GrafoSemanticoFuseki.java` | Gateway HTTP/SPARQL para producción |
| `semantica/GrafoSemantico.java` | Gateway TDB2 embebido para tests locales |
| `semantica/SemanticaGateway.java` | Contrato común de ambos gateways |
| `semantica/ServicioSemantico.java` | Orquesta PostGIS + grafo + resolución; sincroniza al arrancar |
| `semantica/AnalisisSemantico.java` | Resultado: prioridad + entidadId |
| `semantica/SitioCercano.java` | Sitio crítico más cercano (gid, nombre, tipo, distancia) |
| `semantica/InferenciasGrafo.java` | Candidatos de prioridad + entidad inferida |
| `servicio/ReporteService.java` | Integra IA, dedup, barrio, semántica y respuesta |
| `geoespacial/ServicioGeoespacial.java` | Transformaciones 4326↔9377, dedup, barrio (`ST_Intersects`) |
| `dto/ReporteResponse.java` | Expone `prioridadCalculada` |
| `db/README.md` | Procedimiento de importación de capas y re-sincronización |

---

## 9. Decisiones de diseño y problemas resueltos

1. **Base semántica separada:** Fuseki/TDB2 deja de ser una carpeta local del backend; el conocimiento queda en un servicio independiente, con su propio volumen, configuración y ciclo de vida.
2. **Inferencia en el servidor:** el `GenericRuleReasoner` se configura en Fuseki; el backend no carga reglas en producción ni materializa conclusiones. Así se demuestra la separación entre aplicación y razonador.
3. **PostGIS calcula, Fuseki razona:** se evita GeoSPARQL y se aprovechan los índices GiST de PostgreSQL.
4. **Un solo sitio crítico más cercano:** elimina la ambigüedad de `distanciaMetros`; la consulta usa `LIMIT 1` y el radio propio de cada sitio.
5. **Solo tipos críticos en la cercanía:** sin este filtro, un banco a 20 m eclipsaría un hospital a 150 m.
6. **Códigos string en lugar de enum:** la capa real trae 17 tipos; un enum de 3 era insostenible. Los críticos se mapean a clases ontológicas; el resto a `SitioInteres`.
7. **IRIs desde el id:** no se controlan nombres manualmente; el nombre es solo `rdfs:label`.
8. **Doble escritura no transaccional (PostgreSQL ↔ Fuseki):** asumida y mitigada: el grafo es derivado, el análisis es idempotente (se borran y reinsertan los triples del reporte) y es reconstruible.
9. **Actualizaciones sobre el `InfModel`:** se validaron con un spike antes de implementar; Fuseki propaga las escrituras al grafo base y el razonador vuelve a inferir al consultar.
10. **Aislamiento de tests:** el perfil de tests conserva TDB2 embebido y una carpeta temporal; producción usa Fuseki y no bloquea archivos locales.

---

## 10. Verificación y demostración

- **70 tests** en verde en el backend (suite completa).
- **SemanticaTest** ejecutado contra Fuseki real: 3/3 en verde, incluyendo escritura de reportes, inferencia de prioridad y asignación de entidad.
- Producción conserva 3 entidades, 180 barrios, 36 sitios de interés y 9 usuarios; los reportes de prueba fueron eliminados antes de la migración.

Prueba manual contra el Hospital María Inmaculada (lat `1.619537`, lon `-75.611134`):

```bash
curl -X POST https://reportes.mosqueteros.cloud/api/reportes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"descripcion\":\"Fuga frente al hospital\",\"categoriaIa\":\"FUGA_AGUA\",\"severidadIa\":\"ALTA\",\"latitud\":1.619537,\"longitud\":-75.611134,\"claveImagenHd\":\"https://s3.mosqueteros.cloud/reportes/f5.jpg\"}"
```

Se espera: `prioridadCalculada = "CRITICA"`, `entidadAsignadaId = 2` y `barrioId` asignado si el punto cae dentro de la capa de barrios.

Verificar el grafo sin exponer Fuseki:

```bash
ssh nicolas@169.58.255.147
cd /home/nicolas/gestion/deploy
docker compose -f docker-compose.prod.yml exec -T fuseki \
  wget -qO- 'http://localhost:3030/gestion/sparql?query=SELECT%20%28COUNT%28%2A%29%20AS%20%3Fn%29%20WHERE%20%7B%3Fs%20%3Fp%20%3Fo%7D'
```

---

## 11. Limitaciones y trabajo futuro

- **Re-análisis:** los reportes creados antes del módulo tienen prioridad/entidad nulas. Un `PATCH /api/reportes/{id}/reanalizar` lo resolvería (idempotente).
- **Reproducibilidad de datos:** la migración V2 siembra 2 sitios demo; al reconstruir una BD desde cero hay que eliminarlos después de importar la capa real (ver `db/README.md`).
- **Multi-sitio/ponderación:** si las reglas necesitan pesos por tipo, se requeriría modelado n-ario (reificación) o “más cercano por tipo”.
- **Competencias editables** desde el dashboard (tabla + sincronización) en lugar del TTL.
- **SHACL** para validación de calidad del grafo.
- **Respaldos de Fuseki:** el volumen `fuseki-data` debe incluirse en la rutina de backups.
- **Proveedor IA real:** hoy solo existe el clasificador simulado `@Profile("dev")`; en producción se usa Gemini.

---

## 12. Resumen para el informe

> El módulo semántico de la plataforma implementa una ontología OWL ligera (v1.1.0) sobre una base semántica separada en Apache Jena Fuseki 5.6.0 con TDB2 persistente. Fuseki modela incidencias urbanas, zonas críticas y entidades responsables, y ejecuta reglas de producción para priorización y asignación mediante `GenericRuleReasoner`. Al crear un reporte, PostGIS determina el sitio crítico más cercano dentro de su radio de influencia; el backend escribe la instancia RDF del reporte en Fuseki vía HTTP/SPARQL, consulta las inferencias y persiste la decisión en PostgreSQL (`prioridad_calculada`, `entidad_asignada_id`). El grafo queda desacoplado del backend y es reconstruible; PostgreSQL sigue siendo la fuente de verdad operativa, mientras Fuseki conserva el conocimiento y el razonamiento explicable.
