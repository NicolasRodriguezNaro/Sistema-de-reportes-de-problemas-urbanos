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
@Table(name = "reporte_historial")
public class ReporteHistorial {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "reporte_id", nullable = false)
	private Reporte reporte;

	@Enumerated(EnumType.STRING)
	@Column(name = "estado_anterior", length = 50)
	private EstadoReporte estadoAnterior;

	@Enumerated(EnumType.STRING)
	@Column(name = "estado_nuevo", nullable = false, length = 50)
	private EstadoReporte estadoNuevo;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Enumerated(EnumType.STRING)
	@Column(length = 50)
	private MotivoRechazo motivo;

	@Column(columnDefinition = "TEXT")
	private String detalle;

	@Column(name = "motivo_reapertura", columnDefinition = "TEXT")
	private String motivoReapertura;

	@Column(nullable = false)
	private Instant fecha;

	@PrePersist
	void antesDeInsertar() {
		if (fecha == null) {
			fecha = Instant.now();
		}
	}
}
