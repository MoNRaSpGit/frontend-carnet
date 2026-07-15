import { useMemo, useState, type FormEvent } from "react";
import { createCarnetPlayer } from "../carnet.api";
import type { CarnetPlayer } from "../carnet.types";
import type { CarnetEvent, CarnetEventDetail, CarnetEventRankingItem } from "../carnet.event.types";

type CarnetEventTabProps = {
  players: CarnetPlayer[];
  events: CarnetEvent[];
  activeEventId: number | null;
  activeEventDetail: CarnetEventDetail | null;
  loadingEvent: boolean;
  eventError: string | null;
  onCreateEvent: (name: string, endDate: string) => Promise<void>;
  onSelectEvent: (eventId: number) => void;
  onCreatePlayer: typeof createCarnetPlayer;
  onAttachPlayer: (eventId: number, playerId: number, sales: number) => Promise<void>;
  onUpdatePlayerSales: (eventId: number, playerId: number, sales: number) => Promise<void>;
};

type EditingEntryState = {
  playerId: number;
  playerName: string;
  sales: number;
} | null;

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

function getDaysUntil(dateString: string | null) {
  if (!dateString) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getMedal(position: number) {
  if (position === 1) return "Oro";
  if (position === 2) return "Plata";
  if (position === 3) return "Bronce";
  return "";
}

function RankingCard({
  entry,
  onEdit,
  onAddSale
}: {
  entry: CarnetEventRankingItem;
  onEdit: () => void;
  onAddSale: () => void;
}) {
  return (
    <article className={`carnet-ranking-card ${entry.position === 1 ? "is-leader" : ""}`} onDoubleClick={onEdit}>
      <div className="carnet-ranking-card__main">
        <div>
          <div className="carnet-ranking-card__position">
            <strong>#{entry.position}</strong>
            {entry.position === 1 ? <span className="carnet-medal">Mejor vendedor</span> : null}
            {entry.position > 1 && entry.position <= 3 ? (
              <span className={`carnet-medal is-${entry.position}`}>{getMedal(entry.position)}</span>
            ) : null}
          </div>
          <h3>{entry.playerName}</h3>
        </div>
        <button type="button" className="carnet-ranking-card__plus" onClick={onAddSale} aria-label={`Sumar venta a ${entry.playerName}`}>
          +
        </button>
      </div>

      <div className="carnet-ranking-card__footer">
        <strong>{formatNumber(entry.sales)} ventas</strong>
        <small>Doble click para editar</small>
      </div>
    </article>
  );
}

export function CarnetEventTab({
  players,
  events,
  activeEventId,
  activeEventDetail,
  loadingEvent,
  eventError,
  onCreateEvent,
  onSelectEvent,
  onCreatePlayer,
  onAttachPlayer,
  onUpdatePlayerSales
}: CarnetEventTabProps) {
  const [eventName, setEventName] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerExpiry, setNewPlayerExpiry] = useState("");
  const [sales, setSales] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<EditingEntryState>(null);
  const [saving, setSaving] = useState(false);

  const ranking = activeEventDetail?.ranking ?? [];
  const event = activeEventDetail?.event ?? null;

  const playerOptions = useMemo(() => {
    return [...players].sort((left, right) => left.name.localeCompare(right.name));
  }, [players]);

  async function handleCreateEvent(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault();
    const trimmedName = eventName.trim();

    if (!trimmedName || !eventEndDate) {
      setFormError("Escribi un nombre y una fecha de finalizacion para el evento.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await onCreateEvent(trimmedName, eventEndDate);
      setEventName("");
      setEventEndDate("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPlayer(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault();

    if (!activeEventId) {
      setFormError("Primero creá o elegí un evento.");
      return;
    }

    const parsedSales = Number.parseInt(sales, 10);
    if (!Number.isFinite(parsedSales) || parsedSales < 0) {
      setFormError("La cantidad de ventas debe ser 0 o más.");
      return;
    }

    const trimmedNewPlayerName = newPlayerName.trim();

    if (!trimmedNewPlayerName && !selectedPlayerId) {
      setFormError("Elegí un jugador registrado o escribí uno nuevo.");
      return;
    }

    if (trimmedNewPlayerName && !newPlayerExpiry) {
      setFormError("Para registrar un jugador nuevo completá la fecha de vencimiento.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let playerId = Number(selectedPlayerId);

      if (trimmedNewPlayerName) {
        const createdPlayer = await onCreatePlayer({
          name: trimmedNewPlayerName,
          expiryDate: newPlayerExpiry
        });
        playerId = createdPlayer.item.id;
      }

      await onAttachPlayer(activeEventId, playerId, parsedSales);
      setSelectedPlayerId("");
      setNewPlayerName("");
      setNewPlayerExpiry("");
      setSales("1");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo agregar el jugador al evento.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(entry: CarnetEventRankingItem) {
    setEditingEntry({
      playerId: entry.playerId,
      playerName: entry.playerName,
      sales: entry.sales
    });
  }

  async function handleSaveEdit() {
    if (!activeEventId || !editingEntry) return;

    setSaving(true);
    setFormError(null);

    try {
      await onUpdatePlayerSales(activeEventId, editingEntry.playerId, editingEntry.sales);
      setEditingEntry(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo actualizar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="carnet-event">
      <div className="carnet-event__header">
        <div>
          <p className="carnet-kicker">Evento</p>
          <h2>Ranking de ventas</h2>
          <p className="carnet-note">Creá un evento, sumá jugadores y ordená la tabla según la cantidad de ventas.</p>
        </div>
        <div className="carnet-event__summary">
          <article>
            <span>Evento</span>
            <strong>{event?.name ?? "Sin evento"}</strong>
          </article>
          <article>
            <span>Finaliza</span>
            <strong>
              {(() => {
                const daysLeft = getDaysUntil(event?.endDate ?? null);
                if (daysLeft === null) return "Sin fecha";
                if (daysLeft > 0) return `Quedan ${daysLeft} dias`;
                if (daysLeft === 0) return "Finaliza hoy";
                return `Finalizado`;
              })()}
            </strong>
          </article>
          <article>
            <span>Jugadores</span>
            <strong>{event?.playersCount ?? 0}</strong>
          </article>
          <article>
            <span>Ventas</span>
            <strong>{formatNumber(event?.totalSales ?? 0)}</strong>
          </article>
        </div>
      </div>

      <div className="carnet-event__grid">
        <section className="carnet-card carnet-event__panel">
          <div className="carnet-card__header">
            <div>
              <p className="carnet-card__eyebrow">Evento</p>
              <h3>Crear o cambiar evento</h3>
            </div>
          </div>

          <form className="carnet-form carnet-form--event" onSubmit={handleCreateEvent}>
            <label className="carnet-field">
              <span>Nombre del evento</span>
              <input value={eventName} onChange={(current) => setEventName(current.target.value)} placeholder="Ej: Torneo de socios" />
            </label>
            <label className="carnet-field">
              <span>Fecha de finalizacion</span>
              <input type="date" value={eventEndDate} onChange={(current) => setEventEndDate(current.target.value)} />
            </label>
            <button type="submit" className="carnet-submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear evento"}
            </button>
          </form>

          <div className="carnet-event-list">
            {events.length ? (
              events.map((currentEvent) => (
                <button
                  key={currentEvent.id}
                  type="button"
                  className={`carnet-event-chip ${activeEventId === currentEvent.id ? "is-active" : ""}`}
                  onClick={() => onSelectEvent(currentEvent.id)}
                >
                  <strong>{currentEvent.name}</strong>
                  <span>
                    {formatNumber(currentEvent.playersCount)} jugadores - {formatNumber(currentEvent.totalSales)} ventas
                  </span>
                  <small>
                    {(() => {
                      const daysLeft = getDaysUntil(currentEvent.endDate);
                      if (daysLeft === null) return "Sin fecha de finalizacion";
                      if (daysLeft > 0) return `Quedan ${daysLeft} dias`;
                      if (daysLeft === 0) return "Finaliza hoy";
                      return `Finalizo hace ${Math.abs(daysLeft)} dias`;
                    })()}
                  </small>
                </button>
              ))
            ) : (
              <p className="carnet-empty-inline">Todavia no hay eventos cargados.</p>
            )}
          </div>
        </section>

        <section className="carnet-card carnet-event__panel">
          <div className="carnet-card__header">
            <div>
              <p className="carnet-card__eyebrow">Participantes</p>
              <h3>Sumar jugador al evento</h3>
            </div>
          </div>

          <form className="carnet-form carnet-form--event-player" onSubmit={handleAddPlayer}>
            <label className="carnet-field">
              <span>Jugador registrado</span>
              <select value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}>
                <option value="">Elegir jugador</option>
                {playerOptions.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="carnet-field">
              <span>O registrar nuevo</span>
              <input
                value={newPlayerName}
                onChange={(event) => setNewPlayerName(event.target.value)}
                placeholder="Juan Perez"
              />
            </label>

            <label className="carnet-field">
              <span>Vencimiento nuevo</span>
              <input type="date" value={newPlayerExpiry} onChange={(event) => setNewPlayerExpiry(event.target.value)} />
            </label>

            <label className="carnet-field">
              <span>Ventas</span>
              <input type="number" min="0" value={sales} onChange={(event) => setSales(event.target.value)} />
            </label>

            <button type="submit" className="carnet-submit" disabled={saving || !activeEventId}>
              {saving ? "Agregando..." : "Agregar al evento"}
            </button>
          </form>

          {eventError ? <p className="carnet-form-error">{eventError}</p> : null}
          {formError ? <p className="carnet-form-error">{formError}</p> : null}
        </section>
      </div>

      <section className="carnet-event__ranking">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Ranking</p>
            <h3>Jugadores vendidos</h3>
          </div>
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
              onEdit={() => openEdit(entry)}
              onAddSale={() => {
                if (!activeEventId) return;
                void onUpdatePlayerSales(activeEventId, entry.playerId, entry.sales + 1);
              }}
            />
          ))}
        </div>
      </section>

      {editingEntry ? (
        <div className="carnet-modal-backdrop" role="presentation" onClick={() => setEditingEntry(null)}>
          <section className="carnet-modal" role="dialog" aria-modal="true" aria-label={`Editar ${editingEntry.playerName}`} onClick={(event) => event.stopPropagation()}>
            <div className="carnet-modal__header">
              <div>
                <p className="carnet-card__eyebrow">Editar ventas</p>
                <h2>{editingEntry.playerName}</h2>
              </div>
              <button type="button" className="carnet-modal__close" onClick={() => setEditingEntry(null)}>
                Cerrar
              </button>
            </div>

            <label className="carnet-field">
              <span>Ventas</span>
              <input
                type="number"
                min="0"
                value={editingEntry.sales}
                onChange={(event) =>
                  setEditingEntry((current) =>
                    current ? { ...current, sales: Number.parseInt(event.target.value || "0", 10) || 0 } : current
                  )
                }
              />
            </label>

            <div className="carnet-modal__actions">
              <button type="button" className="carnet-modal__ghost" onClick={() => setEditingEntry(null)}>
                Cancelar
              </button>
              <button type="button" className="carnet-submit" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambio"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
