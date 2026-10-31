import { Pencil, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { apiFetch, construirQuery } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import type {
  EntidadResumen,
  PaginaResponse,
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

  const hayFiltros = Object.values(filtrosActivos).some(Boolean);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administración"
        titulo="Usuarios"
        descripcion="Crea cuentas, asigna roles y vincula funcionarios o empresas a su entidad responsable."
        actions={
          <button className="button button-primary" onClick={abrirCrear}>
            <Plus size={16} />
            Nuevo usuario
          </button>
        }
      />

      {mensaje && (
        <div className="success-note">
          <ShieldCheck size={17} />
          <span>{mensaje}</span>
        </div>
      )}

      {formularioAbierto && (
        <section className="filters-panel user-form-panel">
          <div className="filters-heading">
            <div>
              <ShieldCheck size={18} />
              <strong>{editandoId ? "Editar usuario" : "Nuevo usuario"}</strong>
            </div>
            <button
              className="icon-button"
              onClick={cerrarFormulario}
              aria-label="Cerrar formulario"
              type="button"
            >
              <X size={17} />
            </button>
          </div>

          <form onSubmit={guardar}>
            <div className="filters-grid user-form-grid">
              <label className="field">
                <span>Nombre</span>
                <input
                  value={formulario.nombre}
                  onChange={(event) => cambiarCampo("nombre", event.target.value)}
                  placeholder="Nombre completo"
                  maxLength={150}
                  required
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(event) => cambiarCampo("email", event.target.value)}
                  placeholder="usuario@entidad.gov.co"
                  maxLength={150}
                  disabled={Boolean(editandoId)}
                  required={!editandoId}
                />
              </label>

              {!editandoId && (
                <label className="field">
                  <span>Contraseña inicial</span>
                  <input
                    type="password"
                    value={formulario.password}
                    onChange={(event) => cambiarCampo("password", event.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                </label>
              )}

              <label className="field">
                <span>Rol</span>
                <select
                  value={formulario.rol}
                  onChange={(event) => cambiarRol(event.target.value as RolUsuario)}
                >
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>
                      {ETIQUETAS_ROL[rol]}
                    </option>
                  ))}
                </select>
              </label>

              {requiereEntidad(formulario.rol) && (
                <label className="field">
                  <span>Entidad responsable</span>
                  <select
                    value={formulario.entidadId}
                    onChange={(event) => cambiarCampo("entidadId", event.target.value)}
                    required
                  >
                    <option value="">Selecciona una entidad</option>
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
                  <span>Estado</span>
                  <span className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(event) => cambiarCampo("activo", event.target.checked)}
                    />
                    Usuario activo
                  </span>
                </label>
              )}
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="form-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button className="button button-primary" type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="filters-panel">
        <div className="filters-heading">
          <div>
            <Search size={18} />
            <strong>Buscar usuarios</strong>
          </div>
          <span>{hayFiltros ? "Filtros activos" : "Sin filtros aplicados"}</span>
        </div>

        <div className="filters-grid">
          <label className="field field-search">
            <span>Nombre o email</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                value={filtros.texto}
                onChange={(event) => cambiarFiltro("texto", event.target.value)}
                placeholder="Buscar usuario"
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicarFiltros();
                }}
              />
            </div>
          </label>

          <label className="field">
            <span>Rol</span>
            <select value={filtros.rol} onChange={(event) => cambiarFiltro("rol", event.target.value)}>
              <option value="">Todos</option>
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ETIQUETAS_ROL[rol]}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Entidad</span>
            <select
              value={filtros.entidadId}
              onChange={(event) => cambiarFiltro("entidadId", event.target.value)}
            >
              <option value="">Todas</option>
              {entidades.map((entidad) => (
                <option key={entidad.id} value={entidad.id}>
                  {entidad.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Estado</span>
            <select
              value={filtros.activo}
              onChange={(event) => cambiarFiltro("activo", event.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>

          <button className="button button-primary filter-submit" onClick={aplicarFiltros}>
            <Search size={16} />
            Aplicar filtros
          </button>

          {hayFiltros && (
            <button className="button button-secondary filter-submit" onClick={limpiarFiltros}>
              Limpiar
            </button>
          )}
        </div>
      </section>

      <section className="panel reports-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Cuentas de acceso</span>
            <h2>{total > 0 ? `${total} usuarios registrados` : "Sin usuarios"}</h2>
          </div>
          <label className="page-size">
            <span>Filas</span>
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
          <LoadingState label="Consultando usuarios..." />
        ) : error ? (
          <ErrorState mensaje={error} onRetry={() => void cargar()} />
        ) : usuarios.length === 0 ? (
          <EmptyState
            titulo={hayFiltros ? "No encontramos usuarios" : "Aún no hay usuarios"}
            descripcion={
              hayFiltros
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Crea la primera cuenta operativa para comenzar."
            }
            accion={
              hayFiltros ? (
                <button className="button button-secondary" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              ) : (
                <button className="button button-primary" onClick={abrirCrear}>
                  <Plus size={16} />
                  Crear usuario
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
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Entidad</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th aria-label="Acciones" />
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
                          {ETIQUETAS_ROL[usuario.rol]}
                        </span>
                      </td>
                      <td>{usuario.entidadNombre ?? "Sin entidad"}</td>
                      <td>
                        <span className={`user-status ${usuario.activo ? "user-status-active" : "user-status-inactive"}`}>
                          <span className="user-status-dot" />
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="report-date">{formatearFecha(usuario.fechaRegistro)}</td>
                      <td>
                        <button
                          className="table-action table-action-button"
                          onClick={() => abrirEditar(usuario)}
                        >
                          <Pencil size={13} />
                          Editar
                        </button>
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
              etiqueta="usuarios"
              onChange={setPagina}
            />
          </>
        )}
      </section>
    </div>
  );
}
