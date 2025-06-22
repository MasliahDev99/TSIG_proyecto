package com.tsig.tsig2025.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tsig.tsig2025.entity.LineaParada;
import com.tsig.tsig2025.services.LineaParadaId;

@Repository
public interface LineaParadaRepository extends JpaRepository<LineaParada, LineaParadaId> {

    int countByParada_Id(int paradaId);

    List<LineaParada> findByLinea_IdLinea(int idLinea);

    List<LineaParada> findByParada_Id(Integer paradaId);

    @Query("""
        SELECT COUNT(lp) FROM LineaParada lp
        WHERE lp.parada.id = :paradaId
        AND lp.linea.idLinea <> :lineaExcluida
        AND lp.es_punta = true
    """)
    int contarPuntasEnOtrasLineas(@Param("paradaId") Integer paradaId, @Param("lineaExcluida") Integer lineaExcluida);

    default boolean esPuntaEnOtraLinea(Integer paradaId, Integer lineaExcluida) {
        return contarPuntasEnOtrasLineas(paradaId, lineaExcluida) > 0;
    }

    boolean existsByParada_Id(Integer paradaId);
}
