import { useState } from "react";
import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

type UsuarioSaleCardProps = {
  entry: CarnetEventRankingItem;
  onToggleDelivered: (buyerId: number, delivered: boolean) => void;
};

export function UsuarioSaleCard({ entry, onToggleDelivered }: UsuarioSaleCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const deliveredCount = entry.buyers.reduce((sum, buyer) => sum + (buyer.delivered ? buyer.quantity : 0), 0);

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
    </article>
  );
}
