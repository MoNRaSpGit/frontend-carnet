import { formatDate, formatNumber, getAlertState, getDaysUntil, sexLabel } from "../utils/carnet.format";
import type { CarnetPlayer } from "../carnet.types";

type PlayerCardProps = {
  player: CarnetPlayer;
  onEdit: (player: CarnetPlayer) => void;
};

export function PlayerCard({ player, onEdit }: PlayerCardProps) {
  const daysLeft = getDaysUntil(player.expiryDate) ?? 0;
  const alertState = getAlertState(daysLeft);

  return (
    <article
      className={`carnet-player-card is-${alertState}`}
      onDoubleClick={() => onEdit(player)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onEdit(player);
        }
      }}
    >
      <div className="carnet-player-card__top">
        <div>
          <p className="carnet-player-card__name">{player.name}</p>
          <p className="carnet-player-card__date">
            {sexLabel(player.sex)} · Vence {formatDate(player.expiryDate)}
          </p>
        </div>
        <span className={`carnet-badge is-${alertState}`}>
          {alertState === "normal" ? "OK" : alertState === "warning" ? "Alerta" : "Crítico"}
        </span>
      </div>

      <div className="carnet-player-card__footer">
        <strong>{daysLeft > 0 ? `Faltan ${daysLeft} dias` : daysLeft === 0 ? "Vence hoy" : "Vencido"}</strong>
        <small>{player.sales !== null ? `Ventas ${formatNumber(player.sales)}` : "Sin ventas cargadas."}</small>
      </div>
    </article>
  );
}
