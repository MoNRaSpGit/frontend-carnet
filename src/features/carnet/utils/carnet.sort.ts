import { getDaysUntil } from "./carnet.format";
import type { CarnetPlayer } from "../carnet.types";
import type { CarnetEvent } from "../carnet.event.types";

export function sortPlayers(players: CarnetPlayer[]) {
  return [...players].sort((left, right) => {
    const leftDays = getDaysUntil(left.expiryDate) ?? 0;
    const rightDays = getDaysUntil(right.expiryDate) ?? 0;
    return leftDays - rightDays || left.name.localeCompare(right.name);
  });
}

export function sortEvents(events: CarnetEvent[]) {
  return [...events].sort((left, right) => right.id - left.id);
}
