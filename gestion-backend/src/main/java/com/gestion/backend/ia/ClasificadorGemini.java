package com.gestion.backend.ia;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.backend.almacenamiento.AlmacenamientoArchivos;
import com.gestion.backend.almacenamiento.RecursoAlmacenado;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;

/**
 * Clasificador de imagenes usando la API GenerateContent de Gemini.
 *
 * <p>La clave se lee exclusivamente de GEMINI_API_KEY. Nunca se escribe en los
 * archivos de configuracion ni se registra en los logs.</p>
 */
@Service
@ConditionalOnProperty(name = "gestion.ia.modo", havingValue = "gemini")
public class ClasificadorGemini implements ClasificadorIncidencias {

	private static final Logger log = LoggerFactory.getLogger(ClasificadorGemini.class);
	private static final int LADO_MAXIMO = 1024;
	private static final String PROMPT = """
			Eres un clasificador de incidencias urbanas de Florencia, Caqueta, Colombia.
			Analiza la imagen y devuelve UNICAMENTE un objeto JSON valido, sin markdown ni texto adicional,
			con exactamente estos campos:
			{
			  "esIncidencia": true,
			  "categoria": "HUECO_VIA | FUGA_AGUA | FALLA_ALUMBRADO | ACUMULACION_BASURA | NO_RELACIONADO",
			  "severidad": "BAJA | MEDIA | ALTA | CRITICA",
			  "confianza": 0.0,
			  "descripcion": "descripcion breve en espanol"
			}

			Reglas:
			- esIncidencia debe ser false y categoria NO_RELACIONADO si la imagen no muestra una incidencia urbana.
			- No inventes categorias fuera de la lista.
			- La confianza debe estar entre 0 y 1.
			- La severidad debe ser una de las cuatro opciones; si no puedes determinarla, usa MEDIA.
			- La descripcion debe tener maximo 300 caracteres.
			- No expliques tu razonamiento; devuelve solo el JSON.
			""";

	private final AlmacenamientoArchivos almacenamiento;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private final HttpClient httpClient;
	private final String apiKey;
	private final String modelo;
	private final String urlBase;
	private final Duration timeout;
	private final double confianzaMinima;

	public ClasificadorGemini(
			AlmacenamientoArchivos almacenamiento,
			@Value("${gestion.ia.gemini.api-key:}") String apiKey,
			@Value("${gestion.ia.gemini.modelo:gemini-3.5-flash-lite}") String modelo,
			@Value("${gestion.ia.gemini.url:https://generativelanguage.googleapis.com/v1beta}") String urlBase,
			@Value("${gestion.ia.gemini.timeout-segundos:60}") long timeoutSegundos,
			@Value("${gestion.ia.gemini.confianza-minima:0.60}") double confianzaMinima) {
		this.almacenamiento = almacenamiento;
		this.apiKey = apiKey == null ? "" : apiKey.trim();
		this.modelo = modelo;
		this.urlBase = urlBase.endsWith("/") ? urlBase.substring(0, urlBase.length() - 1) : urlBase;
		this.timeout = Duration.ofSeconds(Math.max(1, timeoutSegundos));
		this.confianzaMinima = Math.max(0, Math.min(1, confianzaMinima));
		this.httpClient = HttpClient.newBuilder().connectTimeout(this.timeout).build();
	}

	@Override
	public ResultadoClasificacion clasificar(String claveImagen) {
		try {
			Imagen imagen = cargarImagen(claveImagen);
			String respuesta = solicitarGemini(imagen);
			return parsearRespuesta(respuesta);
		} catch (Exception e) {
			// No se registra la clave ni el contenido de la imagen.
			log.warn("No se pudo clasificar la imagen con Gemini: {}", e.getMessage());
			return pendiente();
		}
	}

