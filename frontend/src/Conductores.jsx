import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./Auth";
import {
  API_URL,
  formatearFecha,
  mensajeDeError,
  mensajeDeFallo,
} from "./api";

export function Conductores() {
  const { fetchAuth } = useAuth();
  const [conductores, setConductores] = useState([]);
  const [apellido, setApellido] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Fecha de hoy como AAAA-MM-DD, para detectar licencias vencidas
  const hoy = new Date().toLocaleDateString("sv-SE");

// Consulta la API aplicando el filtro por apellido si tiene texto
  const obtenerConductores = useCallback(async () => {
    setError(null);
    try {
      const url = new URL(`${API_URL}/conductores`);
      if (apellido.trim()) {
        url.searchParams.append("apellido", apellido.trim());
      }

      const response = await fetchAuth(url);
      if (!response.ok) {
        throw new Error(mensajeDeError(await response.json()));
      }

      setConductores(await response.json());
    } catch (err) {
      setError(mensajeDeFallo(err));
      setConductores([]);
    } finally {
      setCargando(false);
    }
  }, [apellido, fetchAuth]);

// Se ejecuta al montar el componente y cada vez que cambia el filtro de apellido
  useEffect(() => {
    obtenerConductores();
  }, [obtenerConductores]);

// Solicita confirmacion al usuario y envia la peticion DELETE para borrar el conductor
const eliminar = async (conductor) => {
    const confirmado = window.confirm(
      `¿Eliminar al conductor ${conductor.apellido}, ${conductor.nombre}?`,
    );
    // Si el usuario cancela el cuadro de dialogo, se interrumpe la accion
    if (!confirmado) {
      return;
    }

    setError(null);
    try {
      const response = await fetchAuth(
        `${API_URL}/conductores/${conductor.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setError(mensajeDeError(await response.json()));
        return;
      }

// Recarga el listado desde la API para reflejar el cambio en la tabla
      obtenerConductores();
    } catch (err) {
      setError(mensajeDeFallo(err));
    }
  };

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Conductores</h1>
        <Link className="boton" to="/conductores/nuevo">
          Nuevo conductor
        </Link>
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="apellido">Filtrar por apellido:</label>
          <input
            id="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}
      {cargando && <p className="sin-datos">Cargando...</p>}
      {!cargando && !error && conductores.length === 0 && (
        <p className="sin-datos">No hay conductores para mostrar.</p>
      )}

      {conductores.length > 0 && (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Licencia</th>
                <th>Alta de licencia</th>
                <th>Vencimiento de licencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conductores.map((conductor) => (
                <tr key={conductor.id}>
                  <td>{conductor.apellido}</td>
                  <td>{conductor.nombre}</td>
                  <td>{conductor.numeroDocumento}</td>
                  <td>{conductor.numeroLicencia}</td>
                  <td>{formatearFecha(conductor.fechaAltaLicencia)}</td>
                  <td>
                    {formatearFecha(conductor.fechaVencimientoLicencia)}
                    {conductor.fechaVencimientoLicencia < hoy && (
                      <span className="vencida"> (vencida)</span>
                    )}
                  </td>
                  <td>
                    <div className="acciones">
                      <Link
                        className="boton secundario"
                        to={`/conductores/${conductor.id}/editar`}
                      >
                        Editar
                      </Link>
                      <button
                      className="peligro"
                      onClick={() => eliminar(conductor)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}