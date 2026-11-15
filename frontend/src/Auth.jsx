import { createContext, useCallback, useContext, useState } from "react";
import { API_URL, mensajeDeError } from "./api";

// Contexto para compartir el estado de autenticacion
const AuthContext = createContext(null);

// Hook personzalizado para acceder al contexto de auth
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

//La sesion se guarda en sessionStorage para  que no se pierda al recargar
function leerSesion() {
    try {
        return JSON.parse(sessionStorage.getItem("sesion")) ?? {};

    } catch {
        return {};
    }
}

function guardarSesion(sesion) {
    try {
        if (sesion.token) {
            sessionStorage.setItem("sesion", JSON.stringify(sesion));
        } else {
            sessionStorage.removeItem("sesion");

        }
    } catch {
        //si el nanvegador no permire sessionStorage, la sesion dura hasta recargar
    }
}


export const AuthProvider = ({ children }) => {
  const [sesion, setSesion] = useState(leerSesion);
  const { token = null, nombre = null } = sesion;

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const datos = await response.json();

      if (!response.ok ) {
        throw new Error(mensajeDeError(datos));
      }

      const nuevaSesion = { token: datos.token, nombre: datos.nombre };

      guardarSesion(nuevaSesion);
      setSesion(nuevaSesion);
      return { success: true };
    } catch (err) {
        const mensaje =
        err instanceof TypeError
        ? "No se pudo conectar con el servidor"
        : err.message;
      return { success: false, error: mensaje };
    }
    }, []);

    const  logout = useCallback(() => {
        guardarSesion({});
        setSesion({});
  }, []);

  const fetchAuth = useCallback(
    async (url, options = {}) => {
      if (!token) {
        throw new Error("No esta iniciada la session");
      }

      const response= await fetch(url, {
        ...options,
        headers: { ...options.headers,Authorization: `Bearer ${token}` },
      });

      //Token vencido o invalido: se cierra la sesion
      if (response.status === 401) {
        logout();
      }

      return response;
    },
    [token, logout],
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        nombre,
        isAuthenticated: !!token,
        login,
        logout,
        fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};