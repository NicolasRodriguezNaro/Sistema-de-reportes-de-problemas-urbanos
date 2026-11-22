import { Pencil, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { apiFetch, construirQuery } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { useLanguage } from "../i18n/LanguageContext";
import type {
  FuncionarioActualizacionRequest,
  FuncionarioCreacionRequest,
  PaginaResponse,
  UsuarioGestion,
} from "../types/api";
import { formatearFecha, iniciales } from "../utils/format";

interface Filtros {
  texto: string;
  activo: string;
}

const FILTROS_INICIALES: Filtros = {
  texto: "",
  activo: "",
};

interface FormularioFuncionario {
  nombre: string;
  email: string;
  password: string;
  activo: boolean;
}

const FORMULARIO_INICIAL: FormularioFuncionario = {
  nombre: "",
  email: "",
  password: "",
  activo: true,
};

export function EquipoPage() {
  const { usuario } = useAuth();
  const { t, locale } = useLanguage();
  const [funcionarios, setFuncionarios] = useState<UsuarioGestion[]>([]);
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
  const [formulario, setFormulario] = useState<FormularioFuncionario>(FORMULARIO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const query = construirQuery({
        texto: filtrosActivos.texto,
        activo: filtrosActivos.activo,
        page: pagina,
        size: tamano,
      });
      const data = await apiFetch<PaginaResponse<UsuarioGestion>>(`/api/usuarios/equipo${query}`);
      setFuncionarios(data.contenido);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el equipo.");
    } finally {
      setCargando(false);
    }
  }, [filtrosActivos, pagina, tamano]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!usuario) return null;

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
    setFormulario(FORMULARIO_INICIAL);
    setFormError(null);
    setMensaje(null);
    setFormularioAbierto(true);
  };

  const abrirEditar = (funcionario: UsuarioGestion) => {
    setEditandoId(funcionario.id);
    setFormulario({
      nombre: funcionario.nombre,
      email: funcionario.email,
      password: "",
      activo: funcionario.activo,
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

  const cambiarCampo = <K extends keyof FormularioFuncionario>(
    campo: K,
    valor: FormularioFuncionario[K]
  ) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
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

    setGuardando(true);
    try {
      if (editandoId) {
        const body: FuncionarioActualizacionRequest = {
          nombre: formulario.nombre.trim(),
          activo: formulario.activo,
        };
        await apiFetch<UsuarioGestion>(`/api/usuarios/equipo/${editandoId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        setMensaje("Funcionario actualizado correctamente.");
      } else {
        const body: FuncionarioCreacionRequest = {
          nombre: formulario.nombre.trim(),
          email: formulario.email.trim().toLowerCase(),
          password: formulario.password,
        };
        await apiFetch<UsuarioGestion>("/api/usuarios/equipo", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setMensaje("Funcionario creado correctamente.");
        setPagina(0);
      }

      setFormularioAbierto(false);
      await cargar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo guardar el funcionario.");
    } finally {
      setGuardando(false);
    }
  };

  const hayFiltros = Object.values(filtrosActivos).some(Boolean);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t("Empresa")}
        titulo={t("Mi equipo")}
        descripcion={t("Administra los funcionarios de {entidad}.", {
          entidad: usuario.entidadNombre ?? t("tu entidad responsable"),
        })}
        actions={
          <button className="button button-primary" onClick={abrirCrear}>
            <Plus size={16} />
            {t("Nuevo funcionario")}
          </button>
        }
      />

      {mensaje && (
        <div className="success-note">
          <ShieldCheck size={17} />
          <span>{t(mensaje)}</span>
        </div>
      )}

      {formularioAbierto && (
        <section className="filters-panel user-form-panel">
          <div className="filters-heading">
            <div>
              <ShieldCheck size={18} />
              <strong>{t(editandoId ? "Editar funcionario" : "Nuevo funcionario")}</strong>
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
                  placeholder={t("funcionario@entidad.gov.co")}
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

              {editandoId && (
                <label className="field checkbox-field">
                  <span>{t("Estado")}</span>
                  <span className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(event) => cambiarCampo("activo", event.target.checked)}
                    />
                    {t("Funcionario activo")}
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
                  : t(editandoId ? "Guardar cambios" : "Crear funcionario")}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="filters-panel">
        <div className="filters-heading">
          <div>
            <Search size={18} />
            <strong>{t("Buscar funcionarios")}</strong>
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
                placeholder={t("Buscar funcionario")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicarFiltros();
                }}
              />
            </div>
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
            <span className="eyebrow">{t("Equipo de la entidad")}</span>
            <h2>
              {total > 0
                ? t("{n} funcionarios", { n: total })
                : t("Sin funcionarios")}
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
          <LoadingState label={t("Consultando funcionarios...")} />
        ) : error ? (
          <ErrorState mensaje={t(error)} onRetry={() => void cargar()} />
        ) : funcionarios.length === 0 ? (
          <EmptyState
            titulo={t(hayFiltros ? "No encontramos funcionarios" : "Aún no hay funcionarios")}
            descripcion={t(
              hayFiltros
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Crea la primera cuenta para un funcionario de tu entidad."
            )}
            accion={
              hayFiltros ? (
                <button className="button button-secondary" onClick={limpiarFiltros}>
                  {t("Limpiar filtros")}
                </button>
              ) : (
                <button className="button button-primary" onClick={abrirCrear}>
                  <Plus size={16} />
                  {t("Crear funcionario")}
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
                    <th>{t("Funcionario")}</th>
                    <th>{t("Estado")}</th>
                    <th>{t("Registro")}</th>
                    <th aria-label={t("Acciones")} />
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((funcionario) => (
                    <tr key={funcionario.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar avatar-small">{iniciales(funcionario.nombre)}</div>
                          <div>
                            <strong>{funcionario.nombre}</strong>
                            <span>{funcionario.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`user-status ${
                            funcionario.activo ? "user-status-active" : "user-status-inactive"
                          }`}
                        >
                          <span className="user-status-dot" />
                          {t(funcionario.activo ? "Activo" : "Inactivo")}
                        </span>
                      </td>
                      <td className="report-date">{formatearFecha(funcionario.fechaRegistro, locale)}</td>
                      <td>
                        <button
                          className="table-action table-action-button"
                          onClick={() => abrirEditar(funcionario)}
                        >
                          <Pencil size={13} />
                          {t("Editar")}
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
              etiqueta={t("funcionarios")}
              onChange={setPagina}
            />
          </>
        )}
      </section>
    </div>
  );
}
