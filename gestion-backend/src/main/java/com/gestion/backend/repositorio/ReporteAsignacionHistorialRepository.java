package com.gestion.backend.repositorio;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.gestion.backend.modelo.ReporteAsignacionHistorial;

public interface ReporteAsignacionHistorialRepository extends JpaRepository<ReporteAsignacionHistorial, Long> {

	@EntityGraph(attributePaths = { "entidadAnterior", "entidadNueva", "usuario" })
	List<ReporteAsignacionHistorial> findByReporteIdOrderByFechaAscIdAsc(Long reporteId);
}
