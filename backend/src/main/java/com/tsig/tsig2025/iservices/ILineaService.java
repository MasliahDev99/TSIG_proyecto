package com.tsig.tsig2025.iservices;

import java.util.List;
import java.util.Map;

import org.locationtech.jts.geom.LineString;

import com.tsig.tsig2025.DataTypes.DtLinea;
import com.tsig.tsig2025.entity.Linea;

public interface ILineaService {
    Linea crearDesdeDTO(DtLinea dto);
    Linea editar(int id, Linea nueva);
    void eliminar(int id);
    public LineString construirLineaDesdeCoordenadas(List<Map<String, Object>> puntos);

}
