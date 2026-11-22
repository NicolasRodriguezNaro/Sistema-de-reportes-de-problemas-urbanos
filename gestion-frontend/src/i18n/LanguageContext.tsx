import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { english } from "./english";

const extra: Record<string, string> = {
  "Cuenta": "Account",
  "Información de la sesión y del alcance asignado.":
    "Session and assigned scope information.",
  "Idioma de la interfaz": "Interface language",
  "Ajusta el texto de todo el panel.": "Adjust the text across the panel.",
  "Ingresando...": "Signing in...",
  "Tu contraseña": "Your password",
  "Verificación": "Verification",
  "Código captcha": "Captcha code",
  "Captcha no disponible": "Captcha unavailable",
  "Escribe el código de la imagen": "Enter the code from the image",
  "Ocultar contraseña": "Hide password",
  "Mostrar contraseña": "Show password",
  "Administrador": "Administrator",
  "Funcionario": "Official",
  "Empresa": "Company",
  "Ciudadano": "Citizen",
  "Panel de operaciones": "Operations panel",
  "SIU Municipal / Operación": "Municipal GIS / Operations",
  "Cerrar menú": "Close menu",
  "Abrir menú": "Open menu",
  "reportes": "reports",
  "Página {pagina} de {total}": "Page {pagina} of {total}",
  "Página anterior": "Previous page",
  "Página siguiente": "Next page",
  "No se pudo cargar la información": "Could not load information",
  "Cargando información...": "Loading information...",
  "Ver detalle": "View details",
  "Acciones": "Actions",
  "Barrio": "Neighborhood",
  "Sin barrio": "No neighborhood",
  "Sin fecha": "No date",
  "Asignado": "Assigned",
  "Sin clasificar": "Unclassified",
  "Sin descripción": "No description",
  "Sin categoría": "No category",
  "Imagen no disponible": "Image unavailable",
  "Cargando el panorama operativo...": "Loading operational overview...",
  "No se recibió información del dashboard.": "No dashboard information was received.",
  "Total de reportes": "Total reports",
  "En el periodo consultado": "In the selected period",
  "Pendientes": "Pending",
  "Esperando revisión": "Awaiting review",
  "La IA no pudo asignar categoría": "AI could not assign a category",
  "Rechazados": "Rejected",
  "Fuera de la operación activa": "Outside active operations",
  "En revisión": "Under review",
  "En gestión operativa": "In operational management",
  "Críticos": "Critical",
  "Requieren atención prioritaria": "Require priority attention",
  "Sin asignar": "Unassigned",
  "Pendientes de entidad": "Awaiting entity",
  "Resueltos": "Resolved",
  "Cerrados en el periodo": "Closed in the period",
  "Distribución": "Distribution",
  "Reportes por estado": "Reports by status",
  "Vista general": "Overview",
  "Territorio": "Territory",
  "Reportes recientes": "Recent reports",
  "Abrir mapa": "Open map",
  "No hay puntos para el periodo seleccionado.": "No points for the selected period.",
  "Análisis": "Analysis",
  "Reportes por categoría": "Reports by category",
  "Urgencia": "Urgency",
  "Prioridad calculada": "Calculated priority",
  "Concentración": "Concentration",
  "Barrios con más reportes": "Neighborhoods with most reports",
  "Aún no hay reportes con barrio asignado.": "No reports with assigned neighborhoods yet.",
  "Cobertura": "Coverage",
  "Alcance": "Scope",
  "Mi entidad": "My entity",
  "Actividad": "Activity",
  "Ver todos": "View all",
  "No hay reportes en el periodo seleccionado.": "No reports in the selected period.",
  "En el periodo": "In the period",
  "Lectura territorial": "Territorial reading",
  "Mapa de incidencias": "Incident map",
  "Explora los reportes y su relación con barrios y sitios de interés.":
    "Explore reports and their relationship with neighborhoods and places of interest.",
  "Preparando el mapa territorial...": "Preparing the territorial map...",
  "Capas": "Layers",
  "Barrios": "Neighborhoods",
  "Sitios de interés": "Places of interest",
  "reportes visibles": "visible reports",
  "Ubicación del reporte": "Report location",
  "Cargando entidades...": "Loading entities...",
  "Administración": "Administration",
  "Entidades responsables": "Responsible entities",
  "Catálogo institucional disponible para la asignación de reportes.":
    "Institutional catalog available for report assignment.",
  "La asignación de una entidad se realiza desde el detalle de un reporte. Esta pantalla es solo para administradores.":
    "An entity is assigned from the report details. This screen is for administrators only.",
  "Acceso restringido": "Restricted access",
  "Este panel es para personal municipal": "This panel is for municipal staff",
  "Los ciudadanos pueden crear y consultar sus reportes desde la aplicación móvil. Si eres funcionario, empresa o administrador, usa tus credenciales institucionales.":
    "Citizens can create and view their reports from the mobile app. If you are an official, company, or administrator, use your institutional credentials.",
  "Volver al acceso": "Back to sign in",
  "Error 404": "Error 404",
  "No encontramos esta página": "We couldn't find this page",
  "La dirección que buscas no existe o cambió de lugar.":
    "The address you are looking for does not exist or has moved.",
  "Volver al dashboard": "Back to dashboard",
  "Crea cuentas, asigna roles y vincula funcionarios o empresas a su entidad responsable.":
    "Create accounts, assign roles, and link officials or companies to their responsible entity.",
  "Email": "Email",
  "Contraseña inicial": "Initial password",
  "Selecciona una entidad": "Select an entity",
  "Usuario activo": "Active user",
  "Buscar usuarios": "Search users",
  "No encontramos usuarios": "No users found",
  "Aún no hay usuarios": "No users yet",
  "Crea la primera cuenta operativa para comenzar.": "Create the first operational account to get started.",
  "Cuentas de acceso": "Access accounts",
  "{n} usuarios registrados": "{n} registered users",
  "Sin usuarios": "No users",
  "Consultando usuarios...": "Loading users...",
  "Usuario": "User",
  "Usuario #{id}": "User #{id}",
  "Registro": "Registration",
  "Sin entidad": "No entity",
  "Activos": "Active",
  "Inactivos": "Inactive",
  "usuarios": "users",
  "Cerrar formulario": "Close form",
  "Administra los funcionarios de {entidad}.": "Manage the officials of {entidad}.",
  "tu entidad responsable": "your responsible entity",
  "Nuevo funcionario": "New official",
  "Editar funcionario": "Edit official",
  "Funcionario activo": "Active official",
  "Buscar funcionarios": "Search officials",
  "Equipo de la entidad": "Entity team",
  "{n} funcionarios": "{n} officials",
  "Sin funcionarios": "No officials",
  "Consultando funcionarios...": "Loading officials...",
  "funcionarios": "officials",
  "No encontramos funcionarios": "No officials found",
  "Aún no hay funcionarios": "No officials yet",
  "Crea la primera cuenta para un funcionario de tu entidad.":
    "Create the first account for an official of your entity.",
  "Crear funcionario": "Create official",
  "Funcionario actualizado correctamente.": "Official updated successfully.",
  "Funcionario creado correctamente.": "Official created successfully.",
  "No se pudo guardar el funcionario.": "Could not save the official.",
  "Volver a reportes": "Back to reports",
  "Detalle de la incidencia reportada por la ciudadanía.":
    "Details of the incident reported by a citizen.",
  "Reporte rechazado": "Report rejected",
  "No se registró una explicación adicional para este rechazo.":
    "No additional explanation was recorded for this rejection.",
  "Registro visual": "Visual record",
  "Evidencia del reporte": "Report evidence",
  "Punto reportado": "Reported point",
  "Lo que reportó el ciudadano": "What the citizen reported",
  "El reporte no incluye una descripción adicional.":
    "The report does not include an additional description.",
  "Ficha": "Details",
  "Información del reporte": "Report information",
  "No disponible": "Not available",
  "Reportado por": "Reported by",
  "Actualizado": "Updated",
  "Reporte padre": "Parent report",
  "Gestión": "Management",
  "Acciones disponibles": "Available actions",
  "Este reporte está rechazado. Para corregir la decisión, reábrelo y explica el motivo.":
    "This report is rejected. To correct the decision, reopen it and explain the reason.",
  "Este reporte está resuelto. Como administrador puedes reabrirlo explicando el motivo.":
    "This report is resolved. As an administrator, you can reopen it by explaining the reason.",
  "Volverá al estado En revisión.": "It will return to the Under review status.",
  "Motivo de reapertura": "Reopening reason",
  "Explica por qué se reabre este reporte.": "Explain why this report is being reopened.",
  "Reabriendo...": "Reopening...",
  "Reabrir reporte": "Reopen report",
  "Cambiar estado": "Change status",
  "Motivo de rechazo": "Rejection reason",
  "Selecciona un motivo": "Select a reason",
  "(obligatorio)": "(required)",
  "(opcional)": "(optional)",
  "Explica brevemente la decisión para el ciudadano.":
    "Briefly explain the decision for the citizen.",
  "Guardar estado": "Save status",
  "Este reporte está resuelto. Solo un administrador puede reabrirlo.":
    "This report is resolved. Only an administrator can reopen it.",
  "Tu rol puede consultar este reporte, pero no cambiar su estado.":
    "Your role can view this report but cannot change its status.",
  "Motivo del cambio (opcional)": "Change reason (optional)",
  "Explica por qué se cambia la entidad responsable.":
    "Explain why the responsible entity is being changed.",
  "Asignar entidad": "Assign entity",
  "La entidad responsable no se puede cambiar mientras el reporte esté {estado}. Reábrelo primero para volver a asignarlo.":
    "The responsible entity cannot be changed while the report is {estado}. Reopen it first to reassign it.",
  "Trazabilidad": "Traceability",
  "Historial de estados": "Status history",
  "por {nombre}": "by {nombre}",
  "Motivo de reapertura: {motivo}": "Reopening reason: {motivo}",
  "Este reporte no tiene movimientos de estado registrados.":
    "This report has no recorded status changes.",
  "Historial de asignaciones": "Assignment history",
  "Asignación automática": "Automatic assignment",
  "Reasignación manual": "Manual reassignment",
  "Sistema (Jena)": "System (Jena)",
  "Motivo: {motivo}": "Reason: {motivo}",
  "Este reporte no tiene cambios de entidad registrados.":
    "This report has no recorded entity changes.",
  "Contexto": "Context",
  "Vista territorial": "Territorial view",
  "Reabrir reporte #{id}": "Reopen report #{id}",
  "El reporte volverá a En revisión. El rechazo anterior se conservará en el historial.":
    "The report will return to Under review. The previous rejection will be kept in the history.",
  "El reporte volverá a En revisión. El cierre anterior se conservará en el historial.":
    "The report will return to Under review. The previous closure will be kept in the history.",
  "Motivo de reapertura:": "Reopening reason:",
  "El nombre es obligatorio.": "Name is required.",
  "El email es obligatorio.": "Email is required.",
  "Selecciona la entidad responsable para este usuario.":
    "Select the responsible entity for this user.",
  "Usuario actualizado correctamente.": "User updated successfully.",
  "Usuario creado correctamente.": "User created successfully.",
  "No se pudo guardar el usuario.": "Could not save the user.",
  "El nombre es obligatorio": "Name is required",
  "No se pudo cargar el equipo.": "Could not load the team.",
  "No se pudo cambiar el estado.": "Could not change the status.",
  "No se pudo reabrir el reporte.": "Could not reopen the report.",
  "No se pudo asignar la entidad.": "Could not assign the entity.",
  "Reporte no encontrado.": "Report not found.",
  "Cargando reporte...": "Loading report...",
  "Estado actualizado correctamente.": "Status updated successfully.",
  "Reporte reabierto y enviado a revisión.": "Report reopened and sent for review.",
  "Entidad asignada correctamente.": "Entity assigned successfully.",
  "Explica el motivo del rechazo.": "Explain the rejection reason.",
  "Selecciona un motivo de rechazo.": "Select a rejection reason.",
  "Escribe el motivo de reapertura.": "Enter the reopening reason.",
  "No se registró un motivo.": "No reason was recorded.",
  "No se encontraron reportes con esos filtros.": "No reports were found with those filters.",
  "Procesando...": "Processing...",
  "Reporte #{id}": "Report #{id}",
  "Dashboard": "Dashboard",
  "activas": "active",
  "Mínimo 8 caracteres": "At least 8 characters",
  "Guardando...": "Saving...",
  "Nombre o email": "Name or email",
  "Buscar funcionario": "Search official",
  "Filas": "Rows",
  "Resultados": "Results",
  "{n} reportes encontrados": "{n} reports found",
  "Sin resultados": "No results",
  "Consultando reportes...": "Loading reports...",
  "Crear usuario": "Create user",
  "Verificando sesión...": "Checking session...",
  "No se pudieron cargar las entidades.": "Could not load entities.",
  "No se pudo cargar el captcha. Intenta actualizarlo.":
    "Could not load the captcha. Try refreshing it.",
  "No se pudo iniciar sesión. Intenta de nuevo.":
    "Could not sign in. Try again.",
  "Completa el código de verificación.": "Complete the verification code.",
  "Cambiar tema de la interfaz": "Change the interface theme",
  "Aún no hay reportes": "No reports yet",
  "Cuando los ciudadanos empiecen a reportar incidencias, aparecerán aquí.":
    "When citizens start reporting incidents, they will appear here.",
  "No encontramos coincidencias": "No matches found",
  "Prueba con otros filtros o limpia la búsqueda.":
    "Try other filters or clear the search.",
  "No se pudieron cargar los usuarios.": "Could not load users.",
  "No es una incidencia urbana": "Not an urban incident",
  "Información insuficiente": "Insufficient information",
  "Imagen ilegible": "Unreadable image",
  "Ubicación incorrecta": "Incorrect location",
  "Reporte duplicado": "Duplicate report",
  "Otro motivo": "Other reason",
  "Secretaría de Obras Públicas": "Public Works Department",
  "Empresa de Servicios Públicos": "Public Utilities Company",
  "Empresa de Aseo": "Waste Management Company",
  "Error desconocido": "Unknown error",
  "Disminuir tamaño de letra": "Decrease text size",
  "Aumentar tamaño de letra": "Increase text size",
  "Restablecer tamaño de letra": "Reset text size",
  "nombre@municipio.gov.co": "name@municipality.gov.co",
  "usuario@entidad.gov.co": "user@entity.gov.co",
  "funcionario@entidad.gov.co": "official@entity.gov.co",
  "¿Olvidaste tu contraseña?": "Forgot your password?",
  "Recuperación de acceso": "Account recovery",
  "Recupera tu contraseña": "Recover your password",
  "Escribe tu correo y te enviaremos un código de 6 dígitos para crear una nueva contraseña.":
    "Enter your email and we'll send you a 6-digit code to create a new password.",
  "Enviar código": "Send code",
  "Enviando...": "Sending...",
  "Revisa tu correo": "Check your email",
  "Crea una nueva contraseña": "Create a new password",
  "Enviamos un código a {email}. Vence en 10 minutos.":
    "We sent a code to {email}. It expires in 10 minutes.",
  "Código de recuperación": "Recovery code",
  "Escribe el código de 6 dígitos": "Enter the 6-digit code",
  "Nueva contraseña": "New password",
  "Confirmar contraseña": "Confirm password",
  "Repite la nueva contraseña": "Repeat the new password",
  "Restablecer contraseña": "Reset password",
  "Usar otro correo": "Use another email",
  "Listo": "Done",
  "Contraseña actualizada": "Password updated",
  "Ya puedes iniciar sesión con tu nueva contraseña.":
    "You can now sign in with your new password.",
  "Volver al inicio de sesión": "Back to sign in",
  "¿Recordaste tu contraseña?": "Remembered your password?",
  "Las contraseñas no coinciden.": "Passwords do not match.",
  "No se pudo enviar el código. Intenta de nuevo.":
    "Could not send the code. Try again.",
  "No se pudo restablecer la contraseña. Intenta de nuevo.":
    "Could not reset the password. Try again.",
  "El código es inválido o expiró.": "The code is invalid or expired.",
  "Código generado": "Code generated",
  "Entrega este código al usuario por un canal seguro. No se envía por correo.":
    "Give this code to the user through a secure channel. It is not sent by email.",
  "Vence en {minutos} minutos.": "Expires in {minutos} minutes.",
  "Copiar código": "Copy code",
  "Copiado": "Copied",
  "Generar código de recuperación": "Generate recovery code",
  "Recuperar": "Recover",
  "No se pudo generar el código de recuperación.":
    "Could not generate the recovery code.",
  "Generando...": "Generating...",
};

