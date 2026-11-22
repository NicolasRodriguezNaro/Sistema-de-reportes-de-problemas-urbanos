import { Check, Copy, KeyRound, Pencil, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { apiFetch, construirQuery } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  EntidadResumen,
  PaginaResponse,
  RecuperacionCodigoResponse,
  RolUsuario,
  UsuarioActualizacionRequest,
  UsuarioCreacionRequest,
  UsuarioGestion,
} from "../types/api";
import { ETIQUETAS_ROL, formatearFecha, iniciales } from "../utils/format";

const ROLES: RolUsuario[] = ["ADMINISTRADOR", "FUNCIONARIO", "EMPRESA", "CIUDADANO"];

interface Filtros {
  texto: string;
  rol: string;
  entidadId: string;
  activo: string;
}

const FILTROS_INICIALES: Filtros = {
  texto: "",
  rol: "",
  entidadId: "",
  activo: "",
};

interface FormularioUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  entidadId: string;
  activo: boolean;
}

interface CodigoRecuperacion {
  usuarioNombre: string;
  codigo: string;
  expiraEnSegundos: number;
}

const FORMULARIO_INICIAL: FormularioUsuario = {
  nombre: "",
  email: "",
  password: "",
  rol: "FUNCIONARIO",
  entidadId: "",
  activo: true,
};

function requiereEntidad(rol: RolUsuario) {
  return rol === "FUNCIONARIO" || rol === "EMPRESA";
}

