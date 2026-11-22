package com.gestion.backend.correo;

import com.gestion.backend.modelo.Usuario;

public interface ServicioCorreo {

	void enviarCodigoRecuperacion(Usuario usuario, String codigo, long expiracionMinutos);
}
