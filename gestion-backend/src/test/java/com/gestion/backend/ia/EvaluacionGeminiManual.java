package com.gestion.backend.ia;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import com.gestion.backend.almacenamiento.AlmacenamientoArchivos;
import com.gestion.backend.almacenamiento.RecursoAlmacenado;

/**
 * Evaluacion manual contra la API real de Gemini.
 *
 * No forma parte de la suite normal porque el nombre no termina en Test.
 * Se ejecuta solo con:
 *
 * GEMINI_API_KEY=... ./mvnw -Dtest=EvaluacionGeminiManual test
 *
 * Las imagenes se buscan en ia-evaluation/imagenes y no se versionan.
 */
class EvaluacionGeminiManual {

	private static final List<String> CATEGORIAS = List.of(
			"HUECO_VIA",
			"FUGA_AGUA",
			"FALLA_ALUMBRADO",
			"ACUMULACION_BASURA",
			"NO_RELACIONADO");

	private static final List<String> PREDICCIONES = List.of(
			"HUECO_VIA",
			"FUGA_AGUA",
			"FALLA_ALUMBRADO",
			"ACUMULACION_BASURA",
			"NO_RELACIONADO",
			"PENDIENTE",
			"ERROR");

	@Test
	void evaluarCategorias() throws Exception {
		String apiKey = System.getenv("GEMINI_API_KEY");
		assertThat(apiKey)
				.as("GEMINI_API_KEY debe estar definida en el proceso")
				.isNotBlank();

		Path base = Path.of("ia-evaluation", "imagenes");
		assertThat(base).as("Carpeta de evaluacion").isDirectory();

		String filtro = System.getProperty("evaluacion.filtro", "").trim();

		ClasificadorGemini clasificador = new ClasificadorGemini(
				new AlmacenamientoLocal(base),
				apiKey,
				"gemini-3.5-flash-lite",
				"https://generativelanguage.googleapis.com/v1beta",
				60,
				0.60);

		Map<String, Map<String, Integer>> confusion = new LinkedHashMap<>();
		for (String actual : CATEGORIAS) {
			Map<String, Integer> fila = new LinkedHashMap<>();
			for (String predicha : PREDICCIONES) {
				fila.put(predicha, 0);
			}
			confusion.put(actual, fila);
		}

		List<ResultadoEvaluacion> resultados = new ArrayList<>();
		boolean primera = true;
		for (String categoria : CATEGORIAS) {
			Path carpeta = base.resolve(categoria);
			if (!Files.isDirectory(carpeta)) {
				System.out.printf("OMITIDA: no existe %s%n", carpeta);
				continue;
			}

			List<Path> archivos;
			try (Stream<Path> stream = Files.list(carpeta)) {
				archivos = stream
						.filter(Files::isRegularFile)
						.filter(this::esImagen)
						.sorted()
						.toList();
			}

			for (Path archivo : archivos) {
				if (!filtro.isBlank() && !filtro.contains(archivo.getFileName().toString())) {
					continue;
				}
				if (!primera) {
					// La capa gratuita limita RPM. Espaciar las llamadas evita 429.
					Thread.sleep(2500);
				}
				primera = false;

				String clave = categoria + "/" + archivo.getFileName();
				ResultadoClasificacion resultado = clasificador.clasificar(clave);
				String predicha = prediccion(resultado);
				confusion.get(categoria).merge(predicha, 1, Integer::sum);
				resultados.add(new ResultadoEvaluacion(categoria, predicha, archivo.getFileName().toString(),
						resultado.confianza(), resultado.descripcionBorrador()));

				System.out.printf("%-22s -> %-22s conf=%.2f %s%n",
						categoria, predicha, resultado.confianza(), archivo.getFileName());
				System.out.printf("  %s%n", resultado.descripcionBorrador());
			}
		}

		imprimirMetricas(confusion, resultados);
	}

	private String prediccion(ResultadoClasificacion resultado) {
		if (resultado.categoria() != null) {
			return resultado.categoria().name();
		}
		if (resultado.descripcionBorrador() != null
				&& resultado.descripcionBorrador().startsWith("Pendiente de clasificacion automatica")) {
			return "ERROR";
		}
		if (!resultado.esIncidencia()) {
			return "NO_RELACIONADO";
		}
		return "PENDIENTE";
	}

