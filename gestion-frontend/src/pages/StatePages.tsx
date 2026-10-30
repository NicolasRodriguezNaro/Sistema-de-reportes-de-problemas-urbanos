import { ArrowRight, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <div className="standalone-state-page">
      <div className="standalone-state-card">
        <div className="state-icon state-icon-large">
          <Smartphone size={26} />
        </div>
        <span className="eyebrow">Acceso restringido</span>
        <h1>Este panel es para personal municipal</h1>
        <p>
          Los ciudadanos pueden crear y consultar sus reportes desde la aplicación móvil.
          Si eres funcionario, empresa o administrador, usa tus credenciales institucionales.
        </p>
        <Link className="button button-primary" to="/login">
          Volver al acceso
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="standalone-state-page">
      <div className="standalone-state-card">
        <span className="eyebrow">Error 404</span>
        <h1>No encontramos esta página</h1>
        <p>La dirección que buscas no existe o cambió de lugar.</p>
        <Link className="button button-primary" to="/dashboard">
          Volver al dashboard
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
