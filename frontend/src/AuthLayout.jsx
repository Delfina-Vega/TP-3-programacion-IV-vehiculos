import { Navigate, Outlet } from "react-router";
import { useAuth } from "./Auth";


//Protege las rutas hijas: si no hay sesion, redirige al login
export function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}