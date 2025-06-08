package com.tsig.tsig2025.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tsig.tsig2025.entity.Parada;

public interface ParadaRepository extends JpaRepository<Parada, Integer> {
	@Query("SELECT COUNT(l) FROM Linea l JOIN l.paradas p WHERE p.id = :paradaId")
	int contarLineasAsociadas(@Param("paradaId") int paradaId);
}