const IDIOMA_KEY = "reporte-urbano-idioma";

export type Idioma = "es" | "en";

interface LanguageContextValue {
  idioma: Idioma;
  locale: string;
  t: (texto: string, valores?: Record<string, string | number>) => string;
  cambiarIdioma: (idioma: Idioma) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function leerIdiomaInicial(): Idioma {
  try {
    return localStorage.getItem(IDIOMA_KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

function interpolar(texto: string, valores?: Record<string, string | number>) {
  if (!valores) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) =>
    valores[clave] === undefined ? `{${clave}}` : String(valores[clave])
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(leerIdiomaInicial);

  useEffect(() => {
    document.documentElement.lang = idioma;
    try {
      localStorage.setItem(IDIOMA_KEY, idioma);
    } catch {
      // La preferencia se mantiene durante la sesión.
    }
  }, [idioma]);

  const cambiarIdioma = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo);
  }, []);

  const t = useCallback(
    (texto: string, valores?: Record<string, string | number>) => {
      const traducido =
        idioma === "en" ? english[texto] ?? extra[texto] ?? texto : texto;
      return interpolar(traducido, valores);
    },
    [idioma]
  );

  const valor = useMemo<LanguageContextValue>(
    () => ({
      idioma,
      locale: idioma === "en" ? "en-US" : "es-CO",
      t,
      cambiarIdioma,
    }),
    [cambiarIdioma, idioma, t]
  );

  return <LanguageContext.Provider value={valor}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const contexto = useContext(LanguageContext);
  if (!contexto) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  }
  return contexto;
}
