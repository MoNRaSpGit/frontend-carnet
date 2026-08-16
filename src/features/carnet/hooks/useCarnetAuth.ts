import { useState } from "react";
import { loginCarnetAdmin } from "../carnet.api";
import { setCarnetAdminToken } from "../carnetAdminSession";
import type { CarnetRole } from "../carnet.auth.types";

// El rol vive solo en memoria (nunca en localStorage/sessionStorage/URL):
// cada vez que se abre o recarga la app, sin importar el link, arranca
// siempre en el login. Nadie puede saltearlo con un link ni con una
// sesion vieja guardada en el dispositivo. El token de admin (emitido
// recien al validar el PIN) sigue el mismo criterio -- ver carnetAdminSession.ts.
export function useCarnetAuth() {
  const [role, setRole] = useState<CarnetRole | null>(null);

  function loginUsuario() {
    setRole("usuario");
  }

  async function loginAdmin(pin: string) {
    const { token } = await loginCarnetAdmin(pin);
    setCarnetAdminToken(token);
    setRole("admin");
  }

  function logout() {
    setCarnetAdminToken(null);
    setRole(null);
  }

  return { role, loginUsuario, loginAdmin, logout };
}
