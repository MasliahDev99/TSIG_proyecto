package com.tsig.tsig2025.entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.LineString;
import java.util.*;

@Entity
public class Linea {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idLinea;

    @Column(length = 255)
    private String descripcion;
    
    @Column(length = 255)
    private String horario;
    
    @Column(length = 255)
    private String empresa;
    
    @Column(length = 255)
    private String origen;
    
    @Column(length = 255)
    private String destino;
    
    private String observaciones;

    @Column(columnDefinition = "geometry(LineString,32721)")
    private LineString recorrido;

    @ManyToMany
    @JoinTable(
        name = "linea_parada",
        joinColumns = @JoinColumn(name = "linea_id"),
        inverseJoinColumns = @JoinColumn(name = "parada_id")
    )
    private List<Parada> paradas;

    public int getIdLinea() {
        return idLinea;
    }

    public void setIdLinea(int idLinea) {
        this.idLinea = idLinea;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getHorario() {
        return horario;
    }

    public void setHorario(String horario) {
        this.horario = horario;
    }

    public String getEmpresa() {
        return empresa;
    }

    public void setEmpresa(String empresa) {
        this.empresa = empresa;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public LineString getRecorrido() {
        return recorrido;
    }

    public void setRecorrido(LineString recorrido) {
        this.recorrido = recorrido;
    }

    public List<Parada> getParadas() {
        return paradas;
    }

    public void setParadas(List<Parada> paradas) {
        this.paradas = paradas;
    }
}