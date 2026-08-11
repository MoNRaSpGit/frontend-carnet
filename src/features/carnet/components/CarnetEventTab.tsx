import { useState } from "react";
import { getDaysUntil } from "../utils/carnet.format";
import { AttachPlayerForm } from "./events/AttachPlayerForm";
import { CreateEventForm } from "./events/CreateEventForm";
import { EditEventSalesModal } from "./events/EditEventSalesModal";
import { EventOverviewStats } from "./events/EventOverviewStats";
import { EventPicker } from "./events/EventPicker";
import { RankingCard } from "./events/RankingCard";
import type { CarnetEvent, CarnetEventDetail, CarnetEventRankingItem } from "../carnet.event.types";
import type { CarnetPlayer } from "../carnet.types";

type CarnetEventTabProps = {
  players: CarnetPlayer[];
  events: CarnetEvent[];
  activeEventId: number | null;
  activeEventDetail: CarnetEventDetail | null;
  loadingEvent: boolean;
  eventError: string | null;
  onSelectEvent: (eventId: number) => void;
  onCreateEvent: (name: string, endDate: string) => Promise<unknown>;
  onSetEventClosed: (eventId: number, isClosed: boolean) => Promise<unknown>;
  onAttachPlayer: (eventId: number, playerId: number, sales: number) => Promise<unknown>;
  onUpdatePlayerSales: (eventId: number, playerId: number, sales: number) => Promise<unknown>;
  onAddPlayerBuyer: (eventId: number, playerId: number, buyerName: string, quantity: number) => Promise<unknown>;
  onRemovePlayerBuyer: (eventId: number, playerId: number, buyerId: number) => Promise<unknown>;
};

export function CarnetEventTab({
  players,
  events,
  activeEventId,
  activeEventDetail,
  loadingEvent,
  eventError,
  onSelectEvent,
  onCreateEvent,
  onSetEventClosed,
  onAttachPlayer,
  onUpdatePlayerSales,
  onAddPlayerBuyer,
  onRemovePlayerBuyer
}: CarnetEventTabProps) {
  const [editingEntry, setEditingEntry] = useState<CarnetEventRankingItem | null>(null);
  const [togglingClosed, setTogglingClosed] = useState(false);

  const ranking = activeEventDetail?.ranking ?? [];
  const event = activeEventDetail?.event ?? null;
  const daysLeft = getDaysUntil(event?.endDate ?? null);
  const isClosed = event?.isClosed ?? false;

  async function handleToggleClosed() {
    if (!activeEventId || togglingClosed) return;

    setTogglingClosed(true);
    try {
      await onSetEventClosed(activeEventId, !isClosed);
    } finally {
      setTogglingClosed(false);
    }
  }

  return (
    <section className="carnet-event">
      <div className="carnet-event__header">
        <div>
          <p className="carnet-kicker">Evento</p>
          <div className="carnet-event__title-row">
            <h2>Evento cazuela</h2>
            <span className="carnet-event__days-pill">
              {daysLeft === null ? "Sin fecha" : daysLeft > 0 ? `Quedan ${daysLeft} dias` : daysLeft === 0 ? "Finaliza hoy" : "Finalizado"}
            </span>
            {isClosed ? <span className="carnet-event__closed-pill">Evento cerrado</span> : null}
            {event ? (
              <button
                type="button"
                className="carnet-event__close-toggle"
                onClick={handleToggleClosed}
                disabled={togglingClosed}
              >
                {togglingClosed ? "Guardando..." : isClosed ? "Reabrir evento" : "Cerrar evento"}
              </button>
            ) : null}
          </div>
          <p className="carnet-note">Creá un evento, sumá jugadores y ordená la tabla según la cantidad de ventas.</p>
        </div>
      </div>

      <EventPicker events={events} activeEventId={activeEventId} onSelectEvent={onSelectEvent} />

      <CreateEventForm onCreateEvent={onCreateEvent} />

      {isClosed ? (
        <p className="carnet-note carnet-note--warning">
          Este evento está cerrado: no se pueden sumar jugadores, cambiar ventas ni asignar compradores. Reabrilo si
          necesitás corregir algo.
        </p>
      ) : (
        <AttachPlayerForm players={players} activeEventId={activeEventId} eventError={eventError} onAttachPlayer={onAttachPlayer} />
      )}

      <EventOverviewStats event={event} daysLeft={daysLeft} />

      <section className="carnet-event__ranking">
        <div className="carnet-event__section-head">
          <p className="carnet-card__eyebrow">Ranking</p>
          <h3>Resultados</h3>
        </div>

        {loadingEvent ? <p className="carnet-empty-inline">Cargando ranking...</p> : null}

        {!loadingEvent && !ranking.length ? (
          <article className="carnet-empty-state">
            <h2>No hay ventas todavía</h2>
            <p>Agregá jugadores al evento para armar el ranking.</p>
          </article>
        ) : null}

        <div className="carnet-ranking-grid">
          {ranking.map((entry) => (
            <RankingCard
              key={entry.id}
              entry={entry}
              readOnly={isClosed}
              onEdit={() => setEditingEntry(entry)}
              onAddSale={() => {
                if (!activeEventId) return;
                void onUpdatePlayerSales(activeEventId, entry.playerId, entry.sales + 1);
              }}
              onSubtractSale={() => {
                if (!activeEventId || entry.sales <= 0) return;
                void onUpdatePlayerSales(activeEventId, entry.playerId, entry.sales - 1);
              }}
              onAddBuyer={(buyerName, quantity) => {
                if (!activeEventId) return Promise.resolve();
                return onAddPlayerBuyer(activeEventId, entry.playerId, buyerName, quantity);
              }}
              onRemoveBuyer={(buyerId) => {
                if (!activeEventId) return Promise.resolve();
                return onRemovePlayerBuyer(activeEventId, entry.playerId, buyerId);
              }}
            />
          ))}
        </div>
      </section>

      {editingEntry ? (
        <EditEventSalesModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={async (sales) => {
            if (!activeEventId) return;
            await onUpdatePlayerSales(activeEventId, editingEntry.playerId, sales);
          }}
        />
      ) : null}
    </section>
  );
}
