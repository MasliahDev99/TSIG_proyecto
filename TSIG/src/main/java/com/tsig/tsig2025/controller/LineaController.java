package com.tsig.tsig2025.controller;

import com.tsig.tsig2025.DataTypes.DtLinea;
import com.tsig.tsig2025.DataTypes.RouteRequest;
import com.tsig.tsig2025.DataTypes.RouteResponse;
import com.tsig.tsig2025.entity.Linea;
import com.tsig.tsig2025.iservices.ILineaService;

import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lineas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LineaController {

    @Autowired
    private ILineaService IlineaService;
    
    @PostMapping("/crear")
    public ResponseEntity<DtLinea> crearLinea(@RequestBody DtLinea lineaDTO) {
        try {
            Linea nuevaLinea = IlineaService.crearDesdeDTO(lineaDTO);
            return new ResponseEntity<>(lineaDTO, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<?> eliminarLinea(@PathVariable int id) {
        try {
            IlineaService.eliminar(id);
            return ResponseEntity.ok().body("Línea eliminada correctamente");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error al eliminar la línea");
        }
    }
    
    
    @GetMapping("/{id}/paradas")
    public ResponseEntity<?> obtenerParadasPorLinea(@PathVariable int id) {
        try {
            return ResponseEntity.ok(IlineaService.obtenerParadasDeLinea(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                 .body("Línea no encontrada");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error al obtener las paradas");
        }
    }

    

}

