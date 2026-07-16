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
  cedula: string;
  birthDate: string;
};

const EMPTY_FORM: PlayerFormState = { name: "", expiryDate: "", sex: "masculino", cedula: "", birthDate: "" };

export function PlayerFormCard({ onCreate, listError }: PlayerFormCardProps) {
  const [form, setForm] = useState<PlayerFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedCedula = form.cedula.trim();

    if (!trimmedName || !form.expiryDate || !form.sex || !trimmedCedula || !form.birthDate) {
      setFormError("Completa nombre, vencimiento, sexo, cedula y fecha de nacimiento antes de guardar.");
      return;
    }

    setFormError(null);

    try {
      await onCreate({
        name: trimmedName,
        expiryDate: form.expiryDate,
        sex: form.sex,
        cedula: trimmedCedula,
        birthDate: form.birthDate
      });
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
          <span>Cedula</span>
          <input
            value={form.cedula}
            onChange={(event) => setForm((current) => ({ ...current, cedula: event.target.value }))}
            placeholder="Ej: 1234567-8"
          />
        </label>

        <label className="carnet-field">
          <span>Fecha de nacimiento</span>
          <input
            type="date"
            value={form.birthDate}
            onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
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
