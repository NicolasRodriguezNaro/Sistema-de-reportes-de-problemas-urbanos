package com.gestion.backend.ia;

import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;

public record ResultadoClasificacion(
		boolean esIncidencia,
		TipoIncidencia categoria,
		Severidad severidad,
		double confianza,
		String descripcionBorrador) {
}
