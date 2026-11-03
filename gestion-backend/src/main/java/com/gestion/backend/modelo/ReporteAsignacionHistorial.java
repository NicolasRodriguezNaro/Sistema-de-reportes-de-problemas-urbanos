package com.gestion.backend.modelo;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "reporte_asignacion_historial")
public class ReporteAsignacionHistorial {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "reporte_id", nullable = false)
	private Reporte reporte;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "entidad_anterior_id")
	private Entidad entidadAnterior;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "entidad_nueva_id", nullable = false)
	private Entidad entidadNueva;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "usuario_id")
	private Usuario usuario;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private OrigenAsignacion origen;

	@Column(columnDefinition = "TEXT")
	private String motivo;

	@Column(nullable = false)
	private Instant fecha;

	@PrePersist
	void antesDeInsertar() {
		if (fecha == null) {
			fecha = Instant.now();
		}
	}
}
