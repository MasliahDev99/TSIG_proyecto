package com.tsig.tsig2025.services;

import com.tsig.tsig2025.DataTypes.DtLinea;
import com.tsig.tsig2025.entity.Linea;
import com.tsig.tsig2025.entity.LineaParada;
import com.tsig.tsig2025.entity.Parada;
import com.tsig.tsig2025.iservices.ILineaService;
import com.tsig.tsig2025.repository.LineaParadaRepository;
import com.tsig.tsig2025.repository.LineaRepository;
import com.tsig.tsig2025.repository.ParadaRepository;

import jakarta.transaction.Transactional;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
public class LineaService implements ILineaService{

    private final LineaRepository lineaRepository;

    @Autowired
    private ParadaRepository paradaRepository;
    
    @Autowired
    private LineaParadaRepository lineaParadaRepository;

    public LineaService(LineaRepository lineaRepository) {
        this.lineaRepository = lineaRepository;
    }
    
    

    public Linea editar(int id, Linea nueva) {
        Linea l = lineaRepository.findById(id).orElseThrow();
        l.setDescripcion(nueva.getDescripcion());
        l.setHorario(nueva.getHorario());
        l.setEmpresa(nueva.getEmpresa());
        l.setDeptoOrigen(nueva.getDeptoOrigen());
        l.setDeptoDestino(nueva.getDeptoDestino());
        l.setCiudadOrigen(nueva.getCiudadOrigen());
        l.setCiudadDestino(nueva.getCiudadDestino());
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
        nueva.setDeptoOrigen(dto.getDeptoOrigen());
        nueva.setDeptoDestino(dto.getDeptoDestino());
        nueva.setCiudadOrigen(dto.getCiudadOrigen());
        nueva.setCiudadDestino(dto.getCiudadDestino());
        nueva.setObservaciones(dto.getObservaciones());

        if (dto.getRecorrido() != null && !dto.getRecorrido().isEmpty()) {
            LineString recorrido = construirLineaDesdeGeoJson(dto.getRecorrido());
            nueva.setRecorrido(recorrido);
        }

        Linea lineaGuardada = lineaRepository.save(nueva);

        if (dto.getParadas() != null && !dto.getParadas().isEmpty()) {
            List<Parada> paradas = dto.getParadas();
            for (int i = 0; i < paradas.size(); i++) {
                Parada parada = paradaRepository.findById(paradas.get(i).getId()).orElseThrow();
                LineaParada lp = new LineaParada();
                lp.setLinea(lineaGuardada);
                lp.setParada(parada);
                lp.setEs_punta(i == 0 || i == paradas.size() - 1);

                parada.setNo_modificable(true);
                if (!parada.getEstado()) {
                    parada.setEstado(true);
                    paradaRepository.save(parada);
                }

                lineaParadaRepository.save(lp);
            }
        }

        return lineaGuardada;
    }


    @Override
    @Transactional
    public void eliminar(int id) {
        Linea linea = lineaRepository.findById(id).orElseThrow();

        List<LineaParada> asociaciones = lineaParadaRepository.findByLinea_IdLinea(id);
        List<Integer> idsParadas = asociaciones.stream()
            .map(lp -> lp.getParada().getId())
            .toList();

        lineaParadaRepository.deleteAll(asociaciones);
        lineaRepository.delete(linea);

        for (LineaParada lp : asociaciones) {
            Parada parada = lp.getParada();

            int cantidadLineas = lineaParadaRepository.countByParada_Id(parada.getId());
            if (cantidadLineas == 0) {
                parada.setEstado(false);
                parada.setNo_modificable(false);
            } else if (lp.isEs_punta()) {
                boolean sigueSiendoPunta = lineaParadaRepository.esPuntaEnOtraLinea(parada.getId(), id);
                if (!sigueSiendoPunta) {
                    parada.setNo_modificable(false);
                }
            }

            paradaRepository.save(parada);
        }
    }



    
    @Override
    public List<Parada> obtenerParadasDeLinea(int idLinea) {
        List<LineaParada> asociaciones = lineaParadaRepository.findByLinea_IdLinea(idLinea);
        return asociaciones.stream()
            .map(LineaParada::getParada)
            .toList();
    }








	@Override
	public LineString construirLineaDesdeCoordenadas(List<Map<String, Object>> puntos) {
		// TODO Auto-generated method stub
		return null;
	}
	
	
	
	



}