export function UsuariosPage() {
  const { t, locale } = useLanguage();
  const [usuarios, setUsuarios] = useState<UsuarioGestion[]>([]);
  const [entidades, setEntidades] = useState<EntidadResumen[]>([]);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [filtrosActivos, setFiltrosActivos] = useState<Filtros>(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<FormularioUsuario>(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [codigoRecuperacion, setCodigoRecuperacion] = useState<CodigoRecuperacion | null>(null);
  const [generandoCodigoId, setGenerandoCodigoId] = useState<number | null>(null);
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  useEffect(() => {
    apiFetch<EntidadResumen[]>("/api/entidades")
      .then(setEntidades)
      .catch(() => setEntidades([]));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const query = construirQuery({
        texto: filtrosActivos.texto,
        rol: filtrosActivos.rol,
        entidadId: filtrosActivos.entidadId,
        activo: filtrosActivos.activo,
        page: pagina,
        size: tamano,
      });
      const data = await apiFetch<PaginaResponse<UsuarioGestion>>(`/api/usuarios${query}`);
      setUsuarios(data.contenido);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  }, [filtrosActivos, pagina, tamano]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const aplicarFiltros = () => {
    setPagina(0);
    setFiltrosActivos({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setFiltrosActivos(FILTROS_INICIALES);
    setPagina(0);
  };

  const cambiarFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario({ ...FORMULARIO_INICIAL, rol: "FUNCIONARIO" });
    setFormError(null);
    setMensaje(null);
    setFormularioAbierto(true);
  };

  const abrirEditar = (usuario: UsuarioGestion) => {
    setEditandoId(usuario.id);
    setFormulario({
      nombre: usuario.nombre,
      email: usuario.email,
      password: "",
      rol: usuario.rol,
      entidadId: usuario.entidadId ? String(usuario.entidadId) : "",
      activo: usuario.activo,
    });
    setFormError(null);
    setMensaje(null);
    setFormularioAbierto(true);
  };

  const cerrarFormulario = () => {
    if (guardando) return;
    setFormularioAbierto(false);
    setFormError(null);
  };

  const cambiarCampo = <K extends keyof FormularioUsuario>(
    campo: K,
    valor: FormularioUsuario[K]
  ) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const cambiarRol = (rol: RolUsuario) => {
    setFormulario((actual) => ({
      ...actual,
      rol,
      entidadId: requiereEntidad(rol) ? actual.entidadId : "",
    }));
  };

  const guardar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formulario.nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!editandoId && !formulario.email.trim()) {
      setFormError("El email es obligatorio.");
      return;
    }
    if (!editandoId && formulario.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (requiereEntidad(formulario.rol) && !formulario.entidadId) {
      setFormError("Selecciona la entidad responsable para este usuario.");
      return;
    }

    const entidadId = requiereEntidad(formulario.rol) ? Number(formulario.entidadId) : null;
    setGuardando(true);
    try {
      if (editandoId) {
        const body: UsuarioActualizacionRequest = {
          nombre: formulario.nombre.trim(),
          rol: formulario.rol,
          entidadId,
          activo: formulario.activo,
        };
        await apiFetch<UsuarioGestion>(`/api/usuarios/${editandoId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMensaje("Usuario actualizado correctamente.");
      } else {
        const body: UsuarioCreacionRequest = {
          nombre: formulario.nombre.trim(),
          email: formulario.email.trim().toLowerCase(),
          password: formulario.password,
          rol: formulario.rol,
          entidadId,
        };
        await apiFetch<UsuarioGestion>("/api/usuarios", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setMensaje("Usuario creado correctamente.");
        setPagina(0);
      }

      setFormularioAbierto(false);
      await cargar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const generarCodigoRecuperacion = async (usuario: UsuarioGestion) => {
    setGenerandoCodigoId(usuario.id);
    setCodigoError(null);
    setCodigoCopiado(false);
    try {
      const respuesta = await apiFetch<RecuperacionCodigoResponse>(
        `/api/usuarios/${usuario.id}/recuperacion`,
        { method: "POST" }
      );
      setCodigoRecuperacion({
        usuarioNombre: usuario.nombre,
        codigo: respuesta.codigo,
        expiraEnSegundos: respuesta.expiraEnSegundos,
      });
    } catch {
      setCodigoError("No se pudo generar el código de recuperación.");
    } finally {
      setGenerandoCodigoId(null);
    }
  };

  const copiarCodigo = async () => {
    if (!codigoRecuperacion) return;
    try {
      await navigator.clipboard.writeText(codigoRecuperacion.codigo);
      setCodigoCopiado(true);
      window.setTimeout(() => setCodigoCopiado(false), 2000);
    } catch {
      setCodigoCopiado(false);
    }
  };

  const hayFiltros = Object.values(filtrosActivos).some(Boolean);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Administración")}
        titulo={t("Usuarios")}
        descripcion={t("Crea cuentas, asigna roles y vincula funcionarios o empresas a su entidad responsable.")}
        actions={
          <button className="button button-primary" onClick={abrirCrear}>
            <Plus size={16} />
            {t("Nuevo usuario")}
          </button>
        }
      />

      {mensaje && (
        <div className="success-note">
          <ShieldCheck size={17} />
          <span>{t(mensaje)}</span>
        </div>
      )}

      {codigoError && <div className="form-error">{t(codigoError)}</div>}

      {formularioAbierto && (
        <section className="filters-panel user-form-panel">
          <div className="filters-heading">
            <div>
              <ShieldCheck size={18} />
              <strong>{t(editandoId ? "Editar usuario" : "Nuevo usuario")}</strong>
            </div>
            <button
              className="icon-button"
              onClick={cerrarFormulario}
              aria-label={t("Cerrar formulario")}
              type="button"
            >
              <X size={17} />
            </button>
          </div>

          <form onSubmit={guardar}>
            <div className="filters-grid user-form-grid">
              <label className="field">
                <span>{t("Nombre")}</span>
                <input
                  value={formulario.nombre}
                  onChange={(event) => cambiarCampo("nombre", event.target.value)}
                  placeholder={t("Nombre completo")}
                  maxLength={150}
                  required
                />
              </label>

              <label className="field">
                <span>{t("Email")}</span>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(event) => cambiarCampo("email", event.target.value)}
                  placeholder={t("usuario@entidad.gov.co")}
                  maxLength={150}
                  disabled={Boolean(editandoId)}
                  required={!editandoId}
                />
              </label>

              {!editandoId && (
                <label className="field">
                  <span>{t("Contraseña inicial")}</span>
                  <input
                    type="password"
                    value={formulario.password}
                    onChange={(event) => cambiarCampo("password", event.target.value)}
                    placeholder={t("Mínimo 8 caracteres")}
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              )}

              <label className="field">
                <span>{t("Rol")}</span>
                <select
                  value={formulario.rol}
                  onChange={(event) => cambiarRol(event.target.value as RolUsuario)}
                >
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>
                      {t(ETIQUETAS_ROL[rol])}
                    </option>
                  ))}
                </select>
              </label>

              {requiereEntidad(formulario.rol) && (
                <label className="field">
                  <span>{t("Entidad responsable")}</span>
                  <select
                    value={formulario.entidadId}
                    onChange={(event) => cambiarCampo("entidadId", event.target.value)}
                    required
                  >
                    <option value="">{t("Selecciona una entidad")}</option>
                    {entidades.map((entidad) => (
                      <option key={entidad.id} value={entidad.id}>
                        {entidad.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {editandoId && (
                <label className="field checkbox-field">
                  <span>{t("Estado")}</span>
                  <span className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(event) => cambiarCampo("activo", event.target.checked)}
                    />
                    {t("Usuario activo")}
                  </span>
                </label>
              )}
            </div>

            {formError && <p className="form-error">{t(formError)}</p>}

            <div className="form-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                {t("Cancelar")}
              </button>
              <button className="button button-primary" type="submit" disabled={guardando}>
                {guardando
                  ? t("Guardando...")
                  : t(editandoId ? "Guardar cambios" : "Crear usuario")}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="filters-panel">
        <div className="filters-heading">
          <div>
            <Search size={18} />
            <strong>{t("Buscar usuarios")}</strong>
          </div>
          <span>{t(hayFiltros ? "Filtros activos" : "Sin filtros aplicados")}</span>
        </div>

        <div className="filters-grid">
          <label className="field field-search">
            <span>{t("Nombre o email")}</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                value={filtros.texto}
                onChange={(event) => cambiarFiltro("texto", event.target.value)}
                placeholder={t("Buscar usuario")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicarFiltros();
                }}
              />
            </div>
          </label>

          <label className="field">
            <span>{t("Rol")}</span>
            <select value={filtros.rol} onChange={(event) => cambiarFiltro("rol", event.target.value)}>
              <option value="">{t("Todos")}</option>
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {t(ETIQUETAS_ROL[rol])}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("Entidad")}</span>
            <select
              value={filtros.entidadId}
              onChange={(event) => cambiarFiltro("entidadId", event.target.value)}
            >
              <option value="">{t("Todas")}</option>
              {entidades.map((entidad) => (
                <option key={entidad.id} value={entidad.id}>
                  {entidad.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("Estado")}</span>
            <select
              value={filtros.activo}
              onChange={(event) => cambiarFiltro("activo", event.target.value)}
            >
              <option value="">{t("Todos")}</option>
              <option value="true">{t("Activos")}</option>
              <option value="false">{t("Inactivos")}</option>
            </select>
          </label>

          <button className="button button-primary filter-submit" onClick={aplicarFiltros}>
            <Search size={16} />
            {t("Aplicar filtros")}
          </button>

          {hayFiltros && (
            <button className="button button-secondary filter-submit" onClick={limpiarFiltros}>
              {t("Limpiar")}
            </button>
          )}
        </div>
      </section>

      <section className="panel reports-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">{t("Cuentas de acceso")}</span>
            <h2>
              {total > 0
                ? t("{n} usuarios registrados", { n: total })
                : t("Sin usuarios")}
            </h2>
          </div>
          <label className="page-size">
            <span>{t("Filas")}</span>
            <select
              value={tamano}
              onChange={(event) => {
                setTamano(Number(event.target.value));
                setPagina(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        {cargando ? (
          <LoadingState label={t("Consultando usuarios...")} />
        ) : error ? (
          <ErrorState mensaje={t(error)} onRetry={() => void cargar()} />
        ) : usuarios.length === 0 ? (
          <EmptyState
            titulo={t(hayFiltros ? "No encontramos usuarios" : "Aún no hay usuarios")}
            descripcion={t(
              hayFiltros
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Crea la primera cuenta operativa para comenzar."
            )}
            accion={
              hayFiltros ? (
                <button className="button button-secondary" onClick={limpiarFiltros}>
                  {t("Limpiar filtros")}
                </button>
              ) : (
                <button className="button button-primary" onClick={abrirCrear}>
                  <Plus size={16} />
                  {t("Crear usuario")}
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="users-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>{t("Usuario")}</th>
                    <th>{t("Rol")}</th>
                    <th>{t("Entidad")}</th>
                    <th>{t("Estado")}</th>
                    <th>{t("Registro")}</th>
                    <th aria-label={t("Acciones")} />
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar avatar-small">{iniciales(usuario.nombre)}</div>
                          <div>
                            <strong>{usuario.nombre}</strong>
                            <span>{usuario.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge user-role user-role-${usuario.rol.toLowerCase()}`}>
                          {t(ETIQUETAS_ROL[usuario.rol])}
                        </span>
                      </td>
                      <td>{usuario.entidadNombre ?? t("Sin entidad")}</td>
                      <td>
                        <span className={`user-status ${usuario.activo ? "user-status-active" : "user-status-inactive"}`}>
                          <span className="user-status-dot" />
                          {t(usuario.activo ? "Activo" : "Inactivo")}
                        </span>
                      </td>
                      <td className="report-date">{formatearFecha(usuario.fechaRegistro, locale)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="table-action table-action-button"
                            onClick={() => abrirEditar(usuario)}
                          >
                            <Pencil size={13} />
                            {t("Editar")}
                          </button>
                          <button
                            className="table-action table-action-button"
                            onClick={() => void generarCodigoRecuperacion(usuario)}
                            disabled={generandoCodigoId === usuario.id || !usuario.activo}
                          >
                            <KeyRound size={13} />
                            {generandoCodigoId === usuario.id
                              ? t("Generando...")
                              : t("Recuperar")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              etiqueta={t("usuarios")}
              onChange={setPagina}
            />
          </>
        )}
      </section>

      {codigoRecuperacion && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCodigoRecuperacion(null);
          }}
        >
          <div className="modal-card" role="dialog" aria-modal="true">
            <button
              className="modal-close"
              type="button"
              aria-label={t("Cerrar")}
              onClick={() => setCodigoRecuperacion(null)}
            >
              <X size={18} />
            </button>
            <div className="modal-icon">
              <KeyRound size={22} />
            </div>
            <h2>{t("Código generado")}</h2>
            <p>
              {t("Entrega este código al usuario por un canal seguro. No se envía por correo.")}
            </p>
            <div className="modal-detail">
              <span className="recovery-code-label">{codigoRecuperacion.usuarioNombre}</span>
              <strong className="recovery-code-value">{codigoRecuperacion.codigo}</strong>
            </div>
            <p className="recovery-code-expiry">
              {t("Vence en {minutos} minutos.", {
                minutos: Math.round(codigoRecuperacion.expiraEnSegundos / 60),
              })}
            </p>
            <div className="modal-actions">
              <button className="button button-secondary" type="button" onClick={() => void copiarCodigo()}>
                {codigoCopiado ? <Check size={15} /> : <Copy size={15} />}
                {codigoCopiado ? t("Copiado") : t("Copiar código")}
              </button>
              <button className="button button-primary" type="button" onClick={() => setCodigoRecuperacion(null)}>
                {t("Cerrar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
