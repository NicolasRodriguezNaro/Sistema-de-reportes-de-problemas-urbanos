package com.gestion.backend.repositorio;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.gestion.backend.modelo.ReporteHistorial;

public interface ReporteHistorialRepository extends JpaRepository<ReporteHistorial, Long> {

	@EntityGraph(attributePaths = { "usuario" })
	List<ReporteHistorial> findByReporteIdOrderByFechaAscIdAsc(Long reporteId);
}
