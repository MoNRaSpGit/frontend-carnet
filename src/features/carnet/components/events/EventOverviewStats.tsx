import { formatNumber } from "../../utils/carnet.format";
import type { CarnetEvent } from "../../carnet.event.types";

type EventOverviewStatsProps = {
  event: CarnetEvent | null;
  daysLeft: number | null;
};

const TARGET_SALES = 150;

export function EventOverviewStats({ event, daysLeft }: EventOverviewStatsProps) {
  const totalSales = event?.totalSales ?? 0;
  const remainingSales = Math.max(TARGET_SALES - totalSales, 0);

  return (
    <section className="carnet-event__overview">
      <div className="carnet-event__section-head">
        <p className="carnet-card__eyebrow">Datos del evento</p>
        <h3>{event?.name ?? "Sin evento"}</h3>
      </div>

      <div className="carnet-event__event-meta carnet-event__event-meta--compact">
        <article>
          <span>Tiempo</span>
          <strong>
            {daysLeft === null ? "Sin fecha" : daysLeft > 0 ? `Falta ${daysLeft} dias` : daysLeft === 0 ? "Finaliza hoy" : "Finalizado"}
          </strong>
        </article>
        <article>
          <span>Meta</span>
          <strong>{formatNumber(TARGET_SALES)}</strong>
        </article>
        <article>
          <span>Vendido</span>
          <strong>{formatNumber(totalSales)}</strong>
        </article>
        <article>
          <span>Faltan</span>
          <strong>{formatNumber(remainingSales)}</strong>
        </article>
      </div>
    </section>
  );
}
