import { useState, type FormEvent } from "react";
import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

// Ocultado a pedido explicito (2026-08-16): el boton "Agregar" de esta
// tarjeta (que permite a cualquier operario cargar una venta nueva sin
// PIN de admin) se implemento y se probo en produccion, pero se decidio
// no mostrarlo por ahora. El backend (POST
// carnet/events/:eventId/players/:playerId/sales, sin guard) y todo este
// componente siguen intactos -- para reactivarlo, poner esta constante
// en true.
const MOSTRAR_BOTON_AGREGAR = false;

type UsuarioSaleCardProps = {
  entry: CarnetEventRankingItem;
  onToggleDelivered: (buyerId: number, delivered: boolean) => void;
  onAddSale: (buyerName: string, quantity: number) => Promise<unknown>;
};

export function UsuarioSaleCard({ entry, onToggleDelivered, onAddSale }: UsuarioSaleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const deliveredCount = entry.buyers.reduce((sum, buyer) => sum + (buyer.delivered ? buyer.quantity : 0), 0);

  async function handleSubmitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = buyerName.trim();
    const parsedQuantity = Number.parseInt(quantity, 10);

    if (!trimmedName) {
      setError("Ingresá el nombre de la persona.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      setError("La cantidad debe ser 1 o más.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onAddSale(trimmedName, parsedQuantity);
      setBuyerName("");
      setQuantity("1");
      setShowAddForm(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo agregar la venta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="carnet-usuario-card">
      <div className="carnet-usuario-card__header">
        <h3>{entry.playerName}</h3>
        <div className="carnet-usuario-card__summary">
          <span>
            {formatNumber(deliveredCount)}/{formatNumber(entry.sales)} entregadas
          </span>
          <button type="button" className="carnet-usuario-card__details-toggle" onClick={() => setShowDetails((current) => !current)}>
            {showDetails ? "Ocultar detalle" : "Detalle"}
          </button>
        </div>
      </div>

      {showDetails ? (
        entry.buyers.length ? (
          <ul className="carnet-usuario-card__buyer-list">
            {entry.buyers.map((buyer) => (
              <li key={buyer.id} className={buyer.delivered ? "is-delivered" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={buyer.delivered}
                    onChange={(event) => onToggleDelivered(buyer.id, event.target.checked)}
                  />
                  <span>
                    {buyer.quantity} {buyer.buyerName}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="carnet-usuario-card__empty">Todavia no hay detalle de ventas cargado.</p>
        )
      ) : null}

      {MOSTRAR_BOTON_AGREGAR &&
        (showAddForm ? (
          <form className="carnet-usuario-card__add-form" onSubmit={handleSubmitSale}>
            <input
              type="text"
              className="carnet-usuario-card__add-input"
              placeholder="Nombre de la persona"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              autoFocus
            />
            <input
              type="number"
              min="1"
              className="carnet-usuario-card__add-quantity"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <div className="carnet-usuario-card__add-actions">
              <button type="button" className="carnet-usuario-card__add-cancel" onClick={() => setShowAddForm(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="carnet-usuario-card__add-confirm" disabled={saving}>
                {saving ? "Guardando..." : "Agregar"}
              </button>
            </div>
            {error ? <p className="carnet-usuario-card__add-error">{error}</p> : null}
          </form>
        ) : (
          <button type="button" className="carnet-usuario-card__add-toggle" onClick={() => setShowAddForm(true)}>
            Agregar
          </button>
        ))}
    </article>
  );
}
