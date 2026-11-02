-- ============================================================================
-- V5 - Moderacion de reportes e historial de estados
-- ============================================================================

ALTER TABLE reportes
    ADD COLUMN motivo_rechazo VARCHAR(50);

ALTER TABLE reportes
    ADD COLUMN detalle_rechazo TEXT;

CREATE TABLE reporte_historial (
    id BIGSERIAL PRIMARY KEY,
    reporte_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    usuario_id BIGINT NOT NULL,
    motivo VARCHAR(50),
    detalle TEXT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_reporte
        FOREIGN KEY (reporte_id)
        REFERENCES reportes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE INDEX idx_historial_reporte_fecha
    ON reporte_historial (reporte_id, fecha, id);
