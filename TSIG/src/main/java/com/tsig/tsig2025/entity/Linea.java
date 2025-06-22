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
    private String DeptoOrigen;
    
    @Column(length = 255)
    private String DeptoDestino;
    
    @Column(length = 255)
    private String CiudadOrigen;
    
    @Column(length = 255)
    private String CiudadDestino;
    
    private String observaciones;

    @Column(columnDefinition = "geometry(LineString,32721)")
    private LineString recorrido;

    @OneToMany(mappedBy = "linea", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LineaParada> paradasAsociadas = new ArrayList<>();

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

    public String getDeptoOrigen() {
		return DeptoOrigen;
	}

	public void setDeptoOrigen(String deptoOrigen) {
		DeptoOrigen = deptoOrigen;
	}

	public String getDeptoDestino() {
		return DeptoDestino;
	}

	public void setDeptoDestino(String deptoDestino) {
		DeptoDestino = deptoDestino;
	}

	public String getCiudadOrigen() {
		return CiudadOrigen;
	}

	public void setCiudadOrigen(String cidudadOrigen) {
		CiudadOrigen = cidudadOrigen;
	}

	public String getCiudadDestino() {
		return CiudadDestino;
	}

	public void setCiudadDestino(String ciudadDestino) {
		CiudadDestino = ciudadDestino;
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

}