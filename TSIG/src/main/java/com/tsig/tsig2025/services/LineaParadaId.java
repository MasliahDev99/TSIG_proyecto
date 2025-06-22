package com.tsig.tsig2025.services;

import java.io.Serializable;
import java.util.Objects;

public class LineaParadaId implements Serializable {
    private Integer linea;
    private Integer parada;

    public LineaParadaId() {}

    public LineaParadaId(Integer linea, Integer parada) {
        this.linea = linea;
        this.parada = parada;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LineaParadaId that)) return false;
        return Objects.equals(linea, that.linea) && Objects.equals(parada, that.parada);
    }

    @Override
    public int hashCode() {
        return Objects.hash(linea, parada);
    }
}
