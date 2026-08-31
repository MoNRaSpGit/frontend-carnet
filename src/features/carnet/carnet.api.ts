import { API_BASE_URL } from "../../shared/config/api";
import { carnetAdminHeaders } from "./carnetAdminSession";
import type { CarnetPlayer, CarnetPlayerPayload, CarnetVisitSummary } from "./carnet.types";

type ListPlayersResponse = {
  items: CarnetPlayer[];
};

type CreatePlayerResponse = {
  item: CarnetPlayer;
};

type UpdatePlayerResponse = {
  item: CarnetPlayer;
};

type DeletePlayerResponse = {
  item: CarnetPlayer;
};

// El backend (Nest) manda los errores como JSON ({statusCode, message}) --
// si solo se tirara el texto crudo, el mensaje que ve el usuario terminaba
// siendo el JSON entero en vez de la frase legible (ej: "Sesion de
// administrador invalida." en vez de eso perdido dentro de un {...}).
async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackText = await response.text().catch(() => "");
    try {
      const parsed = JSON.parse(fallbackText) as { message?: string | string[] };
      const message = Array.isArray(parsed.message) ? parsed.message.join(" ") : parsed.message;
      throw new Error(message || fallbackText || `HTTP ${response.status}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message && parseError.message !== fallbackText) {
        throw parseError;
      }
      throw new Error(fallbackText || `HTTP ${response.status}`);
    }
  }

  return (await response.json()) as T;
}

export async function loginCarnetAdmin(pin: string) {
  const response = await fetch(`${API_BASE_URL}/carnet/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pin })
  });

  return readJson<{ token: string }>(response);
}

export async function listCarnetPlayers() {
  const response = await fetch(`${API_BASE_URL}/carnet/players`);
  return readJson<ListPlayersResponse>(response);
}

export async function createCarnetPlayer(payload: CarnetPlayerPayload) {
  const response = await fetch(`${API_BASE_URL}/carnet/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...carnetAdminHeaders()
    },
    body: JSON.stringify(payload)
  });

  return readJson<CreatePlayerResponse>(response);
}

export async function updateCarnetPlayer(playerId: number, payload: Partial<CarnetPlayerPayload>) {
  const response = await fetch(`${API_BASE_URL}/carnet/players/${playerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...carnetAdminHeaders()
    },
    body: JSON.stringify(payload)
  });

  return readJson<UpdatePlayerResponse>(response);
}

export async function deleteCarnetPlayer(playerId: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/players/${playerId}`, {
    method: "DELETE",
    headers: {
      ...carnetAdminHeaders()
    }
  });

  return readJson<DeletePlayerResponse>(response);
}

export async function recordCarnetVisit(visitorId: string, role: "usuario" | "admin") {
  const response = await fetch(`${API_BASE_URL}/carnet/visits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ visitorId, role })
  });

  return readJson<{ ok: true }>(response);
}

export async function listCarnetVisits() {
  const response = await fetch(`${API_BASE_URL}/carnet/visits`, {
    headers: {
      ...carnetAdminHeaders()
    }
  });
  return readJson<{ items: CarnetVisitSummary[] }>(response);
}
