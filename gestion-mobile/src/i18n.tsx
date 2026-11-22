import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";

import { guardarValor, leerValor } from "./storage";
import { themes } from "./theme";

export type Idioma = "es" | "en";

const IDIOMA_KEY = "reporte-urbano-idioma";

const ingles: Record<string, string> = {
  "Inicia sesión": "Sign in",
  "Iniciar sesión": "Sign in",
  "Correo electrónico": "Email address",
  "Contraseña": "Password",
  "Tu nombre": "Your name",
  "Mínimo 8 caracteres": "At least 8 characters",
  "Código de verificación": "Verification code",
  "tu@correo.com": "you@email.com",
  "Verificación": "Verification",
  "Tu contraseña": "Your password",
  "Actualizar": "Refresh",
  "Entrar a mi cuenta": "Sign in to my account",
  "Ingresando...": "Signing in...",
  "¿No tienes cuenta?": "Don't have an account?",
  "¿No tienes cuenta? ": "Don't have an account? ",
  "Regístrate": "Create account",
  "Bienvenido": "Welcome",
  "Usa el correo y la contraseña de tu cuenta ciudadana.":
    "Use your citizen account email and password.",
  "Tu ciudad, más cerca de ti.": "Your city, closer to you.",
  "FLORENCIA, CAQUETÁ": "FLORENCIA, CAQUETÁ",
  "Reporta incidencias, adjunta una foto y sigue el estado de tu caso.":
    "Report incidents, attach a photo, and follow your case status.",
  "Servicio ciudadano": "Citizen service",
  "Reporte Urbano": "Reporte Urbano",
  "Gestión de incidencias": "Incident management",
  "Reporte Urbano · Plataforma de gestión de incidencias urbanas":
    "Reporte Urbano · Urban incident management platform",
  "Reportar también construye ciudad": "Reporting also builds the city",
  "REPORTE URBANO": "URBAN REPORT",
  "BIENVENIDO": "WELCOME",
  "NUEVA CUENTA": "NEW ACCOUNT",
  "Haz oír tu ciudad.": "Make your city heard.",
  "Crea tu cuenta para reportar incidencias y consultar el estado de tus casos.":
    "Create your account to report incidents and check the status of your cases.",
  "Crear mi cuenta": "Create my account",
  "¿Ya tienes cuenta?": "Already have an account?",
  "¿Ya tienes cuenta? ": "Already have an account? ",
  "Nombre completo": "Full name",
  "Volver": "Back",
  "Ir al perfil": "Go to profile",
  "Tu ciudad está esperando tu primer reporte": "Your city is waiting for your first report",
  "Actualizar captcha": "Refresh captcha",
  "Escribe el código de la imagen": "Enter the code from the image",
  "HISTORIAL DE ESTADOS": "STATUS HISTORY",
  "Este reporte no tiene movimientos de estado registrados.":
    "This report has no recorded status changes.",
  "El ciudadano puede consultar el estado del caso. Los cambios de estado los realiza el equipo municipal.":
    "The citizen can check the case status. Status changes are made by the municipal team.",
  "Entidad responsable": "Responsible entity",
  "Reporte padre": "Parent report",
  "Cambiar tema de la aplicación": "Change the application theme",
  "Sin ubicación": "No location",
  "Ninguno": "None",
  "Punto del reporte": "Report point",
  "Cada incidencia que envías ayuda a priorizar el mantenimiento de los espacios públicos.":
    "Every incident you report helps prioritize public space maintenance.",
  "Nombre": "Name",
  "Rol": "Role",
  "Entidad": "Entity",
  "Ciudadano": "Citizen",
  "Funcionario": "Official",
  "Administrador": "Administrator",
  "Empresa": "Company",
  "¿Olvidaste tu contraseña?": "Forgot your password?",
  "Recuperación de acceso": "Account recovery",
  "Recupera tu contraseña": "Recover your password",
  "Escribe tu correo y te enviaremos un código de 6 dígitos para crear una nueva contraseña.":
    "Enter your email and we'll send you a 6-digit code to create a new password.",
  "Enviar código": "Send code",
  "Enviando...": "Sending...",
  "Guardando...": "Saving...",
  "Listo": "Done",
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
  "Contraseña actualizada": "Password updated",
  "Ya puedes iniciar sesión con tu nueva contraseña.":
    "You can now sign in with your new password.",
  "Tu contraseña se cambió correctamente.": "Your password was changed successfully.",
  "Volver al inicio de sesión": "Back to sign in",
  "¿Recordaste tu contraseña?": "Remembered your password?",
  "Las contraseñas no coinciden.": "Passwords do not match.",
  "No se pudo enviar el código. Intenta de nuevo.":
    "Could not send the code. Try again.",
  "No se pudo restablecer la contraseña. Intenta de nuevo.":
    "Could not reset the password. Try again.",
  "El código es inválido o expiró.": "The code is invalid or expired.",
  "Cerrar sesión": "Sign out",
  "Perfil": "Profile",
  "TU CUENTA": "YOUR ACCOUNT",
  "Información de tu cuenta ciudadana.": "Your citizen account information.",
  "Versión 1.0": "Version 1.0",
  "Reporte Urbano · Versión 1.0": "Reporte Urbano · Version 1.0",
  "Apariencia": "Appearance",
  "Tema de la interfaz": "Interface theme",
  "Cambia entre la apariencia clara y oscura del panel.":
    "Switch between the light and dark appearance.",
  "Tema oscuro": "Dark mode",
  "Cambia la apariencia de Reporte Urbano.": "Change the appearance of Reporte Urbano.",
  "Tamaño de letra": "Text size",
  "Ajusta el texto de la app.": "Adjust the app text.",
  "Disminuir tamaño de letra": "Decrease text size",
  "Aumentar tamaño de letra": "Increase text size",
  "Restablecer tamaño de letra": "Reset text size",
  "Idioma": "Language",
  "Elige el idioma de la aplicación.": "Choose the application language.",
  "Español": "Spanish",
  "English": "English",
  "Permiso necesario": "Permission required",
  "Activa el acceso a la cámara o a tus fotos para adjuntar la evidencia.":
    "Allow camera or photo access to attach evidence.",
  "Cancelar": "Cancel",
  "Abrir ajustes": "Open settings",
  "Necesitamos tu ubicación para registrar el punto de la incidencia.":
    "We need your location to record the incident point.",
  "No se pudo abrir la cámara o la galería.": "Could not open the camera or gallery.",
  "No se pudo obtener tu ubicación. Intenta de nuevo.":
    "Could not get your location. Try again.",
  "No se pudo enviar el reporte.": "Could not submit the report.",
  "No se pudo cargar el captcha.": "Could not load the captcha.",
  "Completa el código de verificación.": "Complete the verification code.",
  "Sin captcha": "No captcha",
  "Cargando...": "Loading...",
  "FICHA DEL REPORTE": "REPORT DETAILS",
  "Severidad": "Severity",
  "Confianza IA": "AI confidence",
  "Prioridad": "Priority",
  "ID del sitio": "Site ID",
  "Distancia al sitio": "Distance to site",
  "Imagen no disponible": "Image unavailable",
  "Incidencia urbana": "Urban incident",
  "Sin datos": "No data",
  "Reporte": "Report",
  "Estado": "Status",
  "Fecha": "Date",
  "1 reporte en tu cuenta": "1 report in your account",
  "{n} reportes en tu cuenta": "{n} reports in your account",
  "Elige el idioma de la aplicación": "Choose the application language",
  "Hola, {nombre}": "Hi, {nombre}",
  "Hola, Smoke": "Hi, Smoke",
  "Florencia, Caquetá": "Florencia, Caquetá",
  "Una foto puede mejorar tu ciudad.": "A photo can improve your city.",
  "Cuéntanos qué está pasando. La IA te ayuda a clasificar la incidencia.":
    "Tell us what is happening. AI helps classify the incident.",
  "Reportar una incidencia": "Report an incident",
  "Foto": "Photo",
  "Ubicación": "Location",
  "Envío": "Submit",
  "Mis reportes": "My reports",
  "Sigue el estado de tus casos": "Follow your case status",
  "Últimos reportes": "Latest reports",
  "Ver todos": "View all",
  "Cargando tus reportes...": "Loading your reports...",
  "Cargando más reportes...": "Loading more reports...",
  "No pudimos cargar tus reportes": "We couldn't load your reports",
  "No se pudieron cargar tus reportes.": "Could not load your reports.",
  "Si ves un hueco, una fuga o una luminaria apagada, cuéntanos con una foto.":
    "If you see a pothole, a leak, or a broken streetlight, tell us with a photo.",
  "No se pudo cargar el reporte.": "Could not load the report.",
  "Reporte no encontrado": "Report not found",
  "No disponible": "Not available",
  "Barrio": "Neighborhood",
  "Reintentar": "Retry",
  "Sin conexión": "No connection",
  "TU HISTORIAL": "YOUR HISTORY",
  "Aquí verás el estado de las incidencias que reportes.":
    "Here you'll see the status of the incidents you report.",
  "Aún no tienes reportes": "You don't have any reports yet",
  "Cuando reportes una incidencia, aparecerá aquí con su estado y seguimiento.":
    "When you report an incident, it will appear here with its status and follow-up.",
  "Cargando tu reporte...": "Loading your report...",
  "Algo no salió bien": "Something went wrong",
  "Sin clasificar": "Unclassified",
  "Sin barrio": "No neighborhood",
  "Sin descripción": "No description",
  "NUEVO REPORTE": "NEW REPORT",
  "Adjunta una foto": "Attach a photo",
  "Confirma el lugar": "Confirm the location",
  "Revisa y envía": "Review and submit",
  "Una imagen clara ayuda a clasificar mejor la incidencia. Puedes tomarla en el momento o elegirla de tu galería.":
    "A clear image helps classify the incident. You can take it now or choose one from your gallery.",
  "Tu foto es la evidencia": "Your photo is the evidence",
  "Procura que se vea el problema y el contexto del lugar.":
    "Make sure the problem and the place are visible.",
  "Tomar foto": "Take photo",
  "Elegir de galería": "Choose from gallery",
  "Cambiar foto": "Change photo",
  "Continuar": "Continue",
  "Necesitamos la ubicación exacta para enviar el caso a la entidad responsable.":
    "We need the exact location to send the case to the responsible entity.",
  "Ubicación lista": "Location ready",
  "Aún no tenemos tu ubicación": "We don't have your location yet",
  "Activa el GPS del dispositivo para registrar el punto.":
    "Turn on your device GPS to record the point.",
  "Punto capturado": "Point captured",
  "Actualizar ubicación": "Update location",
  "Usar mi ubicación": "Use my location",
  "Tu ubicación solo se usa para ubicar el reporte.":
    "Your location is only used to locate the report.",
  "UBICACIÓN": "LOCATION",
  "CLASIFICACIÓN": "CLASSIFICATION",
  "La IA completará categoría y severidad": "AI will complete category and severity",
  "Descripción (opcional)": "Description (optional)",
  "Cuéntanos qué está pasando...": "Tell us what is happening...",
  "El asistente de IA analizará la imagen para sugerir la categoría y la severidad del reporte.":
    "The AI assistant will analyze the image to suggest the report category and severity.",
  "Enviar reporte": "Submit report",
  "La contraseña debe tener al menos 8 caracteres.":
    "The password must be at least 8 characters.",
  "La contraseña debe tener al menos 8 caracteres":
    "The password must be at least 8 characters",
  "No se pudo iniciar sesión.": "Could not sign in.",
  "No se pudo crear la cuenta.": "Could not create the account.",
  "REPORTE ENVIADO": "REPORT SENT",
  "Gracias por cuidar tu ciudad.": "Thank you for caring for your city.",
  "Tu reporte fue recibido y será revisado por el equipo municipal.":
    "Your report was received and will be reviewed by the municipal team.",
  "Número de reporte": "Report number",
  "Estado inicial": "Initial status",
  "Entidad asignada": "Assigned entity",
  "Por asignar": "To be assigned",
  "Ver mi reporte": "View my report",
  "Volver al inicio": "Back to home",
  "REPORTE": "REPORT",
  "REPORTE #{id}": "REPORT #{id}",
  "Reportado el": "Reported on",
  "DESCRIPCIÓN": "DESCRIPTION",
  "El reporte no incluye una descripción adicional.":
    "The report does not include an additional description.",
  "Reporte rechazado": "Report rejected",
  "No se registró un motivo.": "No reason was recorded.",
  "Historial": "History",
  "Historial de estados": "Status history",
  "Motivo de reapertura: {motivo}": "Reopening reason: {motivo}",
  "Asignaciones": "Assignments",
  "Cargando historial...": "Loading history...",
  "No hay historial de estados.": "No status history.",
  "No hay asignaciones registradas.": "No assignments recorded.",
  "INFORMACIÓN": "INFORMATION",
  "Este reporte fue creado desde la app móvil.":
    "This report was created from the mobile app.",
  "Hueco en la vía": "Pothole",
  "Fuga de agua": "Water leak",
  "Falla de alumbrado": "Streetlight failure",
  "Acumulación de basura": "Garbage accumulation",
  "Pendiente": "Pending",
  "En revisión": "Under review",
  "Asignado": "Assigned",
  "Resuelto": "Resolved",
  "Rechazado": "Rejected",
  "Baja": "Low",
  "Media": "Medium",
  "Alta": "High",
  "Crítica": "Critical",
  "Sin calcular": "Not calculated",
  "Reportes": "Reports",
  "Inicio": "Home",
  "Reportar": "Report",
  "Mapa": "Map",
  "Entidades": "Entities",
  "Usuarios": "Users",
  "Mi equipo": "My team",
  "Sesión activa": "Active session",
  "Panel autenticado": "Authenticated panel",
  "Operación": "Operation",
};

interface LanguageContextValue {
  idioma: Idioma;
  locale: string;
  t: (texto: string, valores?: Record<string, string | number>) => string;
  cambiarIdioma: (idioma: Idioma) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolar(texto: string, valores?: Record<string, string | number>) {
  if (!valores) return texto;
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) =>
    valores[clave] === undefined ? `{${clave}}` : String(valores[clave])
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    leerValor(IDIOMA_KEY)
      .then((guardado) => {
        if (activo && (guardado === "es" || guardado === "en")) {
          setIdioma(guardado);
        }
      })
      .catch(() => {
        // Se mantiene español por defecto.
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const cambiarIdioma = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo);
    void guardarValor(IDIOMA_KEY, nuevo);
  }, []);

  const t = useCallback(
    (texto: string, valores?: Record<string, string | number>) => {
      const traducido = idioma === "en" ? ingles[texto] ?? texto : texto;
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

  if (cargando) {
    return <View style={{ flex: 1, backgroundColor: themes.light.bg }} />;
  }

  return <LanguageContext.Provider value={valor}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const contexto = useContext(LanguageContext);
  if (!contexto) {
    throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  }
  return contexto;
}
