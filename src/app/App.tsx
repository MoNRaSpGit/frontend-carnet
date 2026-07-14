import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCarnetPlayer,
  deleteCarnetPlayer,
  listCarnetPlayers,
  updateCarnetPlayer
} from "../features/carnet/carnet.api";
import type { CarnetPlayer } from "../features/carnet/carnet.types";

type AlertState = "normal" | "warning" | "critical";
type SourceState = "loading" | "online" | "local";
type SavingAction = "save" | "delete" | null;

type EditingState = {
  playerId: number;
  playerName: string;
  expiryDate: string;
} | null;

function addDays(baseDate: Date, days: number) {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date();

const FALLBACK_PLAYERS: CarnetPlayer[] = [
  {
    id: 1,
    name: "Juan Perez",
    expiryDate: toDateInputValue(addDays(today, 45)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Ana Lopez",
    expiryDate: toDateInputValue(addDays(today, 28)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Pablo Diaz",
    expiryDate: toDateInputValue(addDays(today, 10)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
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

export function App() {
  const [players, setPlayers] = useState<CarnetPlayer[]>(FALLBACK_PLAYERS);
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [sourceState, setSourceState] = useState<SourceState>("loading");
  const [formError, setFormError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<EditingState>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<SavingAction>(null);

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = await listCarnetPlayers();
        if (!active) {
          return;
        }

        setPlayers(sortPlayers(response.items.length > 0 ? response.items : FALLBACK_PLAYERS));
        setSourceState("online");
      } catch {
        if (!active) {
          return;
        }

        setPlayers(sortPlayers(FALLBACK_PLAYERS));
        setSourceState("local");
      }
    }

    void loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const critical = players.filter((player) => getAlertState(getDaysUntil(player.expiryDate)) === "critical").length;
    const warning = players.filter((player) => getAlertState(getDaysUntil(player.expiryDate)) === "warning").length;

    return {
      total: players.length,
      warning,
      critical
    };
  }, [players]);

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
    } catch {
      const nextPlayer: CarnetPlayer = {
        id: Date.now(),
        name: trimmedName,
        expiryDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setPlayers((current) => sortPlayers([nextPlayer, ...current]));
      setName("");
      setExpiryDate("");
      setSourceState("local");
      setFormError("No se pudo guardar en el backend; quedo agregado en modo local por ahora.");
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
    } catch {
      setPlayers((current) =>
        sortPlayers(
          current.map((player) =>
            player.id === editingPlayer.playerId
              ? {
                  ...player,
                  name: trimmedName,
                  expiryDate: editingPlayer.expiryDate,
                  updatedAt: new Date().toISOString()
                }
              : player
          )
        )
      );
      setSourceState("local");
      setEditingError("No se pudo guardar en el backend; quedo actualizado solo en pantalla.");
      setEditingPlayer(null);
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
    } catch {
      setPlayers((current) => current.filter((player) => player.id !== editingPlayer.playerId));
      setSourceState("local");
      setEditingError("No se pudo borrar en el backend; quedo eliminado solo en pantalla.");
      setEditingPlayer(null);
    } finally {
      setSavingAction(null);
    }
  }

  const isSaving = savingAction === "save";
  const isDeleting = savingAction === "delete";

  return (
    <main className="carnet-shell">
      <section className="carnet-layout">
        <header className="carnet-hero">
          <div>
            <p className="carnet-kicker">Registro de carnet</p>
            <h1>Equipo de Peñarol</h1>
            <p className="carnet-note">Gestion simple de jugadores con vencimientos, edicion y bajas rapidas.</p>
          </div>

          <div className="carnet-hero__meta">
            <span className="carnet-source">Registro</span>
            <div className="carnet-stats" aria-label="Resumen">
              <article className="carnet-stat" aria-label={`Jugadores: ${stats.total}`}>
                <span>Jugadores</span>
                <strong>{stats.total}</strong>
              </article>
              <article className="carnet-stat" aria-label={`En alerta: ${stats.warning}`}>
                <span>Alertas</span>
                <strong>{stats.warning}</strong>
              </article>
              <article className="carnet-stat" aria-label={`Críticos: ${stats.critical}`}>
                <span>Crítico</span>
                <strong>{stats.critical}</strong>
              </article>
            </div>
          </div>
        </header>

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
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Martin Rodriguez"
              />
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
        </section>

        <section className="carnet-grid" aria-label="Lista de jugadores">
          {players.map((player) => {
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
          })}
        </section>
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
                  setEditingPlayer((current) =>
                    current ? { ...current, expiryDate: event.target.value } : current
                  )
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
