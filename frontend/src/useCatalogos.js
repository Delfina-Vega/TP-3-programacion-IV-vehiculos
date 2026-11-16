import { useEffect, useState } from "react";
import { useAuth } from "./Auth";
import { API_URL, mensajeDeFallo } from "./api";

// Carga la lista de vehículos y conductores para armar los desplegables
export function useCatalogos() {
  const { fetchAuth } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
    // Ejecuta ambas peticiones al mismo tiempo para reducir el tiempo de espera
        const [resVehiculos, resConductores] = await Promise.all([
          fetchAuth(`${API_URL}/vehiculos`),
          fetchAuth(`${API_URL}/conductores`),
        ]);
// Verifica que ninguna de las dos respuestas haya fallado
        if (!resVehiculos.ok || !resConductores.ok) {
          throw new Error("No se pudieron cargar los vehículos y conductores");
        }

        setVehiculos(await resVehiculos.json());
        setConductores(await resConductores.json());
      } catch (err) {
        setError(mensajeDeFallo(err));
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [fetchAuth]);

  return { vehiculos, conductores, cargando, error };
}