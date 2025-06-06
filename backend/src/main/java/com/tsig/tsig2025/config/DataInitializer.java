package com.tsig.tsig2025.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.tsig.tsig2025.entity.UsuarioAdmin;
import com.tsig.tsig2025.repository.UsuarioRepository;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initAdmin(UsuarioRepository adminRepo, PasswordEncoder passwordEncoder) {
        return args -> {
            String email = "francorro02@gmail.com";
            String nombre = "Franco Pirotto";
            String rawPassword = "holaloco";

            // Solo si no existe ya
            if (adminRepo.findByEmail(email).isEmpty()) {
                UsuarioAdmin admin = new UsuarioAdmin();
                admin.setEmail(email);
                admin.setNombre(nombre);
                admin.setPassword(passwordEncoder.encode(rawPassword));

                adminRepo.save(admin);
                System.out.println("✅ Admin creado con éxito: " + email);
            } else {
                System.out.println("ℹ️ Admin ya existe: " + email);
            }
        };
    }
}
