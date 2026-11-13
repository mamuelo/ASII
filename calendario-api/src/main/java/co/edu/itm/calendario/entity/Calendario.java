package co.edu.itm.calendario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Entidad que representa un día específico del calendario anual.
 */
@Entity
@Table(
        name = "calendario",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_calendario_fecha", columnNames = {"fecha"})
        }
)
public class Calendario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "fecha", nullable = false, unique = true)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_tipo", nullable = false)
    private Tipo tipo;

    @Column(name = "descripcion", nullable = false, length = 50)
    private String descripcion;

    public Calendario() {
    }

    public Calendario(LocalDate fecha, Tipo tipo, String descripcion) {
        this.fecha = fecha;
        this.tipo = tipo;
        this.descripcion = descripcion;
    }

    public Calendario(Long id, LocalDate fecha, Tipo tipo, String descripcion) {
        this.id = id;
        this.fecha = fecha;
        this.tipo = tipo;
        this.descripcion = descripcion;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public void setTipo(Tipo tipo) {
        this.tipo = tipo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Calendario that = (Calendario) o;
        return Objects.equals(fecha, that.fecha);
    }

    @Override
    public int hashCode() {
        return Objects.hash(fecha);
    }

    @Override
    public String toString() {
        return "Calendario{" +
                "id=" + id +
                ", fecha=" + fecha +
                ", tipo=" + (tipo != null ? tipo.getTipo() : null) +
                ", descripcion='" + descripcion + '\'' +
                '}';
    }
}
