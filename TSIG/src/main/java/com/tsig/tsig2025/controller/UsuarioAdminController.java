package com.tsig.tsig2025.controller;

import com.tsig.tsig2025.entity.UsuarioAdmin;
import com.tsig.tsig2025.iservices.IUsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UsuarioAdminController {

    @Autowired
    private IUsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        Optional<UsuarioAdmin> userOpt = usuarioService.login(email, password);

        if (userOpt.isPresent()) {
            UsuarioAdmin user = userOpt.get();
            return ResponseEntity.ok().body(Map.of(
                "success", true,
                "message", "Login exitoso",
                "user", Map.of("id", user.getId(), "nombre", user.getNombre())
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "success", false,
            "message", "Credenciales inválidas"
        ));
    }
}
