package co.edu.itm.calendario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Objects;

/**
 * Entidad que representa la clasificación de un día en el calendario.
 * Valores definidos por el taller ITM:
 * 1: Día laboral
 * 2: Fin de Semana
 * 3: Día festivo
 */
@Entity
@Table(name = "tipo")
public class Tipo {

    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    public Tipo() {
    }

    public Tipo(Integer id, String tipo) {
        this.id = id;
        this.tipo = tipo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tipo tipo1 = (Tipo) o;
        return Objects.equals(id, tipo1.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Tipo{" +
                "id=" + id +
                ", tipo='" + tipo + '\'' +
                '}';
    }
}
