package com.gestion.backend.modelo;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "recuperaciones_password")
public class RecuperacionPassword {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@Column(name = "codigo_hash", nullable = false, length = 255)
	private String codigoHash;

	@Column(name = "fecha_creacion", nullable = false)
	private Instant fechaCreacion;

	@Column(nullable = false)
	private Instant expira;

	@Column(nullable = false)
	private boolean usado;

	@Column(nullable = false)
	private int intentos;

	@Column(name = "fecha_uso")
	private Instant fechaUso;
}
