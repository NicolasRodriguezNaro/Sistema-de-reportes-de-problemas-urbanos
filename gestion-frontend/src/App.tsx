import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { AccessDeniedPage, NotFoundPage } from "./pages/StatePages";
import { DashboardPage } from "./pages/DashboardPage";
import { EntitiesPage } from "./pages/EntitiesPage";
import { LoginPage } from "./pages/LoginPage";
import { MapPage } from "./pages/MapPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { EquipoPage } from "./pages/EquipoPage";
import { UsuariosPage } from "./pages/UsuariosPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="full-screen-loading">
        <span className="loading-mark" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireStaff({ children }: { children: React.ReactNode }) {
  const { esPersonal, cargando } = useAuth();

  if (cargando) return null;
  if (!esPersonal) return <AccessDeniedPage />;

  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { esAdministrador } = useAuth();
  if (!esAdministrador) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireEmpresa({ children }: { children: React.ReactNode }) {
  const { esEmpresa } = useAuth();
  if (!esEmpresa) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sin-acceso" element={<AccessDeniedPage />} />
        <Route
          element={
            <RequireAuth>
              <RequireStaff>
                <AppLayout />
              </RequireStaff>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/reportes/:id" element={<ReportDetailPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route
            path="/entidades"
            element={
              <RequireAdmin>
                <EntitiesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RequireAdmin>
                <UsuariosPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/mi-equipo"
            element={
              <RequireEmpresa>
                <EquipoPage />
              </RequireEmpresa>
            }
          />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