	private Imagen cargarImagen(String clave) throws IOException {
		RecursoAlmacenado recurso = almacenamiento.obtener(clave);
		byte[] contenido;
		try (InputStream entrada = recurso.contenido()) {
			contenido = entrada.readAllBytes();
		}
		if (contenido.length == 0) {
			throw new IOException("La imagen esta vacia");
		}
		String tipo = recurso.tipoContenido() == null || recurso.tipoContenido().isBlank()
				? "image/jpeg"
				: recurso.tipoContenido();
		return prepararImagen(contenido, tipo);
	}

	private Imagen prepararImagen(byte[] contenido, String tipo) {
		try {
			BufferedImage original = ImageIOCompat.leer(contenido);
			if (original == null) {
				return new Imagen(contenido, tipo);
			}

			int ancho = original.getWidth();
			int alto = original.getHeight();
			int lado = Math.max(ancho, alto);
			if (lado <= LADO_MAXIMO) {
				return new Imagen(contenido, tipo);
			}

			double escala = LADO_MAXIMO / (double) lado;
			int anchoNuevo = Math.max(1, (int) Math.round(ancho * escala));
			int altoNuevo = Math.max(1, (int) Math.round(alto * escala));

			BufferedImage reducida = new BufferedImage(anchoNuevo, altoNuevo, BufferedImage.TYPE_INT_RGB);
			Graphics2D grafico = reducida.createGraphics();
			try {
				grafico.setColor(Color.WHITE);
				grafico.fillRect(0, 0, anchoNuevo, altoNuevo);
				grafico.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
						RenderingHints.VALUE_INTERPOLATION_BILINEAR);
				grafico.drawImage(original, 0, 0, anchoNuevo, altoNuevo, null);
			} finally {
				grafico.dispose();
			}

			ByteArrayOutputStream salida = new ByteArrayOutputStream();
			if (!javax.imageio.ImageIO.write(reducida, "jpg", salida)) {
				return new Imagen(contenido, tipo);
			}
			return new Imagen(salida.toByteArray(), "image/jpeg");
		} catch (Exception e) {
			log.debug("No se pudo reducir la imagen; se enviara el archivo original");
			return new Imagen(contenido, tipo);
		}
	}

	private String solicitarGemini(Imagen imagen) throws IOException, InterruptedException {
		if (apiKey.isBlank()) {
			throw new IllegalStateException("GEMINI_API_KEY no esta configurada");
		}

		Map<String, Object> texto = Map.of("text", PROMPT);
		Map<String, Object> imagenInline = Map.of(
				"mimeType", imagen.tipoContenido(),
				"data", Base64.getEncoder().encodeToString(imagen.contenido()));
		Map<String, Object> parteImagen = Map.of("inlineData", imagenInline);
		Map<String, Object> contenido = Map.of(
				"role", "user",
				"parts", List.of(texto, parteImagen));
		Map<String, Object> generacion = Map.of(
				"temperature", 0.1,
				"responseMimeType", "application/json");
		Map<String, Object> cuerpo = Map.of(
				"contents", List.of(contenido),
				"generationConfig", generacion);

		String json = objectMapper.writeValueAsString(cuerpo);
		URI uri = URI.create(urlBase + "/models/" + modelo + ":generateContent");
		HttpRequest solicitud = HttpRequest.newBuilder(uri)
				.timeout(timeout)
				.header("Content-Type", "application/json")
				.header("x-goog-api-key", apiKey)
				.POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
				.build();

		HttpResponse<String> respuesta = httpClient.send(solicitud,
				HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
		if (respuesta.statusCode() < 200 || respuesta.statusCode() >= 300) {
			throw new IllegalStateException("Gemini respondio HTTP " + respuesta.statusCode());
		}
		return respuesta.body();
	}

	/**
	 * Extrae y valida el JSON del texto devuelto por Gemini. Es visible para
	 * pruebas unitarias sin realizar llamadas reales a la API.
	 */
	ResultadoClasificacion parsearRespuesta(String respuesta) throws IOException {
		JsonNode raiz = objectMapper.readTree(respuesta);
		JsonNode candidatos = raiz.path("candidates");
		if (!candidatos.isArray() || candidatos.isEmpty()) {
			throw new IOException("Gemini no devolvio candidatos");
		}

		StringBuilder texto = new StringBuilder();
		JsonNode partes = candidatos.get(0).path("content").path("parts");
		for (JsonNode parte : partes) {
			if (parte.has("text")) {
				texto.append(parte.path("text").asText());
			}
		}
		String json = limpiarJson(texto.toString());
		if (json.isBlank()) {
			throw new IOException("Gemini no devolvio contenido de texto");
		}

		JsonNode resultado = objectMapper.readTree(json);
		boolean esIncidencia = resultado.path("esIncidencia").asBoolean(false);
		String categoriaTexto = resultado.path("categoria").asText("");
		String severidadTexto = resultado.path("severidad").asText("");
		double confianza = resultado.path("confianza").asDouble(0);
		String descripcion = resultado.path("descripcion").asText("");

		if (!Double.isFinite(confianza)) {
			confianza = 0;
		}
		confianza = Math.max(0, Math.min(1, confianza));
		descripcion = descripcion == null ? "" : descripcion.trim();
		if (descripcion.length() > 300) {
			descripcion = descripcion.substring(0, 300);
		}

		if (!esIncidencia || "NO_RELACIONADO".equalsIgnoreCase(categoriaTexto)) {
			return new ResultadoClasificacion(false, null, null, confianza,
					descripcion.isBlank() ? "La imagen no parece corresponder a una incidencia urbana." : descripcion);
		}

		TipoIncidencia categoria = parsearCategoria(categoriaTexto);
		Severidad severidad = parsearSeveridad(severidadTexto);

		// Una respuesta invalida o de baja confianza queda pendiente para revision.
		if (categoria == null || severidad == null || confianza < confianzaMinima) {
			return new ResultadoClasificacion(true, null, null, confianza,
					descripcion.isBlank() ? "Pendiente de clasificacion automatica." : descripcion);
		}

		return new ResultadoClasificacion(true, categoria, severidad, confianza,
				descripcion.isBlank() ? "Incidencia urbana detectada por vision artificial." : descripcion);
	}

	private TipoIncidencia parsearCategoria(String valor) {
		if (valor == null || valor.isBlank()) {
			return null;
		}
		try {
			return TipoIncidencia.valueOf(valor.trim().toUpperCase());
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	private Severidad parsearSeveridad(String valor) {
		if (valor == null || valor.isBlank()) {
			return null;
		}
		try {
			return Severidad.valueOf(valor.trim().toUpperCase());
		} catch (IllegalArgumentException e) {
			return null;
		}
	}

	private String limpiarJson(String texto) {
		String limpio = texto == null ? "" : texto.trim();
		if (limpio.startsWith("```")) {
			int inicio = limpio.indexOf('\n');
			if (inicio >= 0) {
				limpio = limpio.substring(inicio + 1);
			}
			if (limpio.endsWith("```")) {
				limpio = limpio.substring(0, limpio.length() - 3);
			}
		}
		int inicio = limpio.indexOf('{');
		int fin = limpio.lastIndexOf('}');
		if (inicio >= 0 && fin > inicio) {
			limpio = limpio.substring(inicio, fin + 1);
		}
		return limpio.trim();
	}

	private ResultadoClasificacion pendiente() {
		return new ResultadoClasificacion(false, null, null, 0,
				"Pendiente de clasificacion automatica.");
	}

	private record Imagen(byte[] contenido, String tipoContenido) {
	}

	/**
	 * Aisla ImageIO para que un fallo de lectura de un formato no impida usar el
	 * archivo original.
	 */
	private static final class ImageIOCompat {
		private static BufferedImage leer(byte[] contenido) {
			try {
				return javax.imageio.ImageIO.read(new ByteArrayInputStream(contenido));
			} catch (IOException e) {
				return null;
			}
		}
	}
}
