package com.gestion.backend.ia;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.backend.almacenamiento.AlmacenamientoArchivos;
import com.gestion.backend.almacenamiento.RecursoAlmacenado;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;
import com.sun.net.httpserver.HttpServer;

class ClasificadorGeminiHttpTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void enviaLaImagenYLaClaveEnLaPeticion() throws Exception {
		AtomicReference<String> apiKeyRecibida = new AtomicReference<>();
		AtomicReference<String> cuerpoRecibido = new AtomicReference<>();

		HttpServer servidor = HttpServer.create(new InetSocketAddress(0), 0);
		servidor.createContext("/v1beta/models/gemini-3.5-flash-lite:generateContent", intercambio -> {
			apiKeyRecibida.set(intercambio.getRequestHeaders().getFirst("x-goog-api-key"));
			cuerpoRecibido.set(new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));

			String clasificacion = """
					{
					  "esIncidencia": true,
					  "categoria": "HUECO_VIA",
					  "severidad": "ALTA",
					  "confianza": 0.88,
					  "descripcion": "Hueco visible en la calzada"
					}
					""";
			String respuesta = objectMapper.writeValueAsString(Map.of(
					"candidates", List.of(Map.of(
							"content", Map.of(
									"parts", List.of(Map.of("text", clasificacion)))))));
			byte[] bytes = respuesta.getBytes(StandardCharsets.UTF_8);

			intercambio.getResponseHeaders().set("Content-Type", "application/json");
			intercambio.sendResponseHeaders(200, bytes.length);
			try (OutputStream salida = intercambio.getResponseBody()) {
				salida.write(bytes);
			}
		});
		servidor.start();

		try {
			ClasificadorGemini clasificador = new ClasificadorGemini(
					new AlmacenamientoFalso(),
					"clave-de-prueba",
					"gemini-3.5-flash-lite",
					"http://localhost:" + servidor.getAddress().getPort() + "/v1beta",
					5,
					0.60);

			ResultadoClasificacion resultado = clasificador.clasificar("incidentes/prueba/hd.jpg");

			assertThat(resultado.categoria()).isEqualTo(TipoIncidencia.HUECO_VIA);
			assertThat(resultado.severidad()).isEqualTo(Severidad.ALTA);
			assertThat(resultado.confianza()).isEqualTo(0.88);
			assertThat(apiKeyRecibida.get()).isEqualTo("clave-de-prueba");
			assertThat(cuerpoRecibido.get()).contains("\"inlineData\"").contains("\"data\"");
		} finally {
			servidor.stop(0);
		}
	}

	private static final class AlmacenamientoFalso implements AlmacenamientoArchivos {

		@Override
		public void guardar(String clave, InputStream contenido, String tipoContenido, long tamanio) {
			throw new UnsupportedOperationException();
		}

		@Override
		public String urlDe(String clave) {
			return "http://localhost/" + clave;
		}

		@Override
		public RecursoAlmacenado obtener(String clave) {
			byte[] bytes = new byte[] { 1, 2, 3 };
			return new RecursoAlmacenado(new ByteArrayInputStream(bytes), "image/jpeg", bytes.length);
		}
	}
}
