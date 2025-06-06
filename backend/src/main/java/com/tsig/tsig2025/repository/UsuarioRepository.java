package com.tsig.tsig2025.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tsig.tsig2025.entity.UsuarioAdmin;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioAdmin, Long> {
    Optional<UsuarioAdmin> findByEmail(String email);
}
