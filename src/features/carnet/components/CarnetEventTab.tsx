import { useMemo, useState, type FormEvent } from "react";
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
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) return null;

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function RankingCard({
  entry,
  onEdit,
  onAddSale,
  onSubtractSale
}: {
  entry: CarnetEventRankingItem;
  onEdit: () => void;
  onAddSale: () => void;
  onSubtractSale: () => void;
}) {
  return (
    <article className={`carnet-ranking-card ${entry.position === 1 ? "is-leader" : ""}`} onDoubleClick={onEdit}>
      <div className="carnet-ranking-card__main">
        <div>
          <h3>{entry.playerName}</h3>
        </div>
        <div className="carnet-ranking-card__actions">
          <button
            type="button"
            className="carnet-ranking-card__minus"
            onClick={onSubtractSale}
            disabled={entry.sales <= 0}
            aria-label={`Restar venta a ${entry.playerName}`}
          >
            -
          </button>
          <button type="button" className="carnet-ranking-card__plus" onClick={onAddSale} aria-label={`Sumar venta a ${entry.playerName}`}>
            +
          </button>
        </div>
      </div>

      <div className="carnet-ranking-card__footer">
        <strong>{formatNumber(entry.sales)} ventas</strong>
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
  onAttachPlayer,
  onUpdatePlayerSales
}: CarnetEventTabProps) {
  const [eventName, setEventName] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
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

  async function handleAttachExistingPlayer(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault();

    if (!activeEventId) {
      setFormError("Primero creá o elegí un evento.");
      return;
    }

    if (!selectedPlayerId) {
      setFormError("Elegí un jugador registrado.");
      return;
    }

    const parsedSales = Number.parseInt(sales, 10);
    if (!Number.isFinite(parsedSales) || parsedSales < 0) {
      setFormError("La cantidad de ventas debe ser 0 o más.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await onAttachPlayer(activeEventId, Number(selectedPlayerId), parsedSales);
      setSelectedPlayerId("");
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

  const daysLeft = getDaysUntil(event?.endDate ?? null);
  const totalSales = event?.totalSales ?? 0;
  const targetSales = 150;
  const remainingSales = Math.max(targetSales - totalSales, 0);

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
          </div>
          <p className="carnet-note">Creá un evento, sumá jugadores y ordená la tabla según la cantidad de ventas.</p>
        </div>
      </div>

      <section className="carnet-event__overview">
        <div className="carnet-event__section-head">
          <p className="carnet-card__eyebrow">Eventos</p>
          <h3>Elegir evento</h3>
        </div>

        <div className="carnet-event-list">
          {events.length ? (
            events.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`carnet-event-chip ${item.id === activeEventId ? "is-active" : ""}`}
                onClick={() => onSelectEvent(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.endDate ? item.endDate : "Sin fecha"}</span>
              </button>
            ))
          ) : (
            <p className="carnet-empty-inline">Todavia no hay eventos cargados.</p>
          )}
        </div>
      </section>

      <section className="carnet-card carnet-event__panel carnet-event__panel--full">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Registro</p>
            <h3>Sumar jugador al evento</h3>
          </div>
        </div>

        <form className="carnet-form carnet-form--event-player" onSubmit={handleAttachExistingPlayer}>
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

      <section className="carnet-event__overview">
        <div className="carnet-event__section-head">
          <p className="carnet-card__eyebrow">Datos del evento</p>
          <h3>{event?.name ?? "Sin evento"}</h3>
        </div>

        <div className="carnet-event__event-meta carnet-event__event-meta--compact">
          <article>
            <span>Tiempo</span>
            <strong>
              {daysLeft === null ? "Sin fecha" : daysLeft > 0 ? `Falta ${daysLeft} dias` : daysLeft === 0 ? "Finaliza hoy" : "Finalizado"}
            </strong>
          </article>
          <article>
            <span>Meta</span>
            <strong>{formatNumber(targetSales)}</strong>
          </article>
          <article>
            <span>Vendido</span>
            <strong>{formatNumber(totalSales)}</strong>
          </article>
          <article>
            <span>Faltan</span>
            <strong>{formatNumber(remainingSales)}</strong>
          </article>
        </div>
      </section>

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
              onEdit={() => openEdit(entry)}
              onAddSale={() => {
                if (!activeEventId) return;
                void onUpdatePlayerSales(activeEventId, entry.playerId, entry.sales + 1);
              }}
              onSubtractSale={() => {
                if (!activeEventId || entry.sales <= 0) return;
                void onUpdatePlayerSales(activeEventId, entry.playerId, entry.sales - 1);
              }}
            />
          ))}
        </div>
      </section>

      {editingEntry ? (
        <div className="carnet-modal-backdrop" role="presentation" onClick={() => setEditingEntry(null)}>
          <section
            className="carnet-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Editar ${editingEntry.playerName}`}
            onClick={(event) => event.stopPropagation()}
          >
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
