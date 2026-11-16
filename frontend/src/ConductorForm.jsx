import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL, mensajeDeError, mensajeDeFallo } from "./api";
import { Campo } from "./Campo";

const VACIO = {
  nombre: "",
  apellido: "",
  numeroDocumento: "",
  numeroLicencia: "",
  fechaAltaLicencia: "",
  fechaVencimientoLicencia: "",
};

// Expresiones regulares para validar formatos de texto, DNI y licencia
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ '-]+$/;
const FORMATO_DOCUMENTO = /^[0-9]{7,10}$/;
const FORMATO_LICENCIA = /^[A-Za-z0-9]{5,20}$/;


// Detecta si la ruta tiene un 'id' para alternar entre modo edicion y creacion
export function ConductorForm() {
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

  // En modo edición, se cargan los datos actuales del conductor
  useEffect(() => {
    if (!esEdicion) {
      return;
    }

    const cargarConductor = async () => {
      try {
        const response = await fetchAuth(`${API_URL}/conductores/${id}`);
        if (!response.ok) {
          throw new Error(mensajeDeError(await response.json()));
        }

        const conductor = await response.json();
        setDatos({
          nombre: conductor.nombre,
          apellido: conductor.apellido,
          numeroDocumento: conductor.numeroDocumento,
          numeroLicencia: conductor.numeroLicencia,
          fechaAltaLicencia: conductor.fechaAltaLicencia,
          fechaVencimientoLicencia: conductor.fechaVencimientoLicencia,
        });
      } catch (err) {
        setErrorCarga(mensajeDeFallo(err));
      } finally {
        setCargando(false);
      }
    };

    cargarConductor();
  }, [id, esEdicion, fetchAuth]);

// Actualiza dinamicamente el campo modificado en el estado
  const cambiar = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

// Valida todos los campos y devuelve un objeto con los errores encontrados
  const validar = () => {
    const nuevos = {};
    const nombre = datos.nombre.trim();
    const apellido = datos.apellido.trim();
    const documento = datos.numeroDocumento.trim();
    const licencia = datos.numeroLicencia.trim();
    const alta = datos.fechaAltaLicencia;
    const vencimiento = datos.fechaVencimientoLicencia;

    if (!nombre) {
      nuevos.nombre = "El nombre es obligatorio";
    } else if (!SOLO_LETRAS.test(nombre)) {
      nuevos.nombre = "El nombre solo puede tener letras";
    } else if (nombre.length > 50) {
      nuevos.nombre = "El nombre admite hasta 50 caracteres";
    }

    if (!apellido) {
      nuevos.apellido = "El apellido es obligatorio";
    } else if (!SOLO_LETRAS.test(apellido)) {
      nuevos.apellido = "El apellido solo puede tener letras";
    } else if (apellido.length > 50) {
      nuevos.apellido = "El apellido admite hasta 50 caracteres";
    }

    if (!documento) {
      nuevos.numeroDocumento = "El número de documento es obligatorio";
    } else if (!FORMATO_DOCUMENTO.test(documento)) {
      nuevos.numeroDocumento = "El documento debe tener entre 7 y 10 números";
    }

    if (!licencia) {
      nuevos.numeroLicencia = "El número de licencia es obligatorio";
    } else if (!FORMATO_LICENCIA.test(licencia)) {
      nuevos.numeroLicencia =
        "La licencia debe tener entre 5 y 20 letras o números";
    }

    if (!alta) {
      nuevos.fechaAltaLicencia = "La fecha de alta es obligatoria";
    }

    if (!vencimiento) {
      nuevos.fechaVencimientoLicencia = "La fecha de vencimiento es obligatoria";
    } else if (alta && vencimiento <= alta) {
      nuevos.fechaVencimientoLicencia =
        "El vencimiento debe ser posterior al alta";
    }

    return nuevos;
  };

// Procesa el envio: valida datos, elige PUT o POST segun el modo y redirige al guardar
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
        esEdicion ? `${API_URL}/conductores/${id}` : `${API_URL}/conductores`,
        {
          method: esEdicion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: datos.nombre.trim(),
            apellido: datos.apellido.trim(),
            numeroDocumento: datos.numeroDocumento.trim(),
            numeroLicencia: datos.numeroLicencia.trim(),
            fechaAltaLicencia: datos.fechaAltaLicencia,
            fechaVencimientoLicencia: datos.fechaVencimientoLicencia,
          }),
        },
      );

      if (!response.ok) {
        setErrorServidor(mensajeDeError(await response.json()));
        return;
      }

      navigate("/conductores");
    } catch (err) {
      setErrorServidor(mensajeDeFallo(err));
    } finally {
      setEnviando(false);
    }
  };

// Renderizados condicionales mientras carga o si falla la busqueda inicial
  if (cargando) {
    return <p className="sin-datos">Cargando...</p>;
  }

  if (errorCarga) {
    return (
      <>
        <p className="alerta alerta-error">{errorCarga}</p>
        <Link className="boton secundario" to="/conductores">
          Volver
        </Link>
      </>
    );
  }

  return (
    <>
      <h2>{esEdicion ? "Modificar conductor" : "Nuevo conductor"}</h2>
      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <Campo
          id="nombre"
          etiqueta="Nombre:"
          value={datos.nombre}
          onChange={cambiar("nombre")}
          error={errores.nombre}
        />
        <Campo
          id="apellido"
          etiqueta="Apellido:"
          value={datos.apellido}
          onChange={cambiar("apellido")}
          error={errores.apellido}
        />
        <Campo
          id="numeroDocumento"
          etiqueta="Número de documento:"
          inputMode="numeric"
          value={datos.numeroDocumento}
          onChange={cambiar("numeroDocumento")}
          error={errores.numeroDocumento}
        />
        <Campo
          id="numeroLicencia"
          etiqueta="Número de licencia:"
          value={datos.numeroLicencia}
          onChange={cambiar("numeroLicencia")}
          error={errores.numeroLicencia}
        />
        <Campo
          id="fechaAltaLicencia"
          etiqueta="Fecha de alta de la licencia:"
          type="date"
          value={datos.fechaAltaLicencia}
          onChange={cambiar("fechaAltaLicencia")}
          error={errores.fechaAltaLicencia}
        />
        <Campo
          id="fechaVencimientoLicencia"
          etiqueta="Fecha de vencimiento de la licencia:"
          type="date"
          value={datos.fechaVencimientoLicencia}
          onChange={cambiar("fechaVencimientoLicencia")}
          error={errores.fechaVencimientoLicencia}
        />

        {errorServidor && <p className="alerta alerta-error">{errorServidor}</p>}

        <div className="acciones">
          <button type="submit" disabled={enviando}>
            Guardar
          </button>
          <Link className="boton secundario" to="/conductores">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}