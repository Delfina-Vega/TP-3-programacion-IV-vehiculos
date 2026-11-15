import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./Auth";

const FORMATO_EMAIL = /^\S+@\S+\.\S+$/;


export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);

  const validar = () => {
    const nuevos = {};
    if(!email.trim()) {
        nuevos.email = "El email es obligatorio";
    } else if (!FORMATO_EMAIL.test(email.trim())) {
        nuevos.email = "Ingresa un email valido";
    }
    if (!password) {
        nuevos.password = "La contraseña es obligatoria";
    }
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
setErrorServidor(null);

const nuevosErrores = validar();
setErrores(nuevosErrores);
if (Object.keys(nuevosErrores).length > 0){
    return;
}
   const res = await login(email.trim(), password);
   if (res.success) {
    nevigate("/");
   } else {
    setErrorServidor(res.error);
   }
  };

  return (
    <>
      <h2>Ingresar</h2>
      <form className="formulario" onSubmit={handleSubmit} noValidate>
        <div className="campo">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errores.email && <p className="error">{errores.email}</p>}
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errores.password && <p className="error">{errores.password}</p>}
        </div>

        {errorServidor && <p className="alerta alerta-error">{errorServidor}</p>}

        <div className="acciones">
          <button type="submit">Ingresar</button>
          <Link className="boton secundario" to="/registro">
            Crear cuenta
          </Link>
        </div>
      </form>
    </>
  );
}