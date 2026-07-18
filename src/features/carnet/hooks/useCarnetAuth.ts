import { useState } from "react";
import type { CarnetRole } from "../carnet.auth.types";

const STORAGE_KEY = "carnet.role";

function readStoredRole(): CarnetRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "admin" || stored === "usuario" ? stored : null;
}

export function useCarnetAuth() {
  const [role, setRole] = useState<CarnetRole | null>(() => readStoredRole());

  function login(nextRole: CarnetRole) {
    window.localStorage.setItem(STORAGE_KEY, nextRole);
    setRole(nextRole);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  }

  return { role, login, logout };
}
