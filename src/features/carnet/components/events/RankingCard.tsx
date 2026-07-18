import { useState } from "react";
import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

type RankingCardProps = {
  entry: CarnetEventRankingItem;
  onEdit: () => void;
  onAddSale: () => void;
  onSubtractSale: () => void;
  onAddBuyer: (buyerName: string, quantity: number) => Promise<unknown>;
  onRemoveBuyer: (buyerId: number) => Promise<unknown>;
};

export function RankingCard({ entry, onEdit, onAddSale, onSubtractSale, onAddBuyer, onRemoveBuyer }: RankingCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerQuantity, setBuyerQuantity] = useState("1");
  const [buyerError, setBuyerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAddBuyer() {
    const trimmedName = buyerName.trim();
    const parsedQuantity = Number.parseInt(buyerQuantity, 10);

    if (!trimmedName) {
      setBuyerError("Ingresa un nombre.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setBuyerError("La cantidad tiene que ser mayor a 0.");
      return;
    }

    setSaving(true);
    setBuyerError(null);

    try {
      await onAddBuyer(trimmedName, parsedQuantity);
      setBuyerName("");
      setBuyerQuantity("1");
    } catch (error) {
      setBuyerError(error instanceof Error ? error.message : "No se pudo agregar el detalle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`carnet-ranking-card ${entry.position === 1 ? "is-leader" : ""}`}>
      <div className="carnet-ranking-card__main" onDoubleClick={onEdit}>
        <div>
          <h3>{entry.playerName}</h3>
        </div>
        <div className="carnet-ranking-card__actions">
          <button
            type="button"
            className="carnet-ranking-card__minus"
            onClick={onSubtractSale}
            disabled={entry.sales <= 0}
            aria-label={`Restar venta a ${entry.playerName}`}
          >
            -
          </button>
          <button type="button" className="carnet-ranking-card__plus" onClick={onAddSale} aria-label={`Sumar venta a ${entry.playerName}`}>
            +
          </button>
        </div>
      </div>

      <div className="carnet-ranking-card__footer">
        <div className="carnet-ranking-card__footer-row">
          <strong>{formatNumber(entry.sales)} ventas</strong>
          <button type="button" className="carnet-ranking-card__details-toggle" onClick={() => setShowDetails((current) => !current)}>
            {showDetails ? "Ocultar detalle" : "Detalle"}
          </button>
        </div>

        {showDetails ? (
          <div className="carnet-ranking-card__buyers">
            {entry.buyers.length ? (
              <ul className="carnet-ranking-card__buyer-list">
                {entry.buyers.map((buyer) => (
                  <li key={buyer.id}>
                    <span>
                      {buyer.quantity} para {buyer.buyerName}
                    </span>
                    <button
                      type="button"
                      className="carnet-ranking-card__buyer-remove"
                      onClick={() => void onRemoveBuyer(buyer.id)}
                      aria-label={`Quitar ${buyer.buyerName}`}
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="carnet-ranking-card__buyer-empty">Todavia no detallaste a quien se le vendio.</p>
            )}

            {entry.unassignedSales > 0 ? (
              <p className="carnet-ranking-card__buyer-remaining">Faltan detallar {formatNumber(entry.unassignedSales)}.</p>
            ) : null}

            <div className="carnet-ranking-card__buyer-form">
              <input
                type="text"
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                placeholder="Nombre"
                disabled={saving || entry.unassignedSales <= 0}
              />
              <input
                type="number"
                min="1"
                value={buyerQuantity}
                onChange={(event) => setBuyerQuantity(event.target.value)}
                disabled={saving || entry.unassignedSales <= 0}
              />
              <button type="button" onClick={handleAddBuyer} disabled={saving || entry.unassignedSales <= 0}>
                Agregar
              </button>
            </div>

            {buyerError ? <p className="carnet-ranking-card__buyer-error">{buyerError}</p> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
