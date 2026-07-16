import { useState } from "react";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

type EditEventSalesModalProps = {
  entry: CarnetEventRankingItem;
  onClose: () => void;
  onSave: (sales: number) => Promise<void>;
};

export function EditEventSalesModal({ entry, onClose, onSave }: EditEventSalesModalProps) {
  const [sales, setSales] = useState(entry.sales);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      await onSave(sales);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo actualizar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="carnet-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="carnet-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Editar ${entry.playerName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="carnet-modal__header">
          <div>
            <p className="carnet-card__eyebrow">Editar ventas</p>
            <h2>{entry.playerName}</h2>
          </div>
          <button type="button" className="carnet-modal__close" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <label className="carnet-field">
          <span>Ventas</span>
          <input
            type="number"
            min="0"
            value={sales}
            onChange={(event) => setSales(Number.parseInt(event.target.value || "0", 10) || 0)}
          />
        </label>

        {error ? <p className="carnet-form-error">{error}</p> : null}

        <div className="carnet-modal__actions">
          <button type="button" className="carnet-modal__ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="carnet-submit" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambio"}
          </button>
        </div>
      </section>
    </div>
  );
}
