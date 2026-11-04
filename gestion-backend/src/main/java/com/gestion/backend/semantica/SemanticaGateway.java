package com.gestion.backend.semantica;

import java.util.List;

import com.gestion.backend.modelo.PrioridadCalculada;
import com.gestion.backend.modelo.Severidad;
import com.gestion.backend.modelo.TipoIncidencia;

public interface SemanticaGateway {

	void sincronizarEstaticos(List<GrafoSemantico.EntidadRef> entidades,
			List<GrafoSemantico.SitioRef> sitios);

	void escribirReporte(Long reporteId, TipoIncidencia categoria, Severidad severidad, Double confianza,
			SitioCercano sitio);

	InferenciasGrafo inferir(Long reporteId);

	void materializar(Long reporteId, PrioridadCalculada prioridad, Integer entidadId);
}
