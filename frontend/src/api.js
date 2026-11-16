export const API_URL = "http://localhost:3000";

// Arma un mensaje legible a partir de las respuestas de error del backend
export function mensajeDeError(datos) {
  if (datos?.errores?.length) {
    return datos.errores.map((e) => e.msg).join(". ");
  }
  return datos?.error ?? datos?.mensaje ?? "Ocurrió un error inesperado";
}

// Mensaje para errores de red o excepciones al llamar a la API
export function mensajeDeFallo(err) {
  return err instanceof TypeError
    ? "No se pudo conectar con el servidor"
    : err.message;
}

// Convierte 2026-11-14 en 14/11/2026, sin usar Date, para evitar problemas de zona horaria
export function formatearFecha(fecha) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}