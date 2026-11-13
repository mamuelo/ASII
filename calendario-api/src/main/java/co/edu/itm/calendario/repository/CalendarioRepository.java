package co.edu.itm.calendario.repository;

import co.edu.itm.calendario.entity.Calendario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendarioRepository extends JpaRepository<Calendario, Long> {

    /**
     * Consulta los registros de calendario en un rango de fechas ordenados cronológicamente.
     */
    List<Calendario> findByFechaBetweenOrderByFechaAsc(LocalDate fechaInicio, LocalDate fechaFin);

    /**
     * Elimina registros de calendario dentro de un rango de fechas.
     */
    @Modifying
    void deleteByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);

    /**
     * Comprueba si existen registros para un rango de fechas.
     */
    boolean existsByFechaBetween(LocalDate fechaInicio, LocalDate fechaFin);
}
