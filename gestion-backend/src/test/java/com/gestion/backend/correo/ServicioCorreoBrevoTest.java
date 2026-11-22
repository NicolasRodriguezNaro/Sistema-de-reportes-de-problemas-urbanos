package com.gestion.backend.correo;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import com.gestion.backend.modelo.Usuario;
import com.sun.net.httpserver.HttpServer;

class ServicioCorreoBrevoTest {

	private HttpServer servidor;

	@AfterEach
	void detener() {
		if (servidor != null) {
			servidor.stop(0);
		}
	}

	@Test
	void enviaElCodigoALaApiDeBrevo() throws Exception {
		AtomicReference<String> cuerpoRecibido = new AtomicReference<>();
		AtomicReference<String> apiKeyRecibida = new AtomicReference<>();

		servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		servidor.createContext("/v3/smtp/email", intercambio -> {
			apiKeyRecibida.set(intercambio.getRequestHeaders().getFirst("api-key"));
			cuerpoRecibido.set(new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			byte[] respuesta = "{}".getBytes(StandardCharsets.UTF_8);
			intercambio.sendResponseHeaders(200, respuesta.length);
			intercambio.getResponseBody().write(respuesta);
			intercambio.close();
		});
		servidor.start();

		ServicioCorreoBrevo servicio = new ServicioCorreoBrevo(
				"http://127.0.0.1:" + servidor.getAddress().getPort() + "/v3/smtp/email",
				"clave-de-prueba",
				"no-reply@test.local",
				"Reporte Urbano");

		Usuario usuario = new Usuario();
		usuario.setNombre("Ciudadano Prueba");
		usuario.setEmail("ciudadano@test.local");

		servicio.enviarCodigoRecuperacion(usuario, "482913", 10);

		assertThat(apiKeyRecibida.get()).isEqualTo("clave-de-prueba");
		assertThat(cuerpoRecibido.get())
				.contains("\"email\":\"ciudadano@test.local\"")
				.contains("482913")
				.contains("no-reply@test.local");
	}
}
