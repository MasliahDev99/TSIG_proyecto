package com.tsig.tsig2025.services;

import org.springframework.stereotype.Service;

import com.tsig.tsig2025.entity.Horario;
import com.tsig.tsig2025.repository.HorarioRespository;

import java.util.List;

@Service
public class HorarioService {
    private final HorarioRespository horarioRepository;

    public HorarioService(HorarioRespository horarioRepository) {
        this.horarioRepository = horarioRepository;
    }

    public List<Horario> listarTodos() {
        return horarioRepository.findAll();
    }

    public Horario guardar(Horario horario) {
        return horarioRepository.save(horario);
    }

    public void eliminar(int id) {
        horarioRepository.deleteById(id);
    }
}