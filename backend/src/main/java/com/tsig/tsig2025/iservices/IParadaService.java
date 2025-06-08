package com.tsig.tsig2025.iservices;

import com.tsig.tsig2025.DataTypes.DtParada;

public interface IParadaService {
    DtParada crearParada(DtParada parada);
    boolean eliminarParada(int id);
    public DtParada editarParada(int id, DtParada parada);
}
