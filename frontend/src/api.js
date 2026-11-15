export const API_URL = "http://localhost:3000";

// Arma un mensaje legible a partir de las respuestas de error del backend
export function mensajeDeError(datos) {
  if (datos?.errores?.length) {
    return datos.errores.map((e) => e.msg).join(". ");
  }
  return datos?.error ?? datos?.mensaje ?? "Ocurrió un error inesperado";
}