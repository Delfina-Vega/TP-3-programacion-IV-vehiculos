import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "./Auth";

export function Layout() {
  const { isAuthenticated, nombre, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const clase = (ruta) => (pathname.startsWith(ruta) ? "active" : "");

  return (
    <>
      <header>
        <nav>
          <ul>
            <li className={pathname === "/" ? "active" : ""}>
              <Link to="/">Inicio</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className={clase("/vehiculos")}>
                  <Link to="/vehiculos">Vehículos</Link>
                </li>
                <li className={clase("/conductores")}>
                  <Link to="/conductores">Conductores</Link>
                </li>
                <li className={clase("/viajes")}>
                  <Link to="/viajes">Viajes</Link>
                </li>
                <li className="usuario">Hola, {nombre}</li>
                <li>
                  <button
                    className="boton-nav"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Salir
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className={clase("/login")}>
                  <Link to="/login">Ingresar</Link>
                </li>
                <li className={clase("/registro")}>
                  <Link to="/registro">Registrarse</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}