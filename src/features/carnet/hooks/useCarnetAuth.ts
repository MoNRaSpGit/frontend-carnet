import { useState } from "react";
import type { CarnetRole } from "../carnet.auth.types";

// El rol vive solo en memoria (nunca en localStorage/sessionStorage/URL):
// cada vez que se abre o recarga la app, sin importar el link, arranca
// siempre en el login. Nadie puede saltearlo con un link ni con una
// sesion vieja guardada en el dispositivo.
export function useCarnetAuth() {
  const [role, setRole] = useState<CarnetRole | null>(null);

  function login(nextRole: CarnetRole) {
    setRole(nextRole);
  }

  function logout() {
    setRole(null);
  }

  return { role, login, logout };
}
