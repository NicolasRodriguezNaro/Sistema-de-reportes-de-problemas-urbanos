package com.gestion.backend.almacenamiento;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

class ResolvedorUrlArchivosTest {

	@Test
	void reutilizaLaUrlFirmadaParaLaMismaClave() {
		ContadorAlmacenamiento almacenamiento = new ContadorAlmacenamiento();
		ResolvedorUrlArchivos resolvedor = new ResolvedorUrlArchivos(almacenamiento);

		String primera = resolvedor.resolver("incidentes/foto-hd.jpg");
		String segunda = resolvedor.resolver("incidentes/foto-hd.jpg");

		assertThat(segunda).isEqualTo(primera);
		assertThat(almacenamiento.llamadas()).isEqualTo(1);
	}

	@Test
	void firmaClavesDistintasPorSeparado() {
		ContadorAlmacenamiento almacenamiento = new ContadorAlmacenamiento();
		ResolvedorUrlArchivos resolvedor = new ResolvedorUrlArchivos(almacenamiento);

		String hd = resolvedor.resolver("incidentes/foto-hd.jpg");
		String thumb = resolvedor.resolver("incidentes/foto-thumb.jpg");

		assertThat(hd).isNotEqualTo(thumb);
		assertThat(almacenamiento.llamadas()).isEqualTo(2);
	}

	private static final class ContadorAlmacenamiento implements AlmacenamientoArchivos {

		private final AtomicInteger llamadas = new AtomicInteger();

		@Override
		public void guardar(String clave, InputStream contenido, String tipoContenido, long tamanio) {
			throw new UnsupportedOperationException();
		}

		@Override
		public String urlDe(String clave) {
			return "https://almacenamiento.test/" + clave + "?firma=" + llamadas.incrementAndGet();
		}

		@Override
		public RecursoAlmacenado obtener(String clave) {
			throw new UnsupportedOperationException();
		}

		int llamadas() {
			return llamadas.get();
		}
	}
}
