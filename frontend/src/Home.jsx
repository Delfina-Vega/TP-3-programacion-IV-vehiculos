import { Link } from "react-router";
import { useAuth } from "./Auth";

//Pagina principal publica
export function Home() {
    const { isAuthenticated, nombre } = useAuth();
  return (
    <section className="portada">
      <h1>Gestión de transporte</h1>
      <p>
        Administra los vehiculos de la empresa, sus conductores y los viajes
        realizados, con el historial y el total de kilometros recorridos.
      </p>

      {isAuthenticated ? (
        <>
          <p>Bienvenido/a, {nombre}. ¿Qué queres hacer?</p>
          <div className="acciones">
            <Link className="boton" to="/vehiculos">
              Ver vehiculos
            </Link>
            <Link className="boton" to="/conductores">
              Ver conductores
            </Link>
            <Link className="boton" to="/viajes">
              Ver viajes
            </Link>
          </div>
        </>
      ) : (
        <div className="acciones">
          <Link className="boton" to="/login">
            Ingresar
          </Link>
          <Link className="boton secundario" to="/registro">
            Crear cuenta
          </Link>
        </div>
      )}
    </section>
  );

}