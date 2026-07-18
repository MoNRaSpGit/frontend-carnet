import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

type UsuarioSaleCardProps = {
  entry: CarnetEventRankingItem;
  onToggleDelivered: (buyerId: number, delivered: boolean) => void;
};

export function UsuarioSaleCard({ entry, onToggleDelivered }: UsuarioSaleCardProps) {
  return (
    <article className="carnet-usuario-card">
      <div className="carnet-usuario-card__header">
        <h3>{entry.playerName}</h3>
        <strong>{formatNumber(entry.sales)} ventas</strong>
      </div>

      {entry.buyers.length ? (
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
                  {buyer.quantity} para {buyer.buyerName}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="carnet-usuario-card__empty">Todavia no hay detalle de ventas cargado.</p>
      )}
    </article>
  );
}
