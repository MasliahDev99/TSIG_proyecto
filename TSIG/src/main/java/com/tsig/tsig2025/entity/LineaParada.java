package com.tsig.tsig2025.entity;

import com.tsig.tsig2025.services.LineaParadaId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "linea_parada")
@IdClass(LineaParadaId.class)
public class LineaParada {

    @Id
    @ManyToOne
    @JoinColumn(name = "linea_id")
    private Linea linea;

    @Id
    @ManyToOne
    @JoinColumn(name = "parada_id")
    private Parada parada;

    @Column(nullable = false)
    private boolean es_punta;

    public Linea getLinea() {
        return linea;
    }

    public void setLinea(Linea linea) {
        this.linea = linea;
    }

    public Parada getParada() {
        return parada;
    }

    public void setParada(Parada parada) {
        this.parada = parada;
    }

    public boolean isEs_punta() {
        return es_punta;
    }

    public void setEs_punta(boolean es_punta) {
        this.es_punta = es_punta;
    }
}
