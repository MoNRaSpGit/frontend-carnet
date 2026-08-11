import { useState, type FormEvent } from "react";

type CreateEventFormProps = {
  onCreateEvent: (name: string, endDate: string) => Promise<unknown>;
};

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateEventForm({ onCreateEvent }: CreateEventFormProps) {
  const [name, setName] = useState("");
  const [endDate, setEndDate] = useState(todayAsDateInputValue);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Ponele un nombre al evento.");
      return;
    }
    if (!endDate) {
      setFormError("Elegí una fecha de fin.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await onCreateEvent(trimmedName, endDate);
      setName("");
      setEndDate(todayAsDateInputValue());
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el evento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="carnet-card carnet-event__panel carnet-event__panel--full">
      <div className="carnet-card__header">
        <div>
          <p className="carnet-card__eyebrow">Nuevo ciclo</p>
          <h3>Crear evento</h3>
        </div>
      </div>

      <form className="carnet-form" onSubmit={handleSubmit}>
        <label className="carnet-field">
          <span>Nombre del evento</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej: Cazuela agosto 2026"
          />
        </label>

        <label className="carnet-field">
          <span>Fecha de fin</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>

        <button type="submit" className="carnet-submit" disabled={saving}>
          {saving ? "Creando..." : "Crear evento"}
        </button>
      </form>

      {formError ? <p className="carnet-form-error">{formError}</p> : null}
    </section>
  );
}
