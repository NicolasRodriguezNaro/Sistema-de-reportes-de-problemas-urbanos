package com.gestion.backend.correo;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.HtmlUtils;

import com.gestion.backend.modelo.Usuario;

@Service
@ConditionalOnProperty(name = "gestion.correo.proveedor", havingValue = "brevo")
public class ServicioCorreoBrevo implements ServicioCorreo {

	private final RestClient restClient = RestClient.create();
	private final String url;
	private final String apiKey;
	private final String remitenteEmail;
	private final String remitenteNombre;

	public ServicioCorreoBrevo(
			@Value("${gestion.correo.brevo.url:https://api.brevo.com/v3/smtp/email}") String url,
			@Value("${gestion.correo.brevo.api-key:}") String apiKey,
			@Value("${gestion.correo.remitente-email:no-reply@mosqueteros.cloud}") String remitenteEmail,
			@Value("${gestion.correo.remitente-nombre:Reporte Urbano}") String remitenteNombre) {
		this.url = url;
		this.apiKey = apiKey;
		this.remitenteEmail = remitenteEmail;
		this.remitenteNombre = remitenteNombre;
	}

	@Override
	public void enviarCodigoRecuperacion(Usuario usuario, String codigo, long expiracionMinutos) {
		if (apiKey == null || apiKey.isBlank()) {
			throw new IllegalStateException("BREVO_API_KEY no está configurada");
		}

		String nombre = HtmlUtils.htmlEscape(usuario.getNombre());
		String html = """
				<div style="font-family:Arial,sans-serif;color:#102a33;line-height:1.6;max-width:560px;margin:auto">
				  <h2 style="color:#0f4c5c;margin-bottom:8px">Recuperación de contraseña</h2>
				  <p>Hola, %s:</p>
				  <p>Recibimos una solicitud para restablecer tu contraseña en Reporte Urbano.</p>
				  <p style="margin:24px 0;font-size:30px;font-weight:700;letter-spacing:8px;color:#0f4c5c">%s</p>
				  <p>Este código vence en %d minutos y solo se puede usar una vez.</p>
				  <p>Si no solicitaste este cambio, ignora este mensaje.</p>
				  <hr style="border:0;border-top:1px solid #d8e3e6;margin:24px 0">
				  <p style="color:#5b7078;font-size:13px"><strong>English:</strong> Your password recovery code is %s. It expires in %d minutes and can only be used once.</p>
				  <p style="color:#8ba0a6;font-size:12px">Reporte Urbano · Florencia, Caquetá</p>
				</div>
				""".formatted(nombre, codigo, expiracionMinutos, codigo, expiracionMinutos);

		String texto = """
				Recuperación de contraseña - Reporte Urbano

				Hola, %s:

				Recibimos una solicitud para restablecer tu contraseña.
				Tu código es: %s
				Vence en %d minutos y solo se puede usar una vez.

				Si no solicitaste este cambio, ignora este mensaje.

				English: Your recovery code is %s. It expires in %d minutes.
				""".formatted(usuario.getNombre(), codigo, expiracionMinutos, codigo, expiracionMinutos);

		Map<String, Object> cuerpo = Map.of(
				"sender", Map.of("name", remitenteNombre, "email", remitenteEmail),
				"to", List.of(Map.of("email", usuario.getEmail(), "name", usuario.getNombre())),
				"subject", "Código de recuperación - Reporte Urbano",
				"htmlContent", html,
				"textContent", texto);

		try {
			restClient.post()
					.uri(url)
					.header("api-key", apiKey)
					.contentType(MediaType.APPLICATION_JSON)
					.body(cuerpo)
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientException excepcion) {
			throw new IllegalStateException("No se pudo enviar el correo de recuperación", excepcion);
		}
	}
}
