import {
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ETIQUETAS_ROL, iniciales } from "../utils/format";

const TITULOS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/reportes": "Reportes",
  "/mapa": "Mapa territorial",
  "/entidades": "Entidades",
  "/usuarios": "Usuarios",
  "/perfil": "Perfil",
};

export function AppLayout() {
  const { usuario, cerrarSesion, esAdministrador } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  if (!usuario) return null;

  const titulo =
    location.pathname.startsWith("/reportes/") && location.pathname !== "/reportes"
      ? "Detalle del reporte"
      : TITULOS[location.pathname] ?? "Panel de operaciones";

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`app-shell ${menuAbierto ? "menu-open" : ""}`}>
      <button
        className="mobile-menu-button"
        onClick={() => setMenuAbierto((valor) => !valor)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
      >
        {menuAbierto ? <X size={22} /> : <Menu size={22} />}
      </button>

      {menuAbierto && <button className="sidebar-backdrop" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
          <div>
            <strong>Reporte Urbano</strong>
            <span>Panel de operaciones</span>
          </div>
        </div>

        <div className="sidebar-section-label">Operación</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/reportes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <FileText size={19} />
            <span>Reportes</span>
          </NavLink>
          <NavLink to="/mapa" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Map size={19} />
            <span>Mapa</span>
          </NavLink>
          {esAdministrador && (
            <>
              <NavLink to="/entidades" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Building2 size={19} />
                <span>Entidades</span>
                <span className="nav-tag">Admin</span>
              </NavLink>
              <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users size={19} />
                <span>Usuarios</span>
                <span className="nav-tag">Admin</span>
              </NavLink>
            </>
          )}
          <NavLink to="/perfil" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <UserRound size={19} />
            <span>Perfil</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            <div>
              <strong>Sesión activa</strong>
              <span>Panel autenticado</span>
            </div>
          </div>
          <div className="user-card">
            <div className="avatar">{iniciales(usuario.nombre)}</div>
            <div className="user-card-info">
              <strong>{usuario.nombre}</strong>
              <span>{ETIQUETAS_ROL[usuario.rol]}</span>
            </div>
            <button className="icon-button icon-button-ghost" onClick={salir} aria-label="Cerrar sesión">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-eyebrow">SIU Municipal / Operación</span>
            <h2>{titulo}</h2>
          </div>
          <div className="topbar-actions">
            <div className="topbar-date">
              <CalendarDays size={16} />
              <span>
                {new Intl.DateTimeFormat("es-CO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date())}
              </span>
            </div>
            <div className="topbar-user">
              <div className="avatar avatar-small">{iniciales(usuario.nombre)}</div>
              <div>
                <strong>{usuario.nombre}</strong>
                <span>{ETIQUETAS_ROL[usuario.rol]}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
