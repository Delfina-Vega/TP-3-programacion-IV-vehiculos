import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./Auth";
import { API_URL, mensajeDeError, mensajeDeFallo } from "./api";

export function Vehiculos() {
  const { fetchAuth } = useAuth();
  // Estados para la lista de vehiculos, el filtro de busqueda y el control de carga/errores
  const [vehiculos, setVehiculos] = useState([]);
  const [marca, setMarca] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Consulta los vehículos al backend aplicando el filtro por marca si existe
  const obtenerVehiculos = useCallback(async () => {
    setError(null);
    try {
      const url = new URL(`${API_URL}/vehiculos`);
      if (marca.trim()) {
        url.searchParams.append("marca", marca.trim());
      }

      const response = await fetchAuth(url);
      if (!response.ok) {
        throw new Error(mensajeDeError(await response.json()));
      }

      setVehiculos(await response.json());
    } catch (err) {
      setError(mensajeDeFallo(err));
      setVehiculos([]);
    } finally {
      setCargando(false);
    }
  }, [marca, fetchAuth]);

  useEffect(() => {
    obtenerVehiculos();
  }, [obtenerVehiculos]);

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Vehículos</h1>
        <Link className="boton" to="/vehiculos/nuevo">
          Nuevo vehículo
        </Link>
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="marca">Filtrar por marca:</label>
          <input
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}
      {cargando && <p className="sin-datos">Cargando...</p>}
      {!cargando && !error && vehiculos.length === 0 && (
        <p className="sin-datos">No hay vehiculos para mostrar.</p>
      )}

      {vehiculos.length > 0 && (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Capacidad de carga (kg)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td>{vehiculo.patente}</td>
                  <td>{vehiculo.marca}</td>
                  <td>{vehiculo.modelo}</td>
                  <td>{vehiculo.anio}</td>
                  <td>{vehiculo.capacidadCarga.toLocaleString("es-AR")}</td>
                  <td>
                    <div className="acciones">
                      <Link
                        className="boton secundario"
                        to={`/vehiculos/${vehiculo.id}/editar`}
                      >
                        Editar
                      </Link>
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