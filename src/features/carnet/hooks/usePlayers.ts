import { useEffect, useState } from "react";
import { createCarnetPlayer, deleteCarnetPlayer, listCarnetPlayers, updateCarnetPlayer } from "../carnet.api";
import { sortPlayers } from "../utils/carnet.sort";
import type { CarnetPlayer, CarnetPlayerPayload } from "../carnet.types";

export type SourceState = "loading" | "online" | "offline";
type PlayerChangeMode = "upsert" | "delete";

type UsePlayersOptions = {
  onPlayerChanged?: (player: CarnetPlayer, mode: PlayerChangeMode) => void;
};

export function usePlayers({ onPlayerChanged }: UsePlayersOptions = {}) {
  const [players, setPlayers] = useState<CarnetPlayer[]>([]);
  const [sourceState, setSourceState] = useState<SourceState>("loading");
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await listCarnetPlayers();
        if (!active) return;

        setPlayers(sortPlayers(response.items));
        setSourceState("online");
        setListError(null);
      } catch {
        if (!active) return;

        setPlayers([]);
        setSourceState("offline");
        setListError("No se pudo conectar con la base de datos en este momento.");
      }
    }

    void loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  async function createPlayer(payload: CarnetPlayerPayload) {
    const response = await createCarnetPlayer(payload);
    setPlayers((current) => sortPlayers([response.item, ...current.filter((player) => player.id !== response.item.id)]));
    setSourceState("online");
    setListError(null);
    onPlayerChanged?.(response.item, "upsert");
    return response.item;
  }

  async function updatePlayer(playerId: number, payload: Partial<CarnetPlayerPayload>) {
    const response = await updateCarnetPlayer(playerId, payload);
    setPlayers((current) => sortPlayers(current.map((player) => (player.id === response.item.id ? response.item : player))));
    setSourceState("online");
    onPlayerChanged?.(response.item, "upsert");
    return response.item;
  }

  async function removePlayer(player: CarnetPlayer) {
    await deleteCarnetPlayer(player.id);
    setPlayers((current) => current.filter((item) => item.id !== player.id));
    setSourceState("online");
    onPlayerChanged?.(player, "delete");
  }

  return { players, sourceState, listError, createPlayer, updatePlayer, removePlayer };
}
