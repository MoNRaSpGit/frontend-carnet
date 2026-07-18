import { useEffect, useState } from "react";
import {
  addCarnetEventPlayerBuyer,
  createCarnetEvent,
  getCarnetEvent,
  listCarnetEvents,
  removeCarnetEventPlayerBuyer,
  setCarnetEventPlayerBuyerDelivered,
  updateCarnetEventPlayer,
  upsertCarnetEventPlayer
} from "../carnet.event.api";
import { sortEvents } from "../utils/carnet.sort";
import type { CarnetEvent, CarnetEventDetail } from "../carnet.event.types";
import type { CarnetPlayer } from "../carnet.types";

export function useCarnetEvents() {
  const [events, setEvents] = useState<CarnetEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<CarnetEventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await listCarnetEvents();
        if (!active) return;

        setEvents(sortEvents(response.items));
        setEventError(null);
      } catch {
        if (!active) return;

        setEvents([]);
        setEventError("No se pudieron cargar los eventos en este momento.");
      }
    }

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!events.length) {
      setActiveEventId(null);
      setActiveEventDetail(null);
      return;
    }

    if (activeEventId === null || !events.some((event) => event.id === activeEventId)) {
      setActiveEventId(events[0].id);
    }
  }, [activeEventId, events]);

  useEffect(() => {
    let active = true;

    async function loadEventDetail(eventId: number) {
      setLoadingEvent(true);

      try {
        const response = await getCarnetEvent(eventId);
        if (!active) return;

        setActiveEventDetail(response.item);
        setEventError(null);
      } catch {
        if (!active) return;

        setActiveEventDetail(null);
        setEventError("No se pudo cargar el detalle del evento.");
      } finally {
        if (active) {
          setLoadingEvent(false);
        }
      }
    }

    if (activeEventId === null) {
      setActiveEventDetail(null);
      setLoadingEvent(false);
      return () => {
        active = false;
      };
    }

    void loadEventDetail(activeEventId);

    return () => {
      active = false;
    };
  }, [activeEventId]);

  async function createEvent(name: string, endDate: string, currentPlayers: CarnetPlayer[]) {
    const response = await createCarnetEvent(name, endDate);
    setEvents((current) => sortEvents([response.item, ...current.filter((event) => event.id !== response.item.id)]));
    setActiveEventId(response.item.id);
    setActiveEventDetail({ event: response.item, players: currentPlayers, ranking: [] });
    setEventError(null);
    return response.item;
  }

  async function attachPlayer(eventId: number, playerId: number, sales: number) {
    const response = await upsertCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) => sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event))));
    return response.item;
  }

  async function updatePlayerSales(eventId: number, playerId: number, sales: number) {
    const response = await updateCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) => sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event))));
    return response.item;
  }

  async function addPlayerBuyer(eventId: number, playerId: number, buyerName: string, quantity: number) {
    const response = await addCarnetEventPlayerBuyer(eventId, playerId, buyerName, quantity);
    setActiveEventDetail(response.item);
    setEvents((current) => sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event))));
    return response.item;
  }

  async function removePlayerBuyer(eventId: number, playerId: number, buyerId: number) {
    const response = await removeCarnetEventPlayerBuyer(eventId, playerId, buyerId);
    setActiveEventDetail(response.item);
    setEvents((current) => sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event))));
    return response.item;
  }

  async function setBuyerDelivered(eventId: number, playerId: number, buyerId: number, delivered: boolean) {
    const previousDetail = activeEventDetail;

    // Optimista: se tilda/destilda al toque en pantalla, el guardado real
    // pasa atras. Si falla, se vuelve al estado anterior (se destilda solo).
    setActiveEventDetail((current) => {
      if (!current) return current;

      return {
        ...current,
        ranking: current.ranking.map((entry) =>
          entry.playerId === playerId
            ? { ...entry, buyers: entry.buyers.map((buyer) => (buyer.id === buyerId ? { ...buyer, delivered } : buyer)) }
            : entry
        )
      };
    });

    try {
      const response = await setCarnetEventPlayerBuyerDelivered(eventId, playerId, buyerId, delivered);
      setActiveEventDetail(response.item);
      setEvents((current) => sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event))));
      return response.item;
    } catch (error) {
      setActiveEventDetail(previousDetail);
      throw error;
    }
  }

  function syncPlayer(nextPlayer: CarnetPlayer, mode: "upsert" | "delete") {
    setActiveEventDetail((current) => {
      if (!current) {
        return current;
      }

      const nextPlayers =
        mode === "delete"
          ? current.players.filter((player) => player.id !== nextPlayer.id)
          : current.players.map((player) => (player.id === nextPlayer.id ? nextPlayer : player));

      const nextRanking =
        mode === "delete"
          ? current.ranking
              .filter((entry) => entry.playerId !== nextPlayer.id)
              .map((entry, index) => ({ ...entry, position: index + 1 }))
          : current.ranking.map((entry) => (entry.playerId === nextPlayer.id ? { ...entry, playerName: nextPlayer.name } : entry));

      return { event: current.event, players: nextPlayers, ranking: nextRanking };
    });
  }

  return {
    events,
    activeEventId,
    activeEventDetail,
    loadingEvent,
    eventError,
    setActiveEventId,
    createEvent,
    attachPlayer,
    updatePlayerSales,
    addPlayerBuyer,
    removePlayerBuyer,
    setBuyerDelivered,
    syncPlayer
  };
}
