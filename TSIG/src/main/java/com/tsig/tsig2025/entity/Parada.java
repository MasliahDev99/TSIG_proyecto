package com.tsig.tsig2025.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "parada")
public class Parada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 255)
    private String nombre;

    @Column(length = 255)
    private String ruta;

    @Column(length = 255)
    private String departamento;
    
    @Column(length = 255)
    private String ciudad;
    
    public String getCiudad() {
		return ciudad;
	}

	public void setCiudad(String ciudad) {
		this.ciudad = ciudad;
	}

	@Column(length = 255)
    private String sentido;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean estado = true;
    
    @Column(nullable = false)
    private Boolean habilitada = true;
    
    @Column(nullable = false)
    private Boolean no_modificable = false;

    @Column
    private Boolean refugio;

    @Column(length = 255)
    private String observaciones;

    @Column(nullable = false, columnDefinition = "geometry(Point,32721)")
    private Point geom;
    
    @OneToMany(mappedBy = "parada", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LineaParada> lineasAsociadas = new ArrayList<>();

    
    public Parada() {
        this.estado = false;
    }
    // === Getters y Setters ===

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

	public Boolean getHabilitada() {
		return habilitada;
	}

	public void setHabilitada(Boolean habilitada) {
		this.habilitada = habilitada;
	}

	public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRuta() {
        return ruta;
    }

    public void setRuta(String ruta) {
        this.ruta = ruta;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getSentido() {
        return sentido;
    }

    public void setSentido(String sentido) {
        this.sentido = sentido;
    }

    public Boolean getNo_modificable() {
		return no_modificable;
	}

	public void setNo_modificable(Boolean no_modificable) {
		this.no_modificable = no_modificable;
	}

	public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }

    public Boolean getRefugio() {
        return refugio;
    }

    public void setRefugio(Boolean refugio) {
        this.refugio = refugio;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Point getGeom() {
        return geom;
    }

    public void setGeom(Point geom) {
        this.geom = geom;
    }
}
