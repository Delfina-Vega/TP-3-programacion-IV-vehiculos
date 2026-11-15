import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./Auth";
import { API_URL, mensajeDeError } from "./api";

// Expresiones regulares para validar el formato de email y nombres
const FORMATO_EMAIL = /^\S+@\S+\.\S+$/;
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Estado del formulario y manejo de errores (locales y del servidor)
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    password: "",
    repetir: "",
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);

  const cambiar = (campo) => (e) =>
    setDatos((d) => ({ ...d, [campo]: e.target.value }));

   // Valida los campos antes de enviar, devuelve un objeto con los errores encontrados
  const validar = () => {
    const nuevos = {};
    const nombre = datos.nombre.trim();
    const email = datos.email.trim();

     if (!nombre) {
      nuevos.nombre = "El nombre es obligatorio";
    } else if (!SOLO_LETRAS.test(nombre)) {
      nuevos.nombre = "El nombre solo puede tener letras y espacios";
    } else if (nombre.length > 100) {
      nuevos.nombre = "El nombre admite hasta 100 caracteres";
    }

    if (!email) {
      nuevos.email = "El email es obligatorio";
    } else if (!FORMATO_EMAIL.test(email)) {
      nuevos.email = "Ingresá un email válido";
    } else if (email.length > 100) {
      nuevos.email = "El email admite hasta 100 caracteres";
    }

    if (!datos.password) {
      nuevos.password = "La contraseña es obligatoria";
    } else if (datos.password.length < 8) {
      nuevos.password = "La contraseña debe tener al menos 8 caracteres";
    } else if (datos.password.length > 50) {
      nuevos.password = "La contraseña admite hasta 50 caracteres";
    } else if (!/[a-z]/.test(datos.password) || !/[0-9]/.test(datos.password)) {
      nuevos.password =
        "La contraseña debe tener al menos una minúscula y un número";
    }

    if (datos.repetir !== datos.password) {
      nuevos.repetir = "Las contraseñas no coinciden";
    }

    return nuevos;
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServidor(null);

    // Detiene el envio si existen errores de validacion en el cliente
    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    // Envia los datos limpios al endpoint de creacion de usuarios
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          password: datos.password,
        }),
      });

      if (!response.ok) {
        setErrorServidor(mensajeDeError(await response.json()));
        return;
      }
    } catch {
      setErrorServidor("No se pudo conectar con el servidor");
      return;
    }

    // Usuario creado: se inicia sesion automaticamente
    const res = await login(datos.email.trim(), datos.password);
    navigate(res.success ? "/" : "/login");
  };

  return (
    <>
      <h2>Crear cuenta</h2>
      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <div className="campo">
          <label htmlFor="nombre">Nombre:</label>
          <input
            id="nombre"
            value={datos.nombre}
            onChange={cambiar("nombre")}
          />
          {errores.nombre && <p className="error">{errores.nombre}</p>}
        </div>

        <div className="campo">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={datos.email}
            onChange={cambiar("email")}
          />
          {errores.email && <p className="error">{errores.email}</p>}
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={datos.password}
            onChange={cambiar("password")}
          />
          {errores.password && <p className="error">{errores.password}</p>}
        </div>

        <div className="campo">
          <label htmlFor="repetir">Repetir contraseña:</label>
          <input
            id="repetir"
            type="password"
            value={datos.repetir}
            onChange={cambiar("repetir")}
          />
          {errores.repetir && <p className="error">{errores.repetir}</p>}
        </div>

        {errorServidor && <p className="alerta alerta-error">{errorServidor}</p>}

        <div className="acciones">
          <button type="submit">Registrarme</button>
          <Link className="boton secundario" to="/login">
            Ya tengo cuenta
          </Link>
        </div>
      </form>
    </>
  );
}