	private void imprimirMetricas(Map<String, Map<String, Integer>> confusion,
			List<ResultadoEvaluacion> resultados) {
		int total = resultados.size();
		long correctas = resultados.stream()
				.filter(r -> r.actual().equals(r.predicha()))
				.count();

		System.out.println();
		System.out.println("================ RESULTADOS ================");
		System.out.printf("Imagenes evaluadas: %d%n", total);
		System.out.printf("Accuracy: %.2f%% (%d/%d)%n",
				total == 0 ? 0 : (100.0 * correctas / total), correctas, total);

		System.out.println();
		System.out.println("Matriz de confusion (filas = esperado, columnas = predicho):");
		System.out.printf("%-22s", "ESPERADO");
		for (String predicha : PREDICCIONES) {
			System.out.printf(" %-14s", predicha);
		}
		System.out.println();
		for (String actual : CATEGORIAS) {
			System.out.printf("%-22s", actual);
			for (String predicha : PREDICCIONES) {
				System.out.printf(" %-14d", confusion.get(actual).get(predicha));
			}
			System.out.println();
		}

		System.out.println();
		System.out.println("Metricas por categoria (solo clases de incidencia):");
		System.out.printf("%-22s %10s %10s %10s %8s%n", "CATEGORIA", "PRECISION", "RECALL", "F1", "SOPORTE");
		for (String categoria : CATEGORIAS) {
			if ("NO_RELACIONADO".equals(categoria)) {
				continue;
			}
			int tp = confusion.get(categoria).get(categoria);
			int actual = confusion.get(categoria).values().stream().mapToInt(Integer::intValue).sum();
			int predicha = 0;
			for (String fila : CATEGORIAS) {
				predicha += confusion.get(fila).get(categoria);
			}
			double precision = predicha == 0 ? 0 : (double) tp / predicha;
			double recall = actual == 0 ? 0 : (double) tp / actual;
			double f1 = precision + recall == 0 ? 0 : 2 * precision * recall / (precision + recall);
			System.out.printf("%-22s %9.2f%% %9.2f%% %9.2f%% %8d%n",
					categoria, precision * 100, recall * 100, f1 * 100, actual);
		}

		System.out.println();
		System.out.println("Errores/pendientes:");
		resultados.stream()
				.filter(r -> "ERROR".equals(r.predicha()) || "PENDIENTE".equals(r.predicha()))
				.forEach(r -> System.out.printf("  %s -> %s (%s)%n",
						r.archivo(), r.predicha(), r.descripcion()));
	}

	private boolean esImagen(Path archivo) {
		String nombre = archivo.getFileName().toString().toLowerCase();
		return nombre.endsWith(".jpg") || nombre.endsWith(".jpeg")
				|| nombre.endsWith(".png") || nombre.endsWith(".webp");
	}

	private record ResultadoEvaluacion(
			String actual,
			String predicha,
			String archivo,
			double confianza,
			String descripcion) {
	}

	private static final class AlmacenamientoLocal implements AlmacenamientoArchivos {

		private final Path base;

		private AlmacenamientoLocal(Path base) {
			this.base = base;
		}

		@Override
		public void guardar(String clave, InputStream contenido, String tipoContenido, long tamanio) {
			throw new UnsupportedOperationException();
		}

		@Override
		public String urlDe(String clave) {
			return base.resolve(clave).toString();
		}

		@Override
		public RecursoAlmacenado obtener(String clave) {
			Path archivo = base.resolve(clave);
			String nombre = archivo.getFileName().toString().toLowerCase();
			String tipo = nombre.endsWith(".png") ? "image/png"
					: nombre.endsWith(".webp") ? "image/webp" : "image/jpeg";
			try {
				return new RecursoAlmacenado(Files.newInputStream(archivo), tipo, Files.size(archivo));
			} catch (IOException e) {
				throw new IllegalStateException("No se pudo leer " + archivo, e);
			}
		}
	}
}
