package com.gestion.backend.semantica;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.apache.jena.datatypes.xsd.XSDDatatype;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.riot.Lang;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.vocabulary.RDFS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.backend.modelo.PrioridadCalculada;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoEntidad;
import com.gestion.backend.modelo.TipoIncidencia;
import com.gestion.backend.semantica.GrafoSemantico.EntidadRef;
import com.gestion.backend.semantica.GrafoSemantico.SitioRef;

import jakarta.annotation.PostConstruct;

/**
 * Cliente HTTP/SPARQL para la base semantica externa.
 *
 * <p>La ontologia, las entidades, los sitios y los reportes viven en Fuseki.
 * La inferencia se ejecuta en Fuseki mediante las reglas montadas en el
 * servidor; el backend solo escribe datos y consulta sus conclusiones.</p>
 */
@Component
@ConditionalOnProperty(name = "gestion.semantica.modo", havingValue = "fuseki")
public class GrafoSemanticoFuseki implements SemanticaGateway {

	private static final Logger log = LoggerFactory.getLogger(GrafoSemanticoFuseki.class);
	private static final String NS = "http://infraestructura.org/ontologia#";

	private final String baseUrl;
	private final HttpClient httpClient;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public GrafoSemanticoFuseki(
			@Value("${gestion.semantica.fuseki.url:http://localhost:3030/gestion}") String url) {
		this.baseUrl = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();
	}

	@PostConstruct
	public void cargarOntologia() {
		try (InputStream entrada = getClass().getResourceAsStream("/semantica/ontologia.ttl")) {
			if (entrada == null) {
				throw new IllegalStateException("No se encontro /semantica/ontologia.ttl");
			}
			Model ontologia = ModelFactory.createDefaultModel();
			RDFDataMgr.read(ontologia, entrada, Lang.TURTLE);
			publicarModelo(ontologia);
			log.info("Ontologia enviada a Fuseki");
		} catch (Exception e) {
			log.warn("No se pudo cargar la ontologia en Fuseki: {}", e.getMessage());
		}
	}

	@Override
	public void sincronizarEstaticos(java.util.List<EntidadRef> entidades,
			java.util.List<SitioRef> sitios) {
		try {
			actualizar("""
					DELETE { ?s ?p ?o }
					WHERE {
					  ?s ?p ?o .
					  FILTER (
					    STRSTARTS(STR(?s), "%sSitio_") ||
					    (
					      STRSTARTS(STR(?s), "%sEntidad_") &&
					      ?p != <%sesCompetentePara>
					    )
					  )
					}
					""".formatted(NS, NS, NS));

			Model referencia = ModelFactory.createDefaultModel();
			for (EntidadRef entidad : entidades) {
				Resource recurso = referencia.createResource(NS + "Entidad_" + entidad.id());
				recurso.addProperty(RDF.type, claseDeEntidad(entidad.tipo()));
				recurso.addProperty(RDF.type, clase("EntidadResponsable"));
				recurso.addProperty(RDFS.label, entidad.nombre());
				recurso.addProperty(propiedad("entidadId"),
						referencia.createTypedLiteral(String.valueOf(entidad.id()), XSDDatatype.XSDinteger));
			}
			for (SitioRef sitio : sitios) {
				Resource recurso = referencia.createResource(NS + "Sitio_" + sitio.gid());
				recurso.addProperty(RDF.type, claseDeSitio(sitio.tipoSitio()));
				recurso.addProperty(RDF.type, clase("SitioInteres"));
				recurso.addProperty(RDFS.label, sitio.nombre());
				recurso.addProperty(propiedad("sitioId"),
						referencia.createTypedLiteral(String.valueOf(sitio.gid()), XSDDatatype.XSDinteger));
			}
			publicarModelo(referencia);
		} catch (Exception e) {
			throw new IllegalStateException("No se pudo sincronizar la referencia semantica con Fuseki", e);
		}
	}

	@Override
	public void escribirReporte(Long reporteId, TipoIncidencia categoria, Severidad severidad,
			Double confianza, SitioCercano sitio) {
		try {
			String reporteIri = NS + "Reporte_" + reporteId;
			actualizar("DELETE WHERE { <" + reporteIri + "> ?p ?o . }");

			Model reporte = ModelFactory.createDefaultModel();
			Resource recurso = reporte.createResource(reporteIri);
			recurso.addProperty(RDF.type, claseDeIncidencia(categoria));
			recurso.addProperty(propiedad("reporteId"),
					reporte.createTypedLiteral(String.valueOf(reporteId), XSDDatatype.XSDinteger));
			if (severidad != null) {
				recurso.addProperty(propiedad("severidadIA"), severidad.name());
			}
			if (confianza != null) {
				recurso.addProperty(propiedad("confianzaIA"), reporte.createTypedLiteral(confianza));
			}
			if (sitio != null) {
				Resource sitioRecurso = reporte.createResource(NS + "Sitio_" + sitio.gid());
				sitioRecurso.addProperty(RDF.type, claseDeSitio(sitio.tipoSitio()));
				sitioRecurso.addProperty(RDF.type, clase("SitioInteres"));
				sitioRecurso.addProperty(RDFS.label, sitio.nombre());
				sitioRecurso.addProperty(propiedad("sitioId"),
						reporte.createTypedLiteral(String.valueOf(sitio.gid()), XSDDatatype.XSDinteger));
				recurso.addProperty(propiedad("cercanoA"), sitioRecurso);
				recurso.addProperty(propiedad("distanciaMetros"),
						reporte.createTypedLiteral(sitio.distanciaMetros()));
			}
			publicarModelo(reporte);
		} catch (Exception e) {
			throw new IllegalStateException("No se pudo escribir el reporte en Fuseki", e);
		}
	}

