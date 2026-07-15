import type { CarnetPlayer } from "./carnet.types";

export type CarnetEvent = {
  id: number;
  name: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  playersCount: number;
  totalSales: number;
};

export type CarnetEventRankingItem = {
  id: number;
  playerId: number;
  playerName: string;
  sales: number;
  position: number;
};

export type CarnetEventDetail = {
  event: CarnetEvent;
  players: CarnetPlayer[];
  ranking: CarnetEventRankingItem[];
};
