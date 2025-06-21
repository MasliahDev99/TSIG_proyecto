package com.tsig.tsig2025.entity;

import jakarta.persistence.*;

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

    @Column
    private Boolean refugio;

    @Column(length = 255)
    private String observaciones;

    @Column(nullable = false, columnDefinition = "geometry(Point,32721)")
    private Point geom;
    
    @ManyToMany(mappedBy = "paradas")
    private List<Linea> lineas;

    
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

    public List<Linea> getLineas() {
		return lineas;
	}

	public void setLineas(List<Linea> lineas) {
		this.lineas = lineas;
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
