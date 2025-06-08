package com.tsig.tsig2025.controller;

import com.tsig.tsig2025.DataTypes.DtParada;
import com.tsig.tsig2025.iservices.IParadaService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paradas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ParadaController {

    @Autowired
    private IParadaService paradaService;

    @PostMapping("/crear")
    public ResponseEntity<DtParada> crearParada(@RequestBody DtParada parada) {
        System.out.println("🌍 Latitud recibida: " + parada.getLatitud());
        System.out.println("🌐 Longitud recibida: " + parada.getLongitud());

        if (parada.getLatitud() == null || parada.getLongitud() == null) {
            throw new IllegalArgumentException("Latitud y Longitud son obligatorias para crear la geometría");
        }
        if(parada.getEstado() == null)
            parada.setEstado(true);

        DtParada nueva = paradaService.crearParada(parada);
        return ResponseEntity.ok(nueva);
    }


    @DeleteMapping("eliminar/{id}")
    public ResponseEntity<Void> eliminarParada(@PathVariable int id) {
        boolean eliminada = paradaService.eliminarParada(id);
        return eliminada ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
    
    @PutMapping("/editar/{id}")
    public ResponseEntity<?> editarParada(@PathVariable int id, @RequestBody DtParada parada) {
        System.out.println("✏️ [EDITAR PARADA] ID recibido: " + id);
        System.out.println("📦 Datos recibidos:");
        System.out.println("   📍 Nombre: " + parada.getNombre());
        System.out.println("   📍 Ruta: " + parada.getRuta());
        System.out.println("   📍 Departamento: " + parada.getDepartamento());
        System.out.println("   📍 Sentido: " + parada.getSentido());
        System.out.println("   📍 Estado: " + parada.getEstado());
        System.out.println("   📍 Refugio: " + parada.getRefugio());
        System.out.println("   📍 Observaciones: " + parada.getObservaciones());
        System.out.println("   🌍 Coordenadas: X=" + parada.getLongitud() + " | Y=" + parada.getLatitud());

        try {
            DtParada actualizada = paradaService.editarParada(id, parada);
            if (actualizada != null) {
                System.out.println("✅ Parada editada exitosamente.");
                return ResponseEntity.ok(actualizada);
            } else {
                System.out.println("❌ Latitud y longitud faltantes.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Latitud y longitud son requeridas.");
            }
        } catch (EntityNotFoundException e) {
            System.out.println("⚠️ Parada no encontrada: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("🔥 Error al editar la parada: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al editar la parada.");
        }
    }



}
