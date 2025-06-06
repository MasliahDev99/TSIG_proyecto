package com.tsig.tsig2025.services;

import com.tsig.tsig2025.DataTypes.DtLinea;
import com.tsig.tsig2025.entity.Linea;
import com.tsig.tsig2025.entity.Parada;
import com.tsig.tsig2025.iservices.ILineaService;
import com.tsig.tsig2025.repository.LineaRepository;
import com.tsig.tsig2025.repository.ParadaRepository;

import jakarta.transaction.Transactional;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class LineaService implements ILineaService{

    private final LineaRepository lineaRepository;

    @Autowired
    private ParadaRepository paradaRepository;

    public LineaService(LineaRepository lineaRepository) {
        this.lineaRepository = lineaRepository;
    }
    
    

    public Linea editar(int id, Linea nueva) {
        Linea l = lineaRepository.findById(id).orElseThrow();
        l.setDescripcion(nueva.getDescripcion());
        l.setHorario(nueva.getHorario());
        l.setEmpresa(nueva.getEmpresa());
        l.setOrigen(nueva.getOrigen());
        l.setDestino(nueva.getDestino());
        l.setObservaciones(nueva.getObservaciones());
        l.setRecorrido(nueva.getRecorrido());
        return lineaRepository.save(l);
    }
    

    @SuppressWarnings("unchecked")
    public LineString construirLineaDesdeGeoJson(Map<String, Object> geoJsonLine) {
        GeometryFactory geometryFactory = new GeometryFactory();

        List<List<Number>> coords = (List<List<Number>>) geoJsonLine.get("coordinates");
        Coordinate[] coordinates = coords.stream()
            .map(pair -> new Coordinate(pair.get(0).doubleValue(), pair.get(1).doubleValue()))
            .toArray(Coordinate[]::new);

        LineString line = geometryFactory.createLineString(coordinates);
        line.setSRID(32721); // Sistema de referencia UTM 21S
        return line;
    }

    public Linea crearDesdeDTO(DtLinea dto) {
        Linea nueva = new Linea();

        nueva.setDescripcion(dto.getDescripcion());
        nueva.setHorario(dto.getHorario());
        nueva.setEmpresa(dto.getEmpresa());
        nueva.setOrigen(dto.getOrigen());
        nueva.setDestino(dto.getDestino());
        nueva.setObservaciones(dto.getObservaciones());

        if (dto.getRecorrido() != null && !dto.getRecorrido().isEmpty()) {
            LineString recorrido = construirLineaDesdeGeoJson(dto.getRecorrido());
            nueva.setRecorrido(recorrido);
        }

        if (dto.getParadas() != null && !dto.getParadas().isEmpty()) {
            List<Integer> idsParadas = dto.getParadas().stream()
                .map(Parada::getId)
                .toList();

            List<Parada> paradasAsociadas = paradaRepository.findAllById(idsParadas);

            // Cambiar estado a true si alguna está en false
            paradasAsociadas.forEach(parada -> {
                if (Boolean.FALSE.equals(parada.getEstado())) {
                    parada.setEstado(true);
                    paradaRepository.save(parada); // Actualizar estado
                }
            });

            nueva.setParadas(paradasAsociadas);
        }

        return lineaRepository.save(nueva);
    }


    @Override
    @Transactional
    public void eliminar(int id) {
        Linea linea = lineaRepository.findById(id).orElseThrow();

        List<Parada> paradasAsociadas = linea.getParadas();
        List<Integer> idsParadas = paradasAsociadas.stream()
            .map(Parada::getId)
            .toList();

        // Desvincular las paradas
        linea.getParadas().clear();
        lineaRepository.save(linea);

        // Eliminar la línea
        lineaRepository.deleteById(id);

        // Verificar estado real de cada parada en BD
        for (Integer paradaId : idsParadas) {
            int cantidadLineas = paradaRepository.contarLineasAsociadas(paradaId);
            if (cantidadLineas == 0) {
                Parada parada = paradaRepository.findById(paradaId).orElse(null);
                if (parada != null) {
                    parada.setEstado(false);
                    paradaRepository.save(parada);
                }
            }
        }
    }







	@Override
	public LineString construirLineaDesdeCoordenadas(List<Map<String, Object>> puntos) {
		// TODO Auto-generated method stub
		return null;
	}



}
