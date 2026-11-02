-- ============================================================================
-- V6 - Motivo de reapertura de reportes rechazados
-- ============================================================================

ALTER TABLE reporte_historial
    ADD COLUMN motivo_reapertura TEXT;
