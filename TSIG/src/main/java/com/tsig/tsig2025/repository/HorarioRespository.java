package com.tsig.tsig2025.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tsig.tsig2025.entity.Horario;

@Repository
public interface HorarioRespository extends JpaRepository<Horario, Integer> {
}