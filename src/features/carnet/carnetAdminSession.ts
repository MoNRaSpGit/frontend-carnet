// Token de sesion admin, solo en memoria (nunca en localStorage/sessionStorage):
// mismo criterio que useCarnetAuth para el rol -- si se recarga la pagina,
// hay que volver a entrar con el PIN. Vive fuera de React porque lo
// consumen los modulos de API (carnet.api.ts / carnet.event.api.ts), no
// componentes.
let adminToken: string | null = null;

export function setCarnetAdminToken(token: string | null) {
  adminToken = token;
}

export function getCarnetAdminToken(): string | null {
  return adminToken;
}

export function carnetAdminHeaders(): Record<string, string> {
  return adminToken ? { "x-carnet-admin-token": adminToken } : {};
}
