import { API_BASE_URL } from "../../shared/config/api";
import type { CarnetPlayer, CarnetPlayerPayload } from "./carnet.types";

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

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackText = await response.text().catch(() => "");
    throw new Error(fallbackText || `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listCarnetPlayers() {
  const response = await fetch(`${API_BASE_URL}/carnet/players`);
  return readJson<ListPlayersResponse>(response);
}

export async function createCarnetPlayer(payload: CarnetPlayerPayload) {
  const response = await fetch(`${API_BASE_URL}/carnet/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<CreatePlayerResponse>(response);
}

export async function updateCarnetPlayer(playerId: number, payload: Partial<CarnetPlayerPayload>) {
  const response = await fetch(`${API_BASE_URL}/carnet/players/${playerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJson<UpdatePlayerResponse>(response);
}

export async function deleteCarnetPlayer(playerId: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/players/${playerId}`, {
    method: "DELETE"
  });

  return readJson<DeletePlayerResponse>(response);
}
