package com.gestion.backend.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;

class ClasificadorGeminiTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

	private ClasificadorGemini clasificador() {
		return new ClasificadorGemini(null, "clave-de-prueba",
				"gemini-3.5-flash-lite", "http://localhost", 5, 0.60);
	}

	private String respuesta(String texto) throws Exception {
		return objectMapper.writeValueAsString(Map.of(
				"candidates", List.of(Map.of(
						"content", Map.of(
								"parts", List.of(Map.of("text", texto)))))));
	}

	@Test
	void parseaUnaIncidenciaValida() throws Exception {
		String json = """
				{
				  "esIncidencia": true,
				  "categoria": "ACUMULACION_BASURA",
				  "severidad": "MEDIA",
				  "confianza": 0.91,
				  "descripcion": "Residuos acumulados en la via"
				}
				""";

		ResultadoClasificacion resultado = clasificador().parsearRespuesta(respuesta(json));

		assertThat(resultado.esIncidencia()).isTrue();
		assertThat(resultado.categoria()).isEqualTo(TipoIncidencia.ACUMULACION_BASURA);
		assertThat(resultado.severidad()).isEqualTo(Severidad.MEDIA);
		assertThat(resultado.confianza()).isEqualTo(0.91);
	}

	@Test
	void detectaContenidoNoRelacionado() throws Exception {
		String json = """
				{
				  "esIncidencia": false,
				  "categoria": "NO_RELACIONADO",
				  "severidad": "MEDIA",
				  "confianza": 0.95,
				  "descripcion": "La imagen muestra un paisaje"
				}
				""";

		ResultadoClasificacion resultado = clasificador().parsearRespuesta(respuesta(json));

		assertThat(resultado.esIncidencia()).isFalse();
		assertThat(resultado.categoria()).isNull();
		assertThat(resultado.severidad()).isNull();
	}

	@Test
	void dejaPendienteUnaCategoriaInvalida() throws Exception {
		String json = """
				{
				  "esIncidencia": true,
				  "categoria": "OTRA_COSA",
				  "severidad": "ALTA",
				  "confianza": 0.95,
				  "descripcion": "Categoria desconocida"
				}
				""";

		ResultadoClasificacion resultado = clasificador().parsearRespuesta(respuesta(json));

		assertThat(resultado.esIncidencia()).isTrue();
		assertThat(resultado.categoria()).isNull();
		assertThat(resultado.severidad()).isNull();
	}

	@Test
	void dejaPendienteUnaConfianzaBaja() throws Exception {
		String json = """
				{
				  "esIncidencia": true,
				  "categoria": "HUECO_VIA",
				  "severidad": "ALTA",
				  "confianza": 0.25,
				  "descripcion": "Posible hueco"
				}
				""";

		ResultadoClasificacion resultado = clasificador().parsearRespuesta(respuesta(json));

		assertThat(resultado.esIncidencia()).isTrue();
		assertThat(resultado.categoria()).isNull();
		assertThat(resultado.severidad()).isNull();
	}

	@Test
	void rechazaUnaRespuestaSinCandidatos() {
		assertThatThrownBy(() -> clasificador().parsearRespuesta("{\"candidates\":[]}"))
				.isInstanceOf(Exception.class);
	}
}
