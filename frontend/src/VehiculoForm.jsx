import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL, mensajeDeError, mensajeDeFallo } from "./api";

const VACIO = {
  marca: "",
  modelo: "",
  patente: "",
  anio: "",
  capacidadCarga: "",
};

// Se utiliza formatos de patente argentinos, ABC123 y AB123CD 
const FORMATO_PATENTE = /^([A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$/;

export function VehiculoForm() {
 // Si hay un id en la URL, el formulario funciona en modo edicion, si no, en modo creacion
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();

// Estados para los valores del formulario, validaciones y control de peticiones
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);

// En modo edicion, se cargan los datos actuales del vehiculo
  useEffect(() => {
    if (!esEdicion) {
      return;
    }

    const cargarVehiculo = async () => {
      try {
        const response = await fetchAuth(`${API_URL}/vehiculos/${id}`);
        if (!response.ok) {
          throw new Error(mensajeDeError(await response.json()));
        }

// Se convierten los numeros a string para compatibilidad con los inputs
        const vehiculo = await response.json();
        setDatos({
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          patente: vehiculo.patente,
          anio: String(vehiculo.anio),
          capacidadCarga: String(vehiculo.capacidadCarga),
        });
      } catch (err) {
        setErrorCarga(mensajeDeFallo(err));
      } finally {
        setCargando(false);
      }
    };

    cargarVehiculo();
  }, [id, esEdicion, fetchAuth]);

// Actualiza dinamicamente el campo modificado en el estado
  const cambiar = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

// Valida los campos antes de enviar y devuelve un objeto con los errores encontrados
  const validar = () => {
    const nuevos = {};
    const marca = datos.marca.trim();
    const modelo = datos.modelo.trim();
    const patente = datos.patente.trim().toUpperCase();
    const anioMaximo = new Date().getFullYear() + 1;
    const anio = Number(datos.anio);
    const capacidad = Number(datos.capacidadCarga);

    if (!marca) {
      nuevos.marca = "La marca es obligatoria";
    } else if (marca.length > 45) {
      nuevos.marca = "La marca admite hasta 45 caracteres";
    }

    if (!modelo) {
      nuevos.modelo = "El modelo es obligatorio";
    } else if (modelo.length > 45) {
      nuevos.modelo = "El modelo admite hasta 45 caracteres";
    }

    if (!patente) {
      nuevos.patente = "La patente es obligatoria";
    } else if (!FORMATO_PATENTE.test(patente)) {
      nuevos.patente = "Patente inválida (formato ABC123 o AB123CD)";
    }

    if (datos.anio === "") {
      nuevos.anio = "El año es obligatorio";
    } else if (!Number.isInteger(anio) || anio < 1900 || anio > anioMaximo) {
      nuevos.anio = `El año debe ser un número entre 1900 y ${anioMaximo}`;
    }

    if (datos.capacidadCarga === "") {
      nuevos.capacidadCarga = "La capacidad de carga es obligatoria";
    } else if (!(capacidad > 0) || capacidad > 99999999) {
      nuevos.capacidadCarga = "La capacidad de carga debe ser mayor a 0";
    }

    return nuevos;
  };

//Procesa el envio: valida datos, elige POST o PUT segun el modo y redirige al guardar
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
        esEdicion ? `${API_URL}/vehiculos/${id}` : `${API_URL}/vehiculos`,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            marca: datos.marca.trim(),
            modelo: datos.modelo.trim(),
            patente: datos.patente.trim().toUpperCase(),
            anio: Number(datos.anio),
            capacidadCarga: Number(datos.capacidadCarga),
          }),
        },
      );

      if (!response.ok) {
        setErrorServidor(mensajeDeError(await response.json()));
        return;
      }

      navigate("/vehiculos");
    } catch (err) {
      setErrorServidor(mensajeDeFallo(err));
    } finally {
      setEnviando(false);
    }
  };

//Renderizados condicionales mientras carga o si falla la busqueda inicial
  if (cargando) {
    return <p className="sin-datos">Cargando...</p>;
  }

  if (errorCarga) {
    return (
      <>
        <p className="alerta alerta-error">{errorCarga}</p>
        <Link className="boton secundario" to="/vehiculos">
          Volver
        </Link>
      </>
    );
  }

  return (
    <>
      <h2>{esEdicion ? "Modificar vehiculo" : "Nuevo vehículo"}</h2>
      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <div className="campo">
          <label htmlFor="marca">Marca:</label>
          <input id="marca" value={datos.marca} onChange={cambiar("marca")} />
          {errores.marca && <p className="error">{errores.marca}</p>}
        </div>

        <div className="campo">
          <label htmlFor="modelo">Modelo:</label>
          <input
            id="modelo"
            value={datos.modelo}
            onChange={cambiar("modelo")}
          />
          {errores.modelo && <p className="error">{errores.modelo}</p>}
        </div>

        <div className="campo">
          <label htmlFor="patente">Patente:</label>
          <input
            id="patente"
            maxLength={7}
            value={datos.patente}
            onChange={(e) =>
              setDatos((d) => ({ ...d, patente: e.target.value.toUpperCase() }))
            }
          />
          {errores.patente && <p className="error">{errores.patente}</p>}
        </div>

        <div className="campo">
          <label htmlFor="anio">Año:</label>
          <input
            id="anio"
            type="number"
            value={datos.anio}
            onChange={cambiar("anio")}
          />
          {errores.anio && <p className="error">{errores.anio}</p>}
        </div>

        <div className="campo">
          <label htmlFor="capacidadCarga">Capacidad de carga (kg):</label>
          <input
            id="capacidadCarga"
            type="number"
            step="0.01"
            value={datos.capacidadCarga}
            onChange={cambiar("capacidadCarga")}
          />
          {errores.capacidadCarga && (
            <p className="error">{errores.capacidadCarga}</p>
          )}
        </div>

        {errorServidor && <p className="alerta alerta-error">{errorServidor}</p>}

        <div className="acciones">
          <button type="submit" disabled={enviando}>
            Guardar
          </button>
          <Link className="boton secundario" to="/vehiculos">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}