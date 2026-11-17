import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "./Auth";
import { useCatalogos } from "./useCatalogos";
import {
  API_URL,
  formatearFechaHora,
  mensajeDeError,
  mensajeDeFallo,
} from "./api";

export function Viajes() {
  const { fetchAuth } = useAuth();

  //Carga los listados de vehiculos y conductores para poblar los filtros desplegables
  const catalogos = useCatalogos();
  const [searchParams, setSearchParams] = useSearchParams();

  // Los filtros viven en la URL: /viajes?vehiculoId=1&conductorId=2
  const vehiculoId = searchParams.get("vehiculoId") ?? "";
  const conductorId = searchParams.get("conductorId") ?? "";

  const [viajes, setViajes] = useState([]);
  const [total, setTotal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Obtiene el historial de viajes y el resumen de kilometros aplicando los filtros activos
  const obtenerViajes = useCallback(async () => {
    setError(null);
    try {
      const parametros = new URLSearchParams();
      if (vehiculoId) {
        parametros.set("vehiculoId", vehiculoId);
      }
      if (conductorId) {
        parametros.set("conductorId", conductorId);
      }
      const consulta = parametros.toString() ? `?${parametros}` : "";

      // Listado (historial) y total de kilometros con los mismos filtros
      const [resViajes, resTotal] = await Promise.all([
        fetchAuth(`${API_URL}/viajes${consulta}`),
        fetchAuth(`${API_URL}/viajes/kilometros${consulta}`),
      ]);

      if (!resViajes.ok) {
        throw new Error(mensajeDeError(await resViajes.json()));
      }
      if (!resTotal.ok) {
        throw new Error(mensajeDeError(await resTotal.json()));
      }

      setViajes(await resViajes.json());
      setTotal(await resTotal.json());
    } catch (err) {
      setError(mensajeDeFallo(err));
      setViajes([]);
      setTotal(null);
    } finally {
      setCargando(false);
    }
  }, [vehiculoId, conductorId, fetchAuth]);

  useEffect(() => {
    obtenerViajes();
  }, [obtenerViajes]);

  // Actualiza o elimina el parametro correspondiente en la URL cuando cambia un desplegable
  const cambiarFiltro = (campo) => (e) => {
    const nuevos = new URLSearchParams(searchParams);
    if (e.target.value) {
      nuevos.set(campo, e.target.value);
    } else {
      nuevos.delete(campo);
    }
    setSearchParams(nuevos);
  };

  const eliminar = async (viaje) => {
    const confirmado = window.confirm(
      `¿Eliminar el viaje de ${viaje.origen} a ${viaje.destino} (${formatearFechaHora(viaje.fechaSalida)})?`,
    );
    if (!confirmado) {
      return;
    }

    setError(null);
    try {
      const response = await fetchAuth(`${API_URL}/viajes/${viaje.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(mensajeDeError(await response.json()));
        return;
      }

      obtenerViajes();
    } catch (err) {
      setError(mensajeDeFallo(err));
    }
  };

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Viajes</h1>
        <Link className="boton" to="/viajes/nuevo">
          Registrar viaje
        </Link>
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="filtroVehiculo">Vehículo:</label>
          <select
            id="filtroVehiculo"
            value={vehiculoId}
            onChange={cambiarFiltro("vehiculoId")}
          >
            <option value="">Todos</option>
            {catalogos.vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente} - {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtroConductor">Conductor:</label>
          <select
            id="filtroConductor"
            value={conductorId}
            onChange={cambiarFiltro("conductorId")}
          >
            <option value="">Todos</option>
            {catalogos.conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.apellido}, {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <button className="secundario" onClick={() => setSearchParams({})}>
          Limpiar filtros
        </button>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}
      {catalogos.error && (
        <p className="alerta alerta-error">{catalogos.error}</p>
      )}

      {total && (
        <div className="resumen">
          <div>
            <strong>{total.cantidadViajes}</strong>
            viajes
          </div>
          <div>
            <strong>{total.totalKilometros.toLocaleString("es-AR")} km</strong>
            recorridos en total
          </div>
        </div>
      )}

      {cargando && <p className="sin-datos">Cargando...</p>}
      {!cargando && !error && viajes.length === 0 && (
        <p className="sin-datos">No hay viajes para mostrar.</p>
      )}

      {viajes.length > 0 && (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Salida</th>
                <th>Llegada</th>
                <th>Vehículo</th>
                <th>Conductor</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Km</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((viaje) => (
                <tr key={viaje.id}>
                  <td>{formatearFechaHora(viaje.fechaSalida)}</td>
                  <td>{formatearFechaHora(viaje.fechaLlegada)}</td>
                  <td>
                    {viaje.patente} ({viaje.marca} {viaje.modelo})
                  </td>
                  <td>
                    {viaje.conductorApellido}, {viaje.conductorNombre}
                  </td>
                  <td>{viaje.origen}</td>
                  <td>{viaje.destino}</td>
                  <td>{Number(viaje.kilometros).toLocaleString("es-AR")}</td>
                  <td className="observaciones">{viaje.observaciones}</td>
                  <td>
                    <div className="acciones">
                      <Link
                        className="boton secundario"
                        to={`/viajes/${viaje.id}/editar`}
                      >
                        Editar
                      </Link>

                    </div>
                  </td><button
                        className="peligro"
                        onClick={() => eliminar(viaje)}
                      >
                        Eliminar
                      </button>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}