const STORAGE_KEY = "carnet.visitorId";

// Identificador anonimo por navegador (no por persona): se genera una sola
// vez y se guarda en localStorage para poder distinguir "entradas
// distintas" sin pedir registro ni login. Si el usuario borra los datos
// del navegador o entra desde otro dispositivo, se genera uno nuevo.
export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
