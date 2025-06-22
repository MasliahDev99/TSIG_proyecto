package com.tsig.tsig2025.DataTypes;

import jakarta.persistence.Column;

public class DtParada {

    private int id;

    private String nombre;

    private String ruta;

    private String departamento;
    
    private String ciudad;

    public String getCiudad() {
		return ciudad;
	}
    
    private Boolean habilitada;
    
    private Boolean no_modificable;


	public void setCiudad(String ciudad) {
		this.ciudad = ciudad;
	}

	private String sentido;

    private Boolean estado;

    private Boolean refugio;

    private String observaciones;

    private Double latitud;

    private Double longitud;

    // === Getters y Setters ===
    
    public DtParada(int id, String nombre, String ruta, String departamento, String sentido,
            Boolean estado, Boolean refugio, String observaciones, 
            Double latitud, Double longitud) {
this.id = id;
this.nombre = nombre;
this.ruta = ruta;
this.departamento = departamento;
this.sentido = sentido;
this.estado = estado;
this.refugio = refugio;
this.observaciones = observaciones;
this.latitud = latitud;
this.longitud = longitud;
}


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
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

    public Boolean getHabilitada() {
		return habilitada;
	}


	public void setHabilitada(Boolean habilitada) {
		this.habilitada = habilitada;
	}


	public Boolean getNo_modificable() {
		return no_modificable;
	}


	public void setNo_modificable(Boolean no_modificable) {
		this.no_modificable = no_modificable;
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

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
}