	@Override
	public InferenciasGrafo inferir(Long reporteId) {
		try {
			String reporteIri = NS + "Reporte_" + reporteId;
			String consulta = """
					SELECT ?prioridad ?entidadId
					WHERE {
					  OPTIONAL { <%s> <%sprioridadCalculada> ?prioridad }
					  OPTIONAL {
					    <%s> <%sasignadoA> ?entidad .
					    ?entidad <%sentidadId> ?entidadId .
					  }
					}
					""".formatted(reporteIri, NS, reporteIri, NS, NS);
			JsonNode raiz = consultar(consulta);
			Set<String> prioridades = new HashSet<>();
			Integer entidadId = null;
			for (JsonNode fila : raiz.path("results").path("bindings")) {
				if (fila.has("prioridad")) {
					prioridades.add(fila.path("prioridad").path("value").asText());
				}
				if (fila.has("entidadId")) {
					entidadId = fila.path("entidadId").path("value").asInt();
				}
			}
			return new InferenciasGrafo(prioridades, Optional.ofNullable(entidadId));
		} catch (Exception e) {
			throw new IllegalStateException("No se pudo consultar la inferencia en Fuseki", e);
		}
	}

	@Override
	public void materializar(Long reporteId, PrioridadCalculada prioridad, Integer entidadId) {
		// Fuseki aplica las reglas de forma virtual; no se materializan en el grafo base.
	}

	private void actualizar(String sparqlUpdate) throws IOException, InterruptedException {
		HttpRequest solicitud = HttpRequest.newBuilder(URI.create(baseUrl + "/update"))
				.timeout(Duration.ofSeconds(30))
				.header("Content-Type", "application/sparql-update")
				.POST(HttpRequest.BodyPublishers.ofString(sparqlUpdate, StandardCharsets.UTF_8))
				.build();
		verificarRespuesta(httpClient.send(solicitud, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)));
	}

	private JsonNode consultar(String sparqlQuery) throws IOException, InterruptedException {
		HttpRequest solicitud = HttpRequest.newBuilder(URI.create(baseUrl + "/sparql"))
				.timeout(Duration.ofSeconds(30))
				.header("Accept", "application/sparql-results+json")
				.header("Content-Type", "application/sparql-query")
				.POST(HttpRequest.BodyPublishers.ofString(sparqlQuery, StandardCharsets.UTF_8))
				.build();
		HttpResponse<String> respuesta = httpClient.send(solicitud,
				HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
		verificarRespuesta(respuesta);
		return objectMapper.readTree(respuesta.body());
	}

	private void publicarModelo(Model modelo) throws IOException, InterruptedException {
		ByteArrayOutputStream salida = new ByteArrayOutputStream();
		RDFDataMgr.write(salida, modelo, Lang.NTRIPLES);
		HttpRequest solicitud = HttpRequest.newBuilder(URI.create(baseUrl + "/data?default"))
				.timeout(Duration.ofSeconds(30))
				.header("Content-Type", "application/n-triples")
				.POST(HttpRequest.BodyPublishers.ofByteArray(salida.toByteArray()))
				.build();
		verificarRespuesta(httpClient.send(solicitud, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)));
	}

	private void verificarRespuesta(HttpResponse<String> respuesta) {
		if (respuesta.statusCode() < 200 || respuesta.statusCode() >= 300) {
			throw new IllegalStateException("Fuseki respondio HTTP " + respuesta.statusCode());
		}
	}

	private Resource claseDeIncidencia(TipoIncidencia tipo) {
		return switch (tipo) {
			case HUECO_VIA -> clase("HuecoVia");
			case FUGA_AGUA -> clase("FugaAgua");
			case FALLA_ALUMBRADO -> clase("FallaAlumbrado");
			case ACUMULACION_BASURA -> clase("AcumulacionBasura");
		};
	}

	private Resource claseDeSitio(String tipoSitio) {
		return switch (tipoSitio) {
			case "HOSPITAL" -> clase("Hospital");
			case "INSTITUCION_EDUCATIVA", "COLEGIO" -> clase("Colegio");
			case "UNIVERSIDAD" -> clase("Universidad");
			case "VIA_ARTERIA", "VIA_PRINCIPAL" -> clase("ViaPrincipal");
			default -> clase("SitioInteres");
		};
	}

	private Resource claseDeEntidad(TipoEntidad tipo) {
		return switch (tipo) {
			case SECRETARIA_OBRAS_PUBLICAS -> clase("SecretariaObrasPublicas");
			case EMPRESA_SERVICIOS_PUBLICOS -> clase("EmpresaServiciosPublicos");
			case EMPRESA_ASEO -> clase("EmpresaAseo");
		};
	}

	private static Resource clase(String nombreLocal) {
		return ResourceFactory.createResource(NS + nombreLocal);
	}

	private static Property propiedad(String nombreLocal) {
		return ResourceFactory.createProperty(NS + nombreLocal);
	}
}
