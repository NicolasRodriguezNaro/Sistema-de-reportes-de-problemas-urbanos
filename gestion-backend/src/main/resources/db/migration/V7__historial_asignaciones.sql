-- ============================================================================
-- V7 - Historial de asignaciones de entidad
-- ============================================================================

CREATE TABLE reporte_asignacion_historial (
    id BIGSERIAL PRIMARY KEY,
    reporte_id BIGINT NOT NULL,
    entidad_anterior_id BIGINT,
    entidad_nueva_id BIGINT NOT NULL,
    usuario_id BIGINT,
    origen VARCHAR(30) NOT NULL,
    motivo TEXT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_asignacion_reporte
        FOREIGN KEY (reporte_id)
        REFERENCES reportes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_asignacion_entidad_anterior
        FOREIGN KEY (entidad_anterior_id)
        REFERENCES entidades(id),

    CONSTRAINT fk_asignacion_entidad_nueva
        FOREIGN KEY (entidad_nueva_id)
        REFERENCES entidades(id),

    CONSTRAINT fk_asignacion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE INDEX idx_asignacion_historial_reporte_fecha
    ON reporte_asignacion_historial (reporte_id, fecha, id);
