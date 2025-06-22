package com.tsig.tsig2025.services;

import com.tsig.tsig2025.entity.UsuarioAdmin;
import com.tsig.tsig2025.iservices.IUsuarioService;
import com.tsig.tsig2025.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService implements IUsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<UsuarioAdmin> login(String email, String password) {
        Optional<UsuarioAdmin> userOpt = usuarioRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            UsuarioAdmin user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}
