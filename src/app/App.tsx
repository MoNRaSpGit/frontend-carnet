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
import type { CarnetPlayer, CarnetSex } from "../features/carnet/carnet.types";
import { CarnetEventTab } from "../features/carnet/components/CarnetEventTab";

type AlertState = "normal" | "warning" | "critical";
type SourceState = "loading" | "online" | "offline";
type SavingAction = "save" | "delete" | null;
type TabMode = "players" | "male" | "female" | "events";

type EditingState = {
  playerId: number;
  playerName: string;
  expiryDate: string;
  sex: CarnetSex;
  sales: string;
} | null;

type PlayerFormState = {
  name: string;
  expiryDate: string;
  sex: CarnetSex;
  sales: string;
};

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatNumber(value: number) {
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
  if (daysLeft <= 21) return "critical";
  if (daysLeft <= 30) return "warning";
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

function sexLabel(sex: CarnetSex) {
  return sex === "femenino" ? "Femenino" : "Masculino";
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
  const [playerForm, setPlayerForm] = useState<PlayerFormState>({
    name: "",
    expiryDate: "",
    sex: "masculino",
    sales: ""
  });

  function syncActiveEventWithPlayer(nextPlayer: CarnetPlayer, mode: "upsert" | "delete") {
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

      return {
        event: current.event,
        players: nextPlayers,
        ranking: nextRanking
      };
    });
  }

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

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await listCarnetEvents();
        if (!active) return;

        setEvents(sortEvents(response.items));
        setEventError(null);
        setSourceState("online");
      } catch {
        if (!active) return;

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
        if (!active) return;

        setActiveEventDetail(response.item);
        setEventError(null);
        setSourceState("online");
      } catch {
        if (!active) return;

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
    const female = players.filter((player) => player.sex === "femenino").length;
    const male = players.filter((player) => player.sex === "masculino").length;

    return {
      total: players.length,
      female,
      male,
      critical,
      events: events.length,
      eventSales: activeEventDetail?.event.totalSales ?? 0
    };
  }, [activeEventDetail, events.length, players]);

  async function handleCreateEvent(nameValue: string, endDate: string) {
    const response = await createCarnetEvent(nameValue, endDate);
    setEvents((current) => sortEvents([response.item, ...current.filter((event) => event.id !== response.item.id)]));
    setActiveEventId(response.item.id);
    setActiveTab("events");
    setActiveEventDetail({
      event: response.item,
      players,
      ranking: []
    });
    setEventError(null);
    setSourceState("online");
  }

  async function handleAttachEventPlayer(eventId: number, playerId: number, sales: number) {
    const response = await upsertCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) =>
      sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event)))
    );
    setSourceState("online");
  }

  async function handleUpdateEventPlayerSales(eventId: number, playerId: number, sales: number) {
    const response = await updateCarnetEventPlayer(eventId, playerId, sales);
    setActiveEventDetail(response.item);
    setEvents((current) =>
      sortEvents(current.map((event) => (event.id === response.item.event.id ? response.item.event : event)))
    );
    setSourceState("online");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = playerForm.name.trim();
    const parsedSales = playerForm.sales.trim() ? Number.parseInt(playerForm.sales, 10) : null;

    if (!trimmedName || !playerForm.expiryDate || !playerForm.sex) {
      setFormError("Completa nombre, vencimiento y sexo antes de guardar.");
      return;
    }

    if (playerForm.sales.trim() && (Number.isNaN(parsedSales) || (parsedSales ?? 0) < 0)) {
      setFormError("Ventas debe ser 0 o más.");
      return;
    }

    setFormError(null);

    try {
      const response = await createCarnetPlayer({
        name: trimmedName,
        expiryDate: playerForm.expiryDate,
        sex: playerForm.sex,
        sales: parsedSales
      });

      setPlayers((current) => sortPlayers([response.item, ...current.filter((player) => player.id !== response.item.id)]));
      syncActiveEventWithPlayer(response.item, "upsert");
      setPlayerForm({
        name: "",
        expiryDate: "",
        sex: "masculino",
        sales: ""
      });
      setSourceState("online");
      setListError(null);
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
      expiryDate: player.expiryDate,
      sex: player.sex,
      sales: player.sales === null ? "" : String(player.sales)
    });
  }

  async function saveEdit() {
    if (!editingPlayer) return;

    const trimmedName = editingPlayer.playerName.trim();
    const parsedSales = editingPlayer.sales.trim() ? Number.parseInt(editingPlayer.sales, 10) : null;

    if (!trimmedName || !editingPlayer.expiryDate) {
      setEditingError("Completa nombre y fecha antes de guardar.");
      return;
    }

    if (editingPlayer.sales.trim() && (Number.isNaN(parsedSales) || (parsedSales ?? 0) < 0)) {
      setEditingError("Ventas debe ser 0 o más.");
      return;
    }

    setSavingAction("save");
    setEditingError(null);

    try {
      const response = await updateCarnetPlayer(editingPlayer.playerId, {
        name: trimmedName,
        expiryDate: editingPlayer.expiryDate,
        sex: editingPlayer.sex,
        sales: parsedSales
      });

      setPlayers((current) =>
        sortPlayers(current.map((player) => (player.id === response.item.id ? response.item : player)))
      );
      syncActiveEventWithPlayer(response.item, "upsert");
      setSourceState("online");
      setEditingPlayer(null);
    } catch {
      setEditingError("No se pudo guardar en la base de datos.");
      setSourceState("offline");
    } finally {
      setSavingAction(null);
    }
  }

  async function deletePlayer() {
    if (!editingPlayer) return;

    const confirmed = window.confirm(`Eliminar a ${editingPlayer.playerName}?`);
    if (!confirmed) return;

    setSavingAction("delete");
    setEditingError(null);

    try {
      await deleteCarnetPlayer(editingPlayer.playerId);
      setPlayers((current) => current.filter((player) => player.id !== editingPlayer.playerId));
      syncActiveEventWithPlayer(
        {
          id: editingPlayer.playerId,
          name: editingPlayer.playerName,
          expiryDate: editingPlayer.expiryDate,
          sex: editingPlayer.sex,
          sales: editingPlayer.sales ? Number.parseInt(editingPlayer.sales, 10) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "delete"
      );
      setSourceState("online");
      setEditingPlayer(null);
    } catch {
      setEditingError("No se pudo borrar en la base de datos.");
      setSourceState("offline");
    } finally {
      setSavingAction(null);
    }
  }

  const isSaving = savingAction === "save";
  const isDeleting = savingAction === "delete";

  const malePlayers = players.filter((player) => player.sex === "masculino");
  const femalePlayers = players.filter((player) => player.sex === "femenino");

  const renderPlayerGrid = (items: CarnetPlayer[]) => {
    if (!items.length) {
      return (
        <article className="carnet-empty-state">
          <h2>No hay jugadores cargados</h2>
          <p>Usa el formulario de arriba para crear el primer registro y guardarlo en la base de datos.</p>
        </article>
      );
    }

    return items.map((player) => {
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
              <p className="carnet-player-card__date">{sexLabel(player.sex)} · Vence {formatDate(player.expiryDate)}</p>
            </div>
            <span className={`carnet-badge is-${alertState}`}>
              {alertState === "normal" ? "OK" : alertState === "warning" ? "Alerta" : "Crítico"}
            </span>
          </div>

          <div className="carnet-player-card__footer">
            <strong>{daysLeft > 0 ? `Faltan ${daysLeft} dias` : daysLeft === 0 ? "Vence hoy" : "Vencido"}</strong>
            <small>{player.sales !== null ? `Ventas ${formatNumber(player.sales)}` : "Sin ventas cargadas."}</small>
          </div>
        </article>
      );
    });
  };

  const tabContent =
    activeTab === "players" ? (
      <section className="carnet-card carnet-form-card" aria-label="Alta de jugador">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Nuevo jugador</p>
            <h2>Ingresar datos</h2>
          </div>
        </div>

        <form className="carnet-form carnet-form--player" onSubmit={handleSubmit}>
          <label className="carnet-field">
            <span>Nombre</span>
            <input
              value={playerForm.name}
              onChange={(event) => setPlayerForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej: Martin Rodriguez"
            />
          </label>

          <label className="carnet-field">
            <span>Vencimiento carnet</span>
            <input
              type="date"
              value={playerForm.expiryDate}
              onChange={(event) => setPlayerForm((current) => ({ ...current, expiryDate: event.target.value }))}
            />
          </label>

          <label className="carnet-field">
            <span>Sexo</span>
            <select
              value={playerForm.sex}
              onChange={(event) =>
                setPlayerForm((current) => ({ ...current, sex: event.target.value as CarnetSex }))
              }
            >
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </label>

          <label className="carnet-field">
            <span>Ventas opcional</span>
            <input
              type="number"
              min="0"
              value={playerForm.sales}
              onChange={(event) => setPlayerForm((current) => ({ ...current, sales: event.target.value }))}
              placeholder="0"
            />
          </label>

          <button type="submit" className="carnet-submit">
            Agregar jugador
          </button>
        </form>

        {formError ? <p className="carnet-form-error">{formError}</p> : null}
        {listError ? <p className="carnet-form-error">{listError}</p> : null}
      </section>
    ) : activeTab === "male" ? (
      <section className="carnet-card" aria-label="Jugadores masculinos">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Masculino</p>
            <h2>Jugadores</h2>
          </div>
        </div>
        <section className="carnet-grid">{renderPlayerGrid(malePlayers)}</section>
      </section>
    ) : activeTab === "female" ? (
      <section className="carnet-card" aria-label="Jugadoras femeninas">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Femenino</p>
            <h2>Jugadoras</h2>
          </div>
        </div>
        <section className="carnet-grid">{renderPlayerGrid(femalePlayers)}</section>
      </section>
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
        onAttachPlayer={handleAttachEventPlayer}
        onUpdatePlayerSales={handleUpdateEventPlayerSales}
      />
    );

  return (
    <main className="carnet-shell">
      <header className="carnet-topbar">
        <nav className="carnet-tabs carnet-tabs--header" role="tablist" aria-label="Secciones">
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
            className={`carnet-tab ${activeTab === "male" ? "is-active" : ""}`}
            aria-pressed={activeTab === "male"}
            onClick={() => setActiveTab("male")}
          >
            Masculino
          </button>
          <button
            type="button"
            className={`carnet-tab ${activeTab === "female" ? "is-active" : ""}`}
            aria-pressed={activeTab === "female"}
            onClick={() => setActiveTab("female")}
          >
            Femenino
          </button>
          <button
            type="button"
            className={`carnet-tab ${activeTab === "events" ? "is-active" : ""}`}
            aria-pressed={activeTab === "events"}
            onClick={() => setActiveTab("events")}
          >
            Evento
          </button>
        </nav>
      </header>

      <section className="carnet-layout">
        <header className="carnet-hero">
          <div className="carnet-hero__top">
            <div>
              <p className="carnet-kicker">Registro de carnet</p>
              <h1>Equipo de Peñarol</h1>
              <p className="carnet-note">Gestion simple de jugadores, eventos y ranking de ventas, todo guardado en la base de datos.</p>
            </div>

            {activeTab === "players" ? (
              <div className="carnet-hero__meta">
                <span className="carnet-source">
                  {sourceState === "online" ? "Conectado" : sourceState === "offline" ? "Sin conexion" : "Cargando"}
                </span>
                <div className="carnet-stats" aria-label="Resumen">
                  <article className="carnet-stat" aria-label={`Jugadores: ${stats.total}`}>
                    <span>Jugadores</span>
                    <strong>{stats.total}</strong>
                  </article>
                  <article className="carnet-stat" aria-label={`Masculino: ${stats.male}`}>
                    <span>Masculino</span>
                    <strong>{stats.male}</strong>
                  </article>
                  <article className="carnet-stat" aria-label={`Femenino: ${stats.female}`}>
                    <span>Femenino</span>
                    <strong>{stats.female}</strong>
                  </article>
                  <article className="carnet-stat" aria-label={`Crítico: ${stats.critical}`}>
                    <span>Crítico</span>
                    <strong>{stats.critical}</strong>
                  </article>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {tabContent}
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
              <span>Vencimiento carnet</span>
              <input
                type="date"
                value={editingPlayer.expiryDate}
                onChange={(event) =>
                  setEditingPlayer((current) => (current ? { ...current, expiryDate: event.target.value } : current))
                }
              />
            </label>

            <label className="carnet-field">
              <span>Sexo</span>
              <select
                value={editingPlayer.sex}
                onChange={(event) =>
                  setEditingPlayer((current) =>
                    current ? { ...current, sex: event.target.value as CarnetSex } : current
                  )
                }
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </label>

            <label className="carnet-field">
              <span>Ventas opcional</span>
              <input
                type="number"
                min="0"
                value={editingPlayer.sales}
                onChange={(event) =>
                  setEditingPlayer((current) => (current ? { ...current, sales: event.target.value } : current))
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
