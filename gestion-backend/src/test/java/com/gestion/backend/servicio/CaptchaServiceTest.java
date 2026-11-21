package com.gestion.backend.servicio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.gestion.backend.dto.CaptchaResponse;
import com.gestion.backend.error.CaptchaInvalidoException;

class CaptchaServiceTest {

	@Test
	void generaImagenYValidaElCodigoUnaSolaVez() throws Exception {
		CaptchaService servicio = new CaptchaService(true);
		CaptchaResponse captcha = servicio.generar();

		assertThat(captcha.id()).isNotBlank();
		assertThat(captcha.imagen()).startsWith("data:image/png;base64,");
		assertThat(captcha.expiraEnSegundos()).isEqualTo(120);

		String codigo = codigoGenerado(servicio, captcha.id());
		servicio.validar(captcha.id(), codigo);

		assertThatThrownBy(() -> servicio.validar(captcha.id(), codigo))
				.isInstanceOf(CaptchaInvalidoException.class);
	}

	@Test
	void rechazaUnCodigoIncorrecto() {
		CaptchaService servicio = new CaptchaService(true);
		CaptchaResponse captcha = servicio.generar();

		assertThatThrownBy(() -> servicio.validar(captcha.id(), "XXXXX"))
				.isInstanceOf(CaptchaInvalidoException.class);
	}

	@Test
	void noBloqueaElLoginCuandoEstaDesactivado() {
		CaptchaService servicio = new CaptchaService(false);

		servicio.validar(null, null);
	}

	@SuppressWarnings("unchecked")
	private String codigoGenerado(CaptchaService servicio, String id) throws Exception {
		Field campo = CaptchaService.class.getDeclaredField("desafios");
		campo.setAccessible(true);
		Map<String, Object> desafios = (Map<String, Object>) campo.get(servicio);
		Object desafio = desafios.get(id);
		Method metodo = desafio.getClass().getDeclaredMethod("codigo");
		metodo.setAccessible(true);
		return (String) metodo.invoke(desafio);
	}
}
