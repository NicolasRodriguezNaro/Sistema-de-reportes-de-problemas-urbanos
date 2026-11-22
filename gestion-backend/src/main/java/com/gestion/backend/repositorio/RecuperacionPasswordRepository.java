package com.gestion.backend.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gestion.backend.modelo.RecuperacionPassword;

public interface RecuperacionPasswordRepository extends JpaRepository<RecuperacionPassword, Long> {

	List<RecuperacionPassword> findByUsuarioIdAndUsadoFalse(Long usuarioId);

	Optional<RecuperacionPassword> findFirstByUsuarioIdAndUsadoFalseOrderByFechaCreacionDesc(Long usuarioId);
}
