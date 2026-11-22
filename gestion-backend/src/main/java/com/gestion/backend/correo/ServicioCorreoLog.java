package com.gestion.backend.correo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.gestion.backend.modelo.Usuario;

@Service
@ConditionalOnProperty(name = "gestion.correo.proveedor", havingValue = "log", matchIfMissing = true)
public class ServicioCorreoLog implements ServicioCorreo {

	private static final Logger log = LoggerFactory.getLogger(ServicioCorreoLog.class);

	@Override
	public void enviarCodigoRecuperacion(Usuario usuario, String codigo, long expiracionMinutos) {
		log.warn("CORREO EN MODO LOG. Código de recuperación para {}: {} (vence en {} minutos)",
				usuario.getEmail(), codigo, expiracionMinutos);
	}
}
