import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { Campo } from "./Campo";
import { useCatalogos } from "./useCatalogos";
import { API_URL, mensajeDeError, mensajeDeFallo } from "./api";

const VACIO = {
  vehiculoId: "",
  conductorId: "",
  fechaSalida: "",
  fechaLlegada: "",
  origen: "",
  destino: "",
  kilometros: "",
  observaciones: "",
};

export function ViajeForm() {
    // Detecta si la ruta tiene un 'id' para alternar entre modo edicion y registro nuevo
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const { fetchAuth } = useAuth();
  // Carga los listados de vehiculos y conductores para poblar los <select>
  const catalogos = useCatalogos();
  const navigate = useNavigate();

  // Estados para los valores del formulario, validaciones y control de peticiones
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);

  // En modo edición, se cargan los datos actuales del viaje
  useEffect(() => {
    if (!esEdicion) {
      return;
    }

    const cargarViaje = async () => {
      try {
        const response = await fetchAuth(`${API_URL}/viajes/${id}`);
        if (!response.ok) {
          throw new Error(mensajeDeError(await response.json()));
        }

        const viaje = await response.json();
    // Se convierten los IDs y numeros a string para vincularlos con los inputs y selects
        setDatos({
          vehiculoId: String(viaje.vehiculoId),
          conductorId: String(viaje.conductorId),
          fechaSalida: viaje.fechaSalida,
          fechaLlegada: viaje.fechaLlegada,
          origen: viaje.origen,
          destino: viaje.destino,
          kilometros: String(viaje.kilometros),
          observaciones: viaje.observaciones ?? "",
        });
      } catch (err) {
        setErrorCarga(mensajeDeFallo(err));
      } finally {
        setCargando(false);
      }
    };

    cargarViaje();
  }, [id, esEdicion, fetchAuth]);

// Actualiza dinamicamente el campo modificado en el estado
  const cambiar = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    const origen = datos.origen.trim();
    const destino = datos.destino.trim();
    const kilometros = Number(datos.kilometros);

    if (!datos.vehiculoId) {
      nuevos.vehiculoId = "Seleccioná un vehículo";
    }

    if (!datos.conductorId) {
      nuevos.conductorId = "Seleccioná un conductor";
    }

    if (!datos.fechaSalida) {
      nuevos.fechaSalida = "La fecha de salida es obligatoria";
    }

// Al estar en formato ISO AAAA-MM-DDTHH:mm, se pueden comparar directamente como texto
    if (!datos.fechaLlegada) {
      nuevos.fechaLlegada = "La fecha de llegada es obligatoria";
    } else if (datos.fechaSalida && datos.fechaLlegada < datos.fechaSalida) {
      nuevos.fechaLlegada = "La llegada no puede ser anterior a la salida";
    }

    if (!origen) {
      nuevos.origen = "El origen es obligatorio";
    } else if (origen.length > 100) {
      nuevos.origen = "El origen admite hasta 100 caracteres";
    }

    if (!destino) {
      nuevos.destino = "El destino es obligatorio";
    } else if (destino.length > 100) {
      nuevos.destino = "El destino admite hasta 100 caracteres";
    }

    if (datos.kilometros === "") {
      nuevos.kilometros = "Los kilómetros son obligatorios";
    } else if (!(kilometros > 0) || kilometros > 99999999) {
      nuevos.kilometros = "Los kilómetros deben ser un número mayor a 0";
    }

    if (datos.observaciones.length > 1000) {
      nuevos.observaciones = "Las observaciones admiten hasta 1000 caracteres";
    }

    return nuevos;
  };

  // Procesa el envio, valida datos, elige PUT o POST segun el modo y redirige al guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServidor(null);

    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      const response = await fetchAuth(
        esEdicion ? `${API_URL}/viajes/${id}` : `${API_URL}/viajes`,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehiculoId: Number(datos.vehiculoId),
            conductorId: Number(datos.conductorId),
            fechaSalida: datos.fechaSalida,
            fechaLlegada: datos.fechaLlegada,
            origen: datos.origen.trim(),
            destino: datos.destino.trim(),
            kilometros: Number(datos.kilometros),
            observaciones: datos.observaciones.trim(),
          }),
        },
      );

      if (!response.ok) {
        setErrorServidor(mensajeDeError(await response.json()));
        return;
      }

      navigate("/viajes");
    } catch (err) {
      setErrorServidor(mensajeDeFallo(err));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <p className="sin-datos">Cargando...</p>;
  }

  if (errorCarga) {
    return (
      <>
        <p className="alerta alerta-error">{errorCarga}</p>
        <Link className="boton secundario" to="/viajes">
          Volver
        </Link>
      </>
    );
  }

 // Verifica si ya termino de cargar los catalogos y falta al menos un vehiculo o conductor
  const faltanDatos =
    !catalogos.cargando &&
    !catalogos.error &&
    (catalogos.vehiculos.length === 0 || catalogos.conductores.length === 0);

  return (
    <>
      <h2>{esEdicion ? "Modificar viaje" : "Registrar viaje"}</h2>

      {catalogos.error && (
        <p className="alerta alerta-error">{catalogos.error}</p>
      )}
      {faltanDatos && (
        <p className="alerta alerta-error">
          Para registrar un viaje necesitás tener al menos un vehículo y un
          conductor cargados.
        </p>
      )}

      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <Campo id="vehiculoId" etiqueta="Vehículo:" error={errores.vehiculoId}>
          <select
            id="vehiculoId"
            value={datos.vehiculoId}
            onChange={cambiar("vehiculoId")}
          >
            <option value="">Seleccioná un vehiculo</option>
            {catalogos.vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente} - {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          id="conductorId"
          etiqueta="Conductor:"
          error={errores.conductorId}
        >
          <select
            id="conductorId"
            value={datos.conductorId}
            onChange={cambiar("conductorId")}
          >
            <option value="">Seleccioná un conductor</option>
            {catalogos.conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.apellido}, {c.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          id="fechaSalida"
          etiqueta="Fecha y hora de salida:"
          type="datetime-local"
          value={datos.fechaSalida}
          onChange={cambiar("fechaSalida")}
          error={errores.fechaSalida}
        />
        <Campo
          id="fechaLlegada"
          etiqueta="Fecha y hora de llegada:"
          type="datetime-local"
          value={datos.fechaLlegada}
          onChange={cambiar("fechaLlegada")}
          error={errores.fechaLlegada}
        />
        <Campo
          id="origen"
          etiqueta="Origen:"
          value={datos.origen}
          onChange={cambiar("origen")}
          error={errores.origen}
        />
        <Campo
          id="destino"
          etiqueta="Destino:"
          value={datos.destino}
          onChange={cambiar("destino")}
          error={errores.destino}
        />
        <Campo
          id="kilometros"
          etiqueta="Kilómetros recorridos:"
          type="number"
          step="0.01"
          value={datos.kilometros}
          onChange={cambiar("kilometros")}
          error={errores.kilometros}
        />

        <Campo
          id="observaciones"
          etiqueta="Observaciones (opcional):"
          error={errores.observaciones}
        >
          <textarea
            id="observaciones"
            rows={3}
            value={datos.observaciones}
            onChange={cambiar("observaciones")}
          />
        </Campo>

        {errorServidor && <p className="alerta alerta-error">{errorServidor}</p>}

        <div className="acciones">
          <button type="submit" disabled={enviando}>
            Guardar
          </button>
          <Link className="boton secundario" to="/viajes">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}