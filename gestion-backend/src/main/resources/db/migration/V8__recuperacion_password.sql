ALTER TABLE usuarios
    ADD COLUMN password_version INTEGER NOT NULL DEFAULT 0;

CREATE TABLE recuperaciones_password (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    intentos INTEGER NOT NULL DEFAULT 0,
    fecha_uso TIMESTAMPTZ
);

CREATE INDEX idx_recuperaciones_usuario_abiertas
    ON recuperaciones_password (usuario_id, usado, fecha_creacion DESC);
