import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCarnetPlayer,
  deleteCarnetPlayer,
  listCarnetPlayers,
  updateCarnetPlayer
} from "../features/carnet/carnet.api";
import {
  createCarnetEvent,
  getCarnetEvent,
  listCarnetEvents,
  updateCarnetEventPlayer,
  upsertCarnetEventPlayer
} from "../features/carnet/carnet.event.api";
import type { CarnetEvent, CarnetEventDetail } from "../features/carnet/carnet.event.types";
import type { CarnetPlayer } from "../features/carnet/carnet.types";
import { CarnetEventTab } from "../features/carnet/components/CarnetEventTab";

type AlertState = "normal" | "warning" | "critical";
type SourceState = "loading" | "online" | "offline";
type SavingAction = "save" | "delete" | null;
type TabMode = "players" | "events";

type EditingState = {
  playerId: number;
  playerName: string;
  expiryDate: string;
} | null;

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

function getDaysUntil(dateString: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getAlertState(daysLeft: number): AlertState {
  if (daysLeft <= 21) {
    return "critical";
  }

  if (daysLeft <= 30) {
    return "warning";
  }

  return "normal";
}

function sortPlayers(players: CarnetPlayer[]) {
  return [...players].sort((left, right) => {
    const leftDays = getDaysUntil(left.expiryDate);
    const rightDays = getDaysUntil(right.expiryDate);
    return leftDays - rightDays || left.name.localeCompare(right.name);
  });
}

function sortEvents(events: CarnetEvent[]) {
  return [...events].sort((left, right) => right.id - left.id);
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabMode>("players");
  const [players, setPlayers] = useState<CarnetPlayer[]>([]);
  const [events, setEvents] = useState<CarnetEvent[]>([]);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<CarnetEventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [sourceState, setSourceState] = useState<SourceState>("loading");
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<EditingState>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<SavingAction>(null);
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await listCarnetPlayers();
        if (!active) {
          return;
        }

        setPlayers(sortPlayers(response.items));
        setSourceState("online");
        setListError(null);
      } catch {
        if (!active) {
          return;
        }

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

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await listCarnetEvents();
        if (!active) {
          return;
        }

        const nextEvents = sortEvents(response.items);
        setEvents(nextEvents);
        setEventError(null);
        setSourceState("online");
      } catch {
        if (!active) {
          return;
        }

        setEvents([]);
        setEventError("No se pudieron cargar los eventos en este momento.");
        setSourceState("offline");
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
        if (!active) {
          return;
        }

        setActiveEventDetail(response.item);
        setEventError(null);
        setSourceState("online");
      } catch {
        if (!active) {
          return;
        }

        setActiveEventDetail(null);
        setEventError("No se pudo cargar el detalle del evento.");
        setSourceState("offline");
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

  const stats = useMemo(() => {
    const critical = players.filter((player) => getAlertState(getDaysUntil(player.expiryDate)) === "critical").length;
    const warning = players.filter((player) => getAlertState(getDaysUntil(player.expiryDate)) === "warning").length;

    return {
      total: players.length,
      warning,
      critical,
      events: events.length,
      eventSales: activeEventDetail?.event.totalSales ?? 0
    };
  }, [activeEventDetail, events.length, players]);

  async function refreshActiveEvent(eventId: number) {
    try {
      const response = await getCarnetEvent(eventId);
      setActiveEventDetail(response.item);
      setEvents((current) =>
        sortEvents(
          current.map((event) => {
            if (event.id !== response.item.event.id) {
              return event;
            }

            return response.item.event;
          })
        )
      );
      setEventError(null);
      setSourceState("online");
    } catch {
      setEventError("No se pudo refrescar el ranking del evento.");
      setSourceState("offline");
    }
  }

  async function handleCreateEvent(nameValue: string, endDate: string) {
    const response = await createCarnetEvent(nameValue, endDate);
    setEvents((current) => sortEvents([response.item, ...current.filter((event) => event.id !== response.item.id)]));
    setActiveEventId(response.item.id);
    setActiveTab("events");
    await refreshActiveEvent(response.item.id);
  }

  async function handleAttachEventPlayer(eventId: number, playerId: number, sales: number) {
    const response = await upsertCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) =>
      sortEvents(
        current.map((event) => {
          if (event.id !== response.item.event.id) {
            return event;
          }

          return response.item.event;
        })
      )
    );
    setSourceState("online");
  }

  async function handleUpdateEventPlayerSales(eventId: number, playerId: number, sales: number) {
    const response = await updateCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) =>
      sortEvents(
        current.map((event) => {
          if (event.id !== response.item.event.id) {
            return event;
          }

          return response.item.event;
        })
      )
    );
    setSourceState("online");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName || !expiryDate) {
      setFormError("Completa nombre y fecha antes de guardar.");
      return;
    }

    setFormError(null);

    try {
      const response = await createCarnetPlayer({
        name: trimmedName,
        expiryDate
      });

      setPlayers((current) => sortPlayers([response.item, ...current.filter((player) => player.id !== response.item.id)]));
      setName("");
      setExpiryDate("");
      setSourceState("online");
      setListError(null);

      if (activeEventId !== null) {
        await refreshActiveEvent(activeEventId);
      }
    } catch {
      setFormError("No se pudo guardar en la base de datos.");
      setSourceState("offline");
    }
  }

  function openEditModal(player: CarnetPlayer) {
    setEditingError(null);
    setEditingPlayer({
      playerId: player.id,
      playerName: player.name,
      expiryDate: player.expiryDate
    });
  }

  async function saveEdit() {
    if (!editingPlayer) {
      return;
    }

    const trimmedName = editingPlayer.playerName.trim();
    if (!trimmedName || !editingPlayer.expiryDate) {
      setEditingError("Completa nombre y fecha antes de guardar.");
      return;
    }

    setSavingAction("save");
    setEditingError(null);

    try {
      const response = await updateCarnetPlayer(editingPlayer.playerId, {
        name: trimmedName,
        expiryDate: editingPlayer.expiryDate
      });

      setPlayers((current) =>
        sortPlayers(current.map((player) => (player.id === response.item.id ? response.item : player)))
      );
      setSourceState("online");
      setEditingPlayer(null);

      if (activeEventId !== null) {
        await refreshActiveEvent(activeEventId);
      }
    } catch {
      setEditingError("No se pudo guardar en la base de datos.");
      setSourceState("offline");
    } finally {
      setSavingAction(null);
    }
  }

  async function deletePlayer() {
    if (!editingPlayer) {
      return;
    }

    const confirmed = window.confirm(`Eliminar a ${editingPlayer.playerName}?`);
    if (!confirmed) {
      return;
    }

    setSavingAction("delete");
    setEditingError(null);

    try {
      await deleteCarnetPlayer(editingPlayer.playerId);
      setPlayers((current) => current.filter((player) => player.id !== editingPlayer.playerId));
      setSourceState("online");
      setEditingPlayer(null);

      if (activeEventId !== null) {
        await refreshActiveEvent(activeEventId);
      }
    } catch {
      setEditingError("No se pudo borrar en la base de datos.");
      setSourceState("offline");
    } finally {
      setSavingAction(null);
    }
  }

  const isSaving = savingAction === "save";
  const isDeleting = savingAction === "delete";
  const hasPlayers = players.length > 0;

  return (
    <main className="carnet-shell">
      <section className="carnet-layout">
        <header className="carnet-hero">
          <div className="carnet-hero__top">
            <div>
              <p className="carnet-kicker">Registro de carnet</p>
              <h1>Equipo de Peñarol</h1>
              <p className="carnet-note">Gestion simple de jugadores, eventos y ranking de ventas, todo guardado en la base de datos.</p>
            </div>

            <div className="carnet-hero__meta">
              <span className="carnet-source">
                {sourceState === "online" ? "Conectado" : sourceState === "offline" ? "Sin conexion" : "Cargando"}
              </span>
              <div className="carnet-stats" aria-label="Resumen">
                <article className="carnet-stat" aria-label={`Jugadores: ${stats.total}`}>
                  <span>Jugadores</span>
                  <strong>{stats.total}</strong>
                </article>
                <article className="carnet-stat" aria-label={`Alertas: ${stats.warning}`}>
                  <span>Alertas</span>
                  <strong>{stats.warning}</strong>
                </article>
                <article className="carnet-stat" aria-label={`Crítico: ${stats.critical}`}>
                  <span>Crítico</span>
                  <strong>{stats.critical}</strong>
                </article>
                <article className="carnet-stat" aria-label={`Eventos: ${stats.events}`}>
                  <span>Eventos</span>
                  <strong>{stats.events}</strong>
                </article>
              </div>
            </div>
          </div>

          <div className="carnet-tabs" role="tablist" aria-label="Secciones">
            <button
              type="button"
              className={`carnet-tab ${activeTab === "players" ? "is-active" : ""}`}
              aria-pressed={activeTab === "players"}
              onClick={() => setActiveTab("players")}
            >
              Jugadores
            </button>
            <button
              type="button"
              className={`carnet-tab ${activeTab === "events" ? "is-active" : ""}`}
              aria-pressed={activeTab === "events"}
              onClick={() => setActiveTab("events")}
            >
              Evento
            </button>
          </div>
        </header>

        {activeTab === "players" ? (
          <>
            <section className="carnet-card carnet-form-card" aria-label="Alta de jugador">
              <div className="carnet-card__header">
                <div>
                  <p className="carnet-card__eyebrow">Nuevo jugador</p>
                  <h2>Ingresar datos</h2>
                </div>
              </div>

              <form className="carnet-form" onSubmit={handleSubmit}>
                <label className="carnet-field">
                  <span>Nombre</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej: Martin Rodriguez" />
                </label>

                <label className="carnet-field">
                  <span>Vencimiento</span>
                  <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
                </label>

                <button type="submit" className="carnet-submit">
                  Agregar jugador
                </button>
              </form>

              {formError ? <p className="carnet-form-error">{formError}</p> : null}
              {listError ? <p className="carnet-form-error">{listError}</p> : null}
            </section>

            <section className="carnet-grid" aria-label="Lista de jugadores">
              {hasPlayers ? (
                players.map((player) => {
                  const daysLeft = getDaysUntil(player.expiryDate);
                  const alertState = getAlertState(daysLeft);

                  return (
                    <article
                      key={player.id}
                      className={`carnet-player-card is-${alertState}`}
                      onDoubleClick={() => openEditModal(player)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          openEditModal(player);
                        }
                      }}
                    >
                      <div className="carnet-player-card__top">
                        <div>
                          <p className="carnet-player-card__name">{player.name}</p>
                          <p className="carnet-player-card__date">Vence {formatDate(player.expiryDate)}</p>
                        </div>
                        <span className={`carnet-badge is-${alertState}`}>
                          {alertState === "normal" ? "OK" : alertState === "warning" ? "Alerta" : "Crítico"}
                        </span>
                      </div>

                      <div className="carnet-player-card__footer">
                        <strong>{daysLeft > 0 ? `Faltan ${daysLeft} dias` : daysLeft === 0 ? "Vence hoy" : "Vencido"}</strong>
                        <small>
                          {alertState === "normal"
                            ? "En estado normal."
                            : alertState === "warning"
                              ? "Queda cerca del vencimiento."
                              : "Revisar de inmediato."}
                        </small>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="carnet-empty-state">
                  <h2>No hay jugadores cargados</h2>
                  <p>Usa el formulario de arriba para crear el primer registro y guardarlo en la base de datos.</p>
                </article>
              )}
            </section>
          </>
        ) : (
          <CarnetEventTab
            players={players}
            events={events}
            activeEventId={activeEventId}
            activeEventDetail={activeEventDetail}
            loadingEvent={loadingEvent}
            eventError={eventError}
            onCreateEvent={handleCreateEvent}
            onSelectEvent={setActiveEventId}
            onCreatePlayer={createCarnetPlayer}
            onAttachPlayer={handleAttachEventPlayer}
            onUpdatePlayerSales={handleUpdateEventPlayerSales}
          />
        )}
      </section>

      {editingPlayer ? (
        <div className="carnet-modal-backdrop" role="presentation" onClick={() => setEditingPlayer(null)}>
          <section
            className="carnet-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Editar jugador ${editingPlayer.playerName}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="carnet-modal__header">
              <div>
                <p className="carnet-card__eyebrow">Editar jugador</p>
                <h2>{editingPlayer.playerName}</h2>
              </div>
              <button type="button" className="carnet-modal__close" onClick={() => setEditingPlayer(null)}>
                Cerrar
              </button>
            </div>

            <label className="carnet-field">
              <span>Nombre</span>
              <input
                value={editingPlayer.playerName}
                onChange={(event) =>
                  setEditingPlayer((current) => (current ? { ...current, playerName: event.target.value } : current))
                }
              />
            </label>

            <label className="carnet-field">
              <span>Vencimiento</span>
              <input
                type="date"
                value={editingPlayer.expiryDate}
                onChange={(event) =>
                  setEditingPlayer((current) => (current ? { ...current, expiryDate: event.target.value } : current))
                }
              />
            </label>

            {editingError ? <p className="carnet-form-error">{editingError}</p> : null}

            <div className="carnet-modal__actions">
              <button
                type="button"
                className="carnet-modal__danger"
                onClick={deletePlayer}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar jugador"}
              </button>

              <div className="carnet-modal__actions-right">
                <button type="button" className="carnet-modal__ghost" onClick={() => setEditingPlayer(null)}>
                  Cancelar
                </button>
                <button type="button" className="carnet-submit" onClick={saveEdit} disabled={isSaving || isDeleting}>
                  {isSaving ? "Guardando..." : "Guardar cambio"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
