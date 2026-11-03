package com.gestion.backend.ia;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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

	private static final Path RESULTADOS_CSV = Path.of("ia-evaluation", "resultados.csv");
	private static final Path METRICAS_MD = Path.of("ia-evaluation", "metricas.md");

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

		Map<String, Map<String, Integer>> confusion = crearMatrizConfusion();
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
					Thread.sleep(4500);
				}
				primera = false;

				String clave = categoria + "/" + archivo.getFileName();
				long inicio = System.nanoTime();
				ResultadoClasificacion resultado = clasificador.clasificar(clave);
				long latenciaMs = (System.nanoTime() - inicio) / 1_000_000;
				String predicha = prediccion(resultado);
				confusion.get(categoria).merge(predicha, 1, Integer::sum);
				resultados.add(new ResultadoEvaluacion(categoria, predicha,
						archivo.getFileName().toString(), resultado.confianza(), latenciaMs,
						resultado.descripcionBorrador()));

				System.out.printf("%-22s -> %-22s conf=%.2f %d ms %s%n",
						categoria, predicha, resultado.confianza(), latenciaMs, archivo.getFileName());
				System.out.printf("  %s%n", resultado.descripcionBorrador());
			}
		}

		imprimirMetricas(confusion, resultados);
		escribirResultadosCsv(resultados);
		escribirMetricas(confusion, resultados);
		System.out.printf("Resultados: %s%n", RESULTADOS_CSV.toAbsolutePath());
		System.out.printf("Metricas: %s%n", METRICAS_MD.toAbsolutePath());
	}

	private Map<String, Map<String, Integer>> crearMatrizConfusion() {
		Map<String, Map<String, Integer>> confusion = new LinkedHashMap<>();
		for (String actual : CATEGORIAS) {
			Map<String, Integer> fila = new LinkedHashMap<>();
			for (String predicha : PREDICCIONES) {
				fila.put(predicha, 0);
			}
			confusion.put(actual, fila);
		}
		return confusion;
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
		Map<String, MetricaCategoria> metricas = calcularMetricas(confusion);

		System.out.println();
		System.out.println("================ RESULTADOS ================");
		System.out.printf("Imagenes evaluadas: %d%n", total);
		System.out.printf("Accuracy: %.2f%% (%d/%d)%n",
				total == 0 ? 0 : (100.0 * correctas / total), correctas, total);
		System.out.printf("F1 macro: %.2f%%%n", 100.0 * f1Macro(metricas));

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
		System.out.println("Metricas por categoria:");
		System.out.printf("%-22s %10s %10s %10s %8s%n", "CATEGORIA", "PRECISION", "RECALL", "F1", "SOPORTE");
		for (String categoria : CATEGORIAS) {
			MetricaCategoria metrica = metricas.get(categoria);
			System.out.printf("%-22s %9.2f%% %9.2f%% %9.2f%% %8d%n",
					categoria, metrica.precision() * 100, metrica.recall() * 100,
					metrica.f1() * 100, metrica.soporte());
		}

		System.out.println();
		System.out.println("Incidencias incorrectas o pendientes:");
		resultados.stream()
				.filter(r -> !r.actual().equals(r.predicha()))
				.forEach(r -> System.out.printf("  %s: %s -> %s (%s)%n",
						r.archivo(), r.actual(), r.predicha(), r.descripcion()));
	}

	private void escribirResultadosCsv(List<ResultadoEvaluacion> resultados) throws IOException {
		StringBuilder csv = new StringBuilder();
		csv.append("categoria_esperada,archivo,prediccion,confianza,latencia_ms,descripcion\n");
		for (ResultadoEvaluacion resultado : resultados) {
			csv.append(csv(resultado.actual())).append(',')
					.append(csv(resultado.archivo())).append(',')
					.append(csv(resultado.predicha())).append(',')
					.append(String.format(Locale.ROOT, "%.4f", resultado.confianza())).append(',')
					.append(resultado.latenciaMs()).append(',')
					.append(csv(resultado.descripcion())).append('\n');
		}
		Files.writeString(RESULTADOS_CSV, csv.toString(), StandardCharsets.UTF_8);
	}

	private void escribirMetricas(Map<String, Map<String, Integer>> confusion,
			List<ResultadoEvaluacion> resultados) throws IOException {
		int total = resultados.size();
		long correctas = resultados.stream()
				.filter(r -> r.actual().equals(r.predicha()))
				.count();
		long errores = resultados.stream().filter(r -> "ERROR".equals(r.predicha())).count();
		long pendientes = resultados.stream().filter(r -> "PENDIENTE".equals(r.predicha())).count();
		Map<String, MetricaCategoria> metricas = calcularMetricas(confusion);

		StringBuilder md = new StringBuilder();
		md.append("# Resultados de evaluacion de clasificacion\n\n");
		md.append("- Fecha: ").append(OffsetDateTime.now()
				.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)).append('\n');
		md.append("- Modelo: `gemini-3.5-flash-lite`\n");
		md.append("- Umbral de confianza: `0.60`\n");
		md.append("- Imagenes evaluadas: ").append(total).append('\n');
		md.append("- Accuracy: ").append(String.format(Locale.ROOT, "%.2f%%", total == 0 ? 0 : 100.0 * correctas / total))
				.append(" (").append(correctas).append('/').append(total).append(")\n");
		md.append("- F1 macro: ").append(String.format(Locale.ROOT, "%.2f%%", 100.0 * f1Macro(metricas))).append('\n');
		md.append("- Predicciones `PENDIENTE`: ").append(pendientes).append('\n');
		md.append("- Errores tecnicos: ").append(errores).append("\n\n");

		md.append("## Matriz de confusion\n\n");
		md.append("Filas = categoria esperada; columnas = prediccion.\n\n");
		md.append("| Esperado |");
		for (String predicha : PREDICCIONES) {
			md.append(' ').append(predicha).append(" |");
		}
		md.append("\n|---|");
		for (int i = 0; i < PREDICCIONES.size(); i++) {
			md.append("---:|");
		}
		md.append('\n');
		for (String actual : CATEGORIAS) {
			md.append("| ").append(actual).append(" |");
			for (String predicha : PREDICCIONES) {
				md.append(' ').append(confusion.get(actual).get(predicha)).append(" |");
			}
			md.append('\n');
		}

		md.append("\n## Metricas por categoria\n\n");
		md.append("| Categoria | Precision | Recall | F1 | Soporte |\n");
		md.append("|---|---:|---:|---:|---:|\n");
		for (String categoria : CATEGORIAS) {
			MetricaCategoria metrica = metricas.get(categoria);
			md.append("| ").append(categoria).append(" | ")
					.append(String.format(Locale.ROOT, "%.2f%%", metrica.precision() * 100)).append(" | ")
					.append(String.format(Locale.ROOT, "%.2f%%", metrica.recall() * 100)).append(" | ")
					.append(String.format(Locale.ROOT, "%.2f%%", metrica.f1() * 100)).append(" | ")
					.append(metrica.soporte()).append(" |\n");
		}

		var latencias = resultados.stream().mapToLong(ResultadoEvaluacion::latenciaMs).sorted().toArray();
		if (latencias.length > 0) {
			double promedio = resultados.stream().mapToLong(ResultadoEvaluacion::latenciaMs).average().orElse(0);
			md.append("\n## Latencia\n\n");
			md.append("- Promedio: ").append(String.format(Locale.ROOT, "%.0f ms", promedio)).append('\n');
			md.append("- Minima: ").append(latencias[0]).append(" ms\n");
			md.append("- Maxima: ").append(latencias[latencias.length - 1]).append(" ms\n");
		}

		md.append("\n## Errores y pendientes\n\n");
		List<ResultadoEvaluacion> incorrectas = resultados.stream()
				.filter(r -> !r.actual().equals(r.predicha()))
				.toList();
		if (incorrectas.isEmpty()) {
			md.append("No hubo errores ni casos pendientes en este set.\n");
		} else {
			md.append("| Archivo | Esperado | Prediccion | Confianza | Descripcion |\n");
			md.append("|---|---|---|---:|---|\n");
			for (ResultadoEvaluacion resultado : incorrectas) {
				md.append("| ").append(resultado.archivo()).append(" | ")
						.append(resultado.actual()).append(" | ")
						.append(resultado.predicha()).append(" | ")
						.append(String.format(Locale.ROOT, "%.2f", resultado.confianza())).append(" | ")
						.append(resultado.descripcion()).append(" |\n");
			}
		}

		Files.writeString(METRICAS_MD, md.toString(), StandardCharsets.UTF_8);
	}

	private Map<String, MetricaCategoria> calcularMetricas(Map<String, Map<String, Integer>> confusion) {
		Map<String, MetricaCategoria> metricas = new LinkedHashMap<>();
		for (String categoria : CATEGORIAS) {
			int tp = confusion.get(categoria).getOrDefault(categoria, 0);
			int soporte = confusion.get(categoria).values().stream().mapToInt(Integer::intValue).sum();
			int predichas = 0;
			for (String fila : CATEGORIAS) {
				predichas += confusion.get(fila).getOrDefault(categoria, 0);
			}
			double precision = predichas == 0 ? 0 : (double) tp / predichas;
			double recall = soporte == 0 ? 0 : (double) tp / soporte;
			double f1 = precision + recall == 0 ? 0 : 2 * precision * recall / (precision + recall);
			metricas.put(categoria, new MetricaCategoria(precision, recall, f1, soporte));
		}
		return metricas;
	}

	private double f1Macro(Map<String, MetricaCategoria> metricas) {
		return metricas.values().stream().mapToDouble(MetricaCategoria::f1).average().orElse(0);
	}

	private String csv(String valor) {
		return "\"" + (valor == null ? "" : valor).replace("\"", "\"\"") + "\"";
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
			long latenciaMs,
			String descripcion) {
	}

	private record MetricaCategoria(
			double precision,
			double recall,
			double f1,
			int soporte) {
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
