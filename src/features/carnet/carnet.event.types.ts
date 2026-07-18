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

export type CarnetEventSaleBuyer = {
  id: number;
  buyerName: string;
  quantity: number;
  delivered: boolean;
};

export type CarnetEventRankingItem = {
  id: number;
  playerId: number;
  playerName: string;
  sales: number;
  position: number;
  buyers: CarnetEventSaleBuyer[];
  unassignedSales: number;
};

export type CarnetEventDetail = {
  event: CarnetEvent;
  players: CarnetPlayer[];
  ranking: CarnetEventRankingItem[];
};
