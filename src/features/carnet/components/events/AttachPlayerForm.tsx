import { useMemo, useState, type FormEvent } from "react";
import type { CarnetPlayer } from "../../carnet.types";

type AttachPlayerFormProps = {
  players: CarnetPlayer[];
  activeEventId: number | null;
  eventError: string | null;
  onAttachPlayer: (eventId: number, playerId: number, sales: number) => Promise<unknown>;
};

export function AttachPlayerForm({ players, activeEventId, eventError, onAttachPlayer }: AttachPlayerFormProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [sales, setSales] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const playerOptions = useMemo(() => {
    return [...players].sort((left, right) => left.name.localeCompare(right.name));
  }, [players]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

  return (
    <section className="carnet-card carnet-event__panel carnet-event__panel--full">
      <div className="carnet-card__header">
        <div>
          <p className="carnet-card__eyebrow">Registro</p>
          <h3>Sumar jugador al evento</h3>
        </div>
      </div>

      <form className="carnet-form carnet-form--event-player" onSubmit={handleSubmit}>
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
  );
}
