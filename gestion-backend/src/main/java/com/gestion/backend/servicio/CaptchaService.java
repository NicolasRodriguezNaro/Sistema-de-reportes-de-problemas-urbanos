package com.gestion.backend.servicio;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.gestion.backend.dto.CaptchaResponse;
import com.gestion.backend.error.CaptchaInvalidoException;

@Service
public class CaptchaService {

	private static final Duration VIGENCIA = Duration.ofMinutes(2);
	private static final int INTENTOS_MAXIMOS_ENTRADAS = 1_000;
	private static final char[] ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
	private static final SecureRandom RANDOM = new SecureRandom();

	private final boolean activo;
	private final Map<String, Desafio> desafios = new ConcurrentHashMap<>();

	public CaptchaService(@Value("${gestion.seguridad.captcha.activo:true}") boolean activo) {
		this.activo = activo;
	}

	public CaptchaResponse generar() {
		limpiarVencidos();

		String id = UUID.randomUUID().toString();
		String codigo = generarCodigo();
		byte[] imagen = generarImagen(codigo);
		desafios.put(id, new Desafio(codigo, Instant.now().plus(VIGENCIA)));

		return new CaptchaResponse(id, "data:image/png;base64,"
				+ Base64.getEncoder().encodeToString(imagen), VIGENCIA.toSeconds());
	}

	public void validar(String id, String respuesta) {
		if (!activo) {
			return;
		}
		if (id == null || id.isBlank() || respuesta == null || respuesta.isBlank()) {
			throw new CaptchaInvalidoException();
		}

		Desafio desafio = desafios.remove(id);
		boolean valido = desafio != null
				&& desafio.expira().isAfter(Instant.now())
				&& desafio.codigo().equalsIgnoreCase(respuesta.trim());
		if (!valido) {
			throw new CaptchaInvalidoException();
		}
	}

	private String generarCodigo() {
		StringBuilder codigo = new StringBuilder(5);
		for (int i = 0; i < 5; i++) {
			codigo.append(ALFABETO[RANDOM.nextInt(ALFABETO.length)]);
		}
		return codigo.toString();
	}

	private byte[] generarImagen(String codigo) {
		BufferedImage imagen = new BufferedImage(190, 68, BufferedImage.TYPE_INT_RGB);
		Graphics2D graphics = imagen.createGraphics();
		try {
			graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			graphics.setColor(new Color(246, 250, 249));
			graphics.fillRect(0, 0, imagen.getWidth(), imagen.getHeight());

			for (int i = 0; i < 9; i++) {
				graphics.setColor(new Color(120 + RANDOM.nextInt(100), 150 + RANDOM.nextInt(80),
						145 + RANDOM.nextInt(90), 110));
				graphics.drawLine(RANDOM.nextInt(190), RANDOM.nextInt(68), RANDOM.nextInt(190), RANDOM.nextInt(68));
			}

			graphics.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 34));
			for (int i = 0; i < codigo.length(); i++) {
				int x = 16 + i * 32;
				int y = 45 + RANDOM.nextInt(9);
				AffineTransform original = graphics.getTransform();
				graphics.rotate(Math.toRadians(RANDOM.nextInt(25) - 12), x, y);
				graphics.setColor(new Color(20 + RANDOM.nextInt(55), 55 + RANDOM.nextInt(65), 60 + RANDOM.nextInt(55)));
				graphics.drawString(String.valueOf(codigo.charAt(i)), x, y);
				graphics.setTransform(original);
			}

			for (int i = 0; i < 45; i++) {
				graphics.setColor(new Color(RANDOM.nextInt(180), RANDOM.nextInt(180), RANDOM.nextInt(180), 150));
				graphics.fillOval(RANDOM.nextInt(190), RANDOM.nextInt(68), 2, 2);
			}
		} finally {
			graphics.dispose();
		}

		try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
			ImageIO.write(imagen, "png", salida);
			return salida.toByteArray();
		} catch (IOException e) {
			throw new IllegalStateException("No se pudo generar el captcha", e);
		}
	}

	private void limpiarVencidos() {
		Instant ahora = Instant.now();
		desafios.entrySet().removeIf(entrada -> !entrada.getValue().expira().isAfter(ahora));
		if (desafios.size() >= INTENTOS_MAXIMOS_ENTRADAS) {
			throw new IllegalStateException("Demasiados captchas pendientes");
		}
	}

	private record Desafio(String codigo, Instant expira) {
	}
}
