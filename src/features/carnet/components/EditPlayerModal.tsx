import { useState } from "react";
import type { CarnetPlayer, CarnetPlayerPayload, CarnetSex } from "../carnet.types";

type EditPlayerModalProps = {
  player: CarnetPlayer;
  onClose: () => void;
  onSave: (payload: Partial<CarnetPlayerPayload>) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
};

type SavingAction = "save" | "delete" | null;

export function EditPlayerModal({ player, onClose, onSave, onDelete }: EditPlayerModalProps) {
  const [name, setName] = useState(player.name);
  const [expiryDate, setExpiryDate] = useState(player.expiryDate);
  const [sex, setSex] = useState<CarnetSex>(player.sex);
  const [cedula, setCedula] = useState(player.cedula ?? "");
  const [birthDate, setBirthDate] = useState(player.birthDate ?? "");
  const [sales, setSales] = useState(player.sales === null ? "" : String(player.sales));
  const [error, setError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<SavingAction>(null);

  const isSaving = savingAction === "save";
  const isDeleting = savingAction === "delete";

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedCedula = cedula.trim();
    const parsedSales = sales.trim() ? Number.parseInt(sales, 10) : null;

    // Cedula y fecha de nacimiento quedan opcionales: lo unico obligatorio
    // para el carnet en si es el nombre y el vencimiento.
    if (!trimmedName || !expiryDate) {
      setError("Completa nombre y fecha de vencimiento antes de guardar.");
      return;
    }

    if (sales.trim() && (Number.isNaN(parsedSales) || (parsedSales ?? 0) < 0)) {
      setError("Ventas debe ser 0 o más.");
      return;
    }

    setSavingAction("save");
    setError(null);

    try {
      // Si se dejan en blanco, no se mandan -- el backend conserva lo que
      // ya habia en vez de pisarlo con un valor vacio.
      await onSave({
        name: trimmedName,
        expiryDate,
        sex,
        sales: parsedSales,
        ...(trimmedCedula ? { cedula: trimmedCedula } : {}),
        ...(birthDate ? { birthDate } : {})
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message ? saveError.message : "No se pudo guardar en la base de datos.");
    } finally {
      setSavingAction(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Eliminar a ${player.name}?`);
    if (!confirmed) return;

    setSavingAction("delete");
    setError(null);

    try {
      await onDelete();
      onClose();
    } catch {
      setError("No se pudo borrar en la base de datos.");
    } finally {
      setSavingAction(null);
    }
  }

  return (
    <div className="carnet-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="carnet-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Editar jugador ${player.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="carnet-modal__header">
          <div>
            <p className="carnet-card__eyebrow">Editar jugador</p>
            <h2>{player.name}</h2>
          </div>
          <button type="button" className="carnet-modal__close" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <label className="carnet-field">
          <span>Nombre</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="carnet-field">
          <span>Vencimiento carnet</span>
          <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </label>

        <label className="carnet-field">
          <span>Sexo</span>
          <select value={sex} onChange={(event) => setSex(event.target.value as CarnetSex)}>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </label>

        <label className="carnet-field">
          <span>Cedula opcional</span>
          <input value={cedula} onChange={(event) => setCedula(event.target.value)} placeholder="Ej: 1234567-8" />
        </label>

        <label className="carnet-field">
          <span>Fecha de nacimiento opcional</span>
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
        </label>

        <label className="carnet-field">
          <span>Ventas opcional</span>
          <input type="number" min="0" value={sales} onChange={(event) => setSales(event.target.value)} />
        </label>

        {error ? <p className="carnet-form-error">{error}</p> : null}

        <div className="carnet-modal__actions">
          <button type="button" className="carnet-modal__danger" onClick={handleDelete} disabled={isSaving || isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar jugador"}
          </button>

          <div className="carnet-modal__actions-right">
            <button type="button" className="carnet-modal__ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="carnet-submit" onClick={handleSave} disabled={isSaving || isDeleting}>
              {isSaving ? "Guardando..." : "Guardar cambio"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
