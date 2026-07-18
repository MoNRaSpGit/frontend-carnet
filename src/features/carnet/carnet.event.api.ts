import { API_BASE_URL } from "../../shared/config/api";
import type { CarnetPlayer } from "./carnet.types";
import type { CarnetEvent, CarnetEventDetail } from "./carnet.event.types";

type ListEventsResponse = {
  items: CarnetEvent[];
};

type EventResponse = {
  item: CarnetEventDetail;
};

type CreateEventResponse = {
  item: CarnetEvent;
};

type UpsertEventPlayerResponse = {
  item: CarnetEventDetail;
};

type UpdateEventPlayerResponse = {
  item: CarnetEventDetail;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const fallbackText = await response.text().catch(() => "");
    throw new Error(fallbackText || `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listCarnetEvents() {
  const response = await fetch(`${API_BASE_URL}/carnet/events`);
  return readJson<ListEventsResponse>(response);
}

export async function getCarnetEvent(eventId: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}`);
  return readJson<EventResponse>(response);
}

export async function createCarnetEvent(name: string, endDate: string) {
  const response = await fetch(`${API_BASE_URL}/carnet/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, endDate })
  });

  return readJson<CreateEventResponse>(response);
}

export async function upsertCarnetEventPlayer(eventId: number, playerId: number, sales: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ playerId, sales })
  });

  return readJson<UpsertEventPlayerResponse>(response);
}

export async function updateCarnetEventPlayer(eventId: number, playerId: number, sales: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}/players/${playerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ sales })
  });

  return readJson<UpdateEventPlayerResponse>(response);
}

export async function addCarnetEventPlayerBuyer(eventId: number, playerId: number, buyerName: string, quantity: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}/players/${playerId}/buyers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ buyerName, quantity })
  });

  return readJson<UpsertEventPlayerResponse>(response);
}

export async function setCarnetEventPlayerBuyerDelivered(eventId: number, playerId: number, buyerId: number, delivered: boolean) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}/players/${playerId}/buyers/${buyerId}/delivered`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ delivered })
  });

  return readJson<UpsertEventPlayerResponse>(response);
}

export async function removeCarnetEventPlayerBuyer(eventId: number, playerId: number, buyerId: number) {
  const response = await fetch(`${API_BASE_URL}/carnet/events/${eventId}/players/${playerId}/buyers/${buyerId}`, {
    method: "DELETE"
  });

  return readJson<UpsertEventPlayerResponse>(response);
}

export type { CarnetPlayer };
