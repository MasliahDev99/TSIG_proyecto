package com.tsig.tsig2025.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tsig.tsig2025.entity.Linea;

@Repository
public interface LineaRepository extends JpaRepository<Linea, Integer> {
}