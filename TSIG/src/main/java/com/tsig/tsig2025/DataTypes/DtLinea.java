package com.tsig.tsig2025.DataTypes;

import java.util.List;
import java.util.Map;

import com.tsig.tsig2025.entity.Parada;

import jakarta.persistence.Column;

public class DtLinea {
	
    private int idLinea;

    private String descripcion;

    private String horario;
    
    private String empresa;
    
    private String DeptoOrigen;
    
    private String DeptoDestino;
    
    private String CiudadOrigen;
    
    private String CiudadDestino;
    
    private String observaciones;

    private Map<String, Object> recorrido;

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

	public Map<String, Object> getRecorrido() {
		return recorrido;
	}

	public void setRecorrido(Map<String, Object> recorrido) {
		this.recorrido = recorrido;
	}

	public List<Parada> getParadas() {
		return paradas;
	}

	public void setParadas(List<Parada> paradas) {
		this.paradas = paradas;
	}



}
