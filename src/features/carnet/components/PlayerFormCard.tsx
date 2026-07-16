import { useState, type FormEvent } from "react";
import type { CarnetPlayerPayload, CarnetSex } from "../carnet.types";

type PlayerFormCardProps = {
  onCreate: (payload: CarnetPlayerPayload) => Promise<unknown>;
  listError: string | null;
};

type PlayerFormState = {
  name: string;
  expiryDate: string;
  sex: CarnetSex;
  sales: string;
};

const EMPTY_FORM: PlayerFormState = { name: "", expiryDate: "", sex: "masculino", sales: "" };

export function PlayerFormCard({ onCreate, listError }: PlayerFormCardProps) {
  const [form, setForm] = useState<PlayerFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const parsedSales = form.sales.trim() ? Number.parseInt(form.sales, 10) : null;

    if (!trimmedName || !form.expiryDate || !form.sex) {
      setFormError("Completa nombre, vencimiento y sexo antes de guardar.");
      return;
    }

    if (form.sales.trim() && (Number.isNaN(parsedSales) || (parsedSales ?? 0) < 0)) {
      setFormError("Ventas debe ser 0 o más.");
      return;
    }

    setFormError(null);

    try {
      await onCreate({ name: trimmedName, expiryDate: form.expiryDate, sex: form.sex, sales: parsedSales });
      setForm(EMPTY_FORM);
    } catch {
      setFormError("No se pudo guardar en la base de datos.");
    }
  }

  return (
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
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ej: Martin Rodriguez"
          />
        </label>

        <label className="carnet-field">
          <span>Vencimiento carnet</span>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
          />
        </label>

        <label className="carnet-field">
          <span>Sexo</span>
          <select value={form.sex} onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value as CarnetSex }))}>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </label>

        <label className="carnet-field">
          <span>Ventas opcional</span>
          <input
            type="number"
            min="0"
            value={form.sales}
            onChange={(event) => setForm((current) => ({ ...current, sales: event.target.value }))}
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
  );
}
