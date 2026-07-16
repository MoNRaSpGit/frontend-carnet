import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEventRankingItem } from "../../carnet.event.types";

type RankingCardProps = {
  entry: CarnetEventRankingItem;
  onEdit: () => void;
  onAddSale: () => void;
  onSubtractSale: () => void;
};

export function RankingCard({ entry, onEdit, onAddSale, onSubtractSale }: RankingCardProps) {
  return (
    <article className={`carnet-ranking-card ${entry.position === 1 ? "is-leader" : ""}`} onDoubleClick={onEdit}>
      <div className="carnet-ranking-card__main">
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
        <strong>{formatNumber(entry.sales)} ventas</strong>
      </div>
    </article>
  );
}
