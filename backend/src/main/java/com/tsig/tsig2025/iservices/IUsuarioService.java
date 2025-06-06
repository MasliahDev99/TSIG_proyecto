package com.tsig.tsig2025.iservices;

import java.util.Optional;

import com.tsig.tsig2025.entity.UsuarioAdmin;

public interface  IUsuarioService {
	 public Optional<UsuarioAdmin> login(String email, String password);
}
