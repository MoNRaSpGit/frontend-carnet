import { EventPicker } from "../features/carnet/components/events/EventPicker";
import { UsuarioSaleCard } from "../features/carnet/components/usuario/UsuarioSaleCard";
import { useCarnetEvents } from "../features/carnet/hooks/useCarnetEvents";
import { formatNumber } from "../features/carnet/utils/carnet.format";

type UsuarioAppProps = {
  onLogout: () => void;
};

export function UsuarioApp({ onLogout }: UsuarioAppProps) {
  const carnetEvents = useCarnetEvents();
  const ranking = (carnetEvents.activeEventDetail?.ranking ?? []).filter((entry) => entry.sales > 0);

  const totalPortions = ranking.reduce((sum, entry) => sum + entry.sales, 0);
  const totalDelivered = ranking.reduce(
    (sum, entry) => sum + entry.buyers.reduce((buyerSum, buyer) => buyerSum + (buyer.delivered ? buyer.quantity : 0), 0),
    0
  );

  return (
    <main className="carnet-shell">
      <div className="carnet-session-bar">
        <button type="button" className="carnet-session-bar__logout" onClick={onLogout}>
          Cerrar sesion
        </button>
      </div>

      <section className="carnet-layout">
        <header className="carnet-usuario-header">
          <p className="carnet-kicker">Ventas</p>
          <h2>Entrega de porciones</h2>
          <p className="carnet-note">Marca la casilla apenas entregues las porciones a cada persona.</p>
        </header>

        {ranking.length ? (
          <div className="carnet-usuario-totals">
            <div>
              <span>Porciones totales</span>
              <strong>{formatNumber(totalPortions)}</strong>
            </div>
            <div>
              <span>Entregadas</span>
              <strong>
                {formatNumber(totalDelivered)}/{formatNumber(totalPortions)}
              </strong>
            </div>
          </div>
        ) : null}

        <EventPicker events={carnetEvents.events} activeEventId={carnetEvents.activeEventId} onSelectEvent={carnetEvents.setActiveEventId} />

        {carnetEvents.loadingEvent ? <p className="carnet-empty-inline">Cargando ventas...</p> : null}

        {!carnetEvents.loadingEvent && !ranking.length ? (
          <article className="carnet-empty-state">
            <h2>No hay ventas todavia</h2>
            <p>Cuando haya jugadores con ventas cargadas van a aparecer aca.</p>
          </article>
        ) : null}

        <div className="carnet-usuario-grid">
          {ranking.map((entry) => (
            <UsuarioSaleCard
              key={entry.id}
              entry={entry}
              onToggleDelivered={(buyerId, delivered) => {
                if (!carnetEvents.activeEventId) return;
                void carnetEvents.setBuyerDelivered(carnetEvents.activeEventId, entry.playerId, buyerId, delivered);
              }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
