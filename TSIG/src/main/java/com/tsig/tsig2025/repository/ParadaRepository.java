package com.tsig.tsig2025.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tsig.tsig2025.entity.Parada;

@Repository
public interface ParadaRepository extends JpaRepository<Parada, Integer> {
}