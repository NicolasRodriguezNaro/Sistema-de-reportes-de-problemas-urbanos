import { Building2, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { ETIQUETAS_ROL, iniciales } from "../utils/format";

export function ProfilePage() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cuenta"
        titulo="Perfil de usuario"
        descripcion="Información de la sesión y del alcance asignado."
      />

      <section className="profile-grid">
        <article className="panel profile-card">
          <div className="avatar avatar-large">{iniciales(usuario.nombre)}</div>
          <h2>{usuario.nombre}</h2>
          <span className="profile-role">{ETIQUETAS_ROL[usuario.rol]}</span>
          <button className="button button-secondary" onClick={salir}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Datos de acceso</span>
              <h2>Información de la cuenta</h2>
            </div>
          </div>
          <div className="metadata-list">
            <div>
              <span><UserRound size={15} /> Nombre</span>
              <strong>{usuario.nombre}</strong>
            </div>
            <div>
              <span><Mail size={15} /> Correo</span>
              <strong>{usuario.email}</strong>
            </div>
            <div>
              <span><ShieldCheck size={15} /> Rol</span>
              <strong>{ETIQUETAS_ROL[usuario.rol]}</strong>
            </div>
            <div>
              <span><Building2 size={15} /> Entidad</span>
              <strong>
                {usuario.entidadNombre ??
                  (usuario.entidadId ? `Entidad ${usuario.entidadId}` : "No asignada")}
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
