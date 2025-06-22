package com.tsig.tsig2025.services;

import com.tsig.tsig2025.DataTypes.DtParada;
import com.tsig.tsig2025.entity.Linea;
import com.tsig.tsig2025.entity.LineaParada;
import com.tsig.tsig2025.entity.Parada;
import com.tsig.tsig2025.iservices.IParadaService;
import com.tsig.tsig2025.repository.LineaParadaRepository;
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
    
    @Autowired
    private LineaParadaRepository lineaParadaRepository;

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

            // Eliminar asociaciones en tabla intermedia
            List<LineaParada> vinculaciones = lineaParadaRepository.findByParada_Id(id);
            lineaParadaRepository.deleteAll(vinculaciones);

            paradaRepository.delete(parada);
            return true;
        }
        return false;
    }


    
    @Override
    public DtParada editarParada(int id, DtParada paradaDto) {
        Parada existente = paradaRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Parada no encontrada con id: " + id));

        existente.setNombre(paradaDto.getNombre());
        existente.setRuta(paradaDto.getRuta());
        existente.setDepartamento(paradaDto.getDepartamento());
        existente.setCiudad(paradaDto.getCiudad());
        existente.setSentido(paradaDto.getSentido());
        existente.setRefugio(paradaDto.getRefugio());
        existente.setObservaciones(paradaDto.getObservaciones());
        existente.setHabilitada(paradaDto.getHabilitada());

        if (paradaDto.getLatitud() != null && paradaDto.getLongitud() != null) {
            Point nuevoPunto = geometryFactory.createPoint(
                new Coordinate(paradaDto.getLongitud(), paradaDto.getLatitud())
            );
            existente.setGeom(nuevoPunto);

            // Revisar distancia con cada línea relacionada
            List<LineaParada> relaciones = lineaParadaRepository.findByParada_Id(id);
            for (LineaParada lp : new ArrayList<>(relaciones)) {
                Linea linea = lp.getLinea();
                LineString recorrido = linea.getRecorrido();
                if (recorrido != null && nuevoPunto.distance(recorrido) > 25.0) {
                    lineaParadaRepository.delete(lp);
                }
            }
        }

        // Verificar si aún tiene líneas
        boolean tieneLineas = lineaParadaRepository.existsByParada_Id(id);
        existente.setEstado(tieneLineas);

        paradaRepository.save(existente);
        paradaDto.setId(existente.getId());
        paradaDto.setEstado(existente.getEstado());
        return paradaDto;
    }

}
	
