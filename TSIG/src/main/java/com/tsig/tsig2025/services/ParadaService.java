package com.tsig.tsig2025.services;

import com.tsig.tsig2025.DataTypes.DtParada;
import com.tsig.tsig2025.entity.Linea;
import com.tsig.tsig2025.entity.Parada;
import com.tsig.tsig2025.iservices.IParadaService;
import com.tsig.tsig2025.repository.LineaRepository;
import com.tsig.tsig2025.repository.ParadaRepository;

import jakarta.persistence.EntityNotFoundException;

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Coordinate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ParadaService implements IParadaService {

    @Autowired
    private ParadaRepository paradaRepository;
    
    @Autowired
    private LineaRepository lineaRepository; 

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 32721);


    @Override
    public DtParada crearParada(DtParada paradaDto) {
        Parada parada = new Parada();
        parada.setNombre(paradaDto.getNombre());
        parada.setRuta(paradaDto.getRuta());
        parada.setDepartamento(paradaDto.getDepartamento());
        parada.setCiudad(paradaDto.getCiudad());
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
    public DtParada editarParada(int id, DtParada paradaDto) {
        Parada existente = paradaRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "Parada no encontrada con id: " + id));

        // 1) Actualizo atributos no geométricos
        existente.setNombre(paradaDto.getNombre());
        existente.setRuta(paradaDto.getRuta());
        existente.setDepartamento(paradaDto.getDepartamento());
        existente.setCiudad(paradaDto.getCiudad());
        existente.setSentido(paradaDto.getSentido());
        existente.setRefugio(paradaDto.getRefugio());
        existente.setObservaciones(paradaDto.getObservaciones());
        // NOTA: no seteamos aquí el estado; lo calcularemos abajo

        // 2) Si recibimos coordenadas, actualizo geometría y reviso distancias
        if (paradaDto.getLatitud() != null && paradaDto.getLongitud() != null) {
            Point nuevoPunto = geometryFactory.createPoint(
                new Coordinate(
                    paradaDto.getLongitud(),
                    paradaDto.getLatitud()
                )
            );
            existente.setGeom(nuevoPunto);

            // 3) Itero sobre una copia de las líneas para poder eliminar de la original
            List<Linea> lineasIniciales = new ArrayList<>(existente.getLineas());
            for (Linea linea : lineasIniciales) {
                LineString recorrido = linea.getRecorrido();
                if (recorrido != null) {
                    double distancia = nuevoPunto.distance(recorrido);
                    if (distancia > 25.0) {
                        // 3a) desvincular de ambos lados
                        existente.getLineas().remove(linea);
                        linea.getParadas().remove(existente);
                        lineaRepository.save(linea);
                    }
                }
            }
        }

        // 4) Si ya no queda ninguna línea asociada, desactivo la parada
        if (existente.getLineas().isEmpty()) {
            existente.setEstado(false);
        } else {
            existente.setEstado(true);
        }

        // 5) Guardo la parada actualizada
        paradaRepository.save(existente);

        // 6) Actualizo el DTO de retorno
        paradaDto.setId(existente.getId());
        paradaDto.setEstado(existente.getEstado());
        return paradaDto;
    }
}
	
