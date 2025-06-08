package com.tsig.tsig2025.DataTypes;

import java.util.List;
import java.util.Map;

import com.tsig.tsig2025.entity.Parada;

public class DtLinea {
	
    private int idLinea;

    private String descripcion;

    private String horario;
    
    private String empresa;
    
    private String origen;
    
    private String destino;
    
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
