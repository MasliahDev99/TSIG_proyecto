package com.tsig.tsig2025.services;

import com.tsig.tsig2025.DataTypes.DtParada;
import com.tsig.tsig2025.entity.Parada;
import com.tsig.tsig2025.iservices.IParadaService;
import com.tsig.tsig2025.repository.ParadaRepository;

import jakarta.persistence.EntityNotFoundException;

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.geom.Coordinate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ParadaService implements IParadaService {

    @Autowired
    private ParadaRepository paradaRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 32721);


    @Override
    public DtParada crearParada(DtParada paradaDto) {
        Parada parada = new Parada();
        parada.setNombre(paradaDto.getNombre());
        parada.setRuta(paradaDto.getRuta());
        parada.setDepartamento(paradaDto.getDepartamento());
        parada.setSentido(paradaDto.getSentido());
        parada.setEstado(false);
        parada.setRefugio(paradaDto.getRefugio());
        parada.setObservaciones(paradaDto.getObservaciones());

        // Crear el Point geométrico con lat y lon
        if (paradaDto.getLatitud() != null && paradaDto.getLongitud() != null) {
        	Point punto = geometryFactory.createPoint(
        		    new Coordinate(paradaDto.getLongitud(), paradaDto.getLatitud())
        		);
        		parada.setGeom(punto);

        }
        
        parada = paradaRepository.save(parada);


        paradaDto.setId(parada.getId()); // asignar ID generado
        return paradaDto;
    }

    @Override
    public boolean eliminarParada(int id) {
        if (paradaRepository.existsById(id)) {
            Parada parada = paradaRepository.findById(id).orElseThrow();

            // Desvincular de las líneas
            if (parada.getLineas() != null) {
                parada.getLineas().forEach(linea -> linea.getParadas().remove(parada));
                parada.getLineas().clear();
            }

            paradaRepository.delete(parada);
            return true;
        }
        return false;
    }

    
    @Override
    public DtParada editarParada(int id, DtParada parada) {
        Parada existente = paradaRepository.findById(id).orElseThrow(() ->
            new EntityNotFoundException("Parada no encontrada con id: " + id)
        );

        existente.setNombre(parada.getNombre());
        existente.setRuta(parada.getRuta());
        existente.setDepartamento(parada.getDepartamento());
        existente.setSentido(parada.getSentido());
        existente.setEstado(parada.getEstado());
        existente.setRefugio(parada.getRefugio());
        existente.setObservaciones(parada.getObservaciones());

        if (parada.getLatitud() != null && parada.getLongitud() != null) {
            Point punto = geometryFactory.createPoint(
                new Coordinate(parada.getLongitud(), parada.getLatitud())
            );
            existente.setGeom(punto);
        }

        paradaRepository.save(existente);
        parada.setId(existente.getId());

        return parada;
    }

}
	
