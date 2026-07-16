import type { CarnetEvent } from "../../carnet.event.types";

type EventPickerProps = {
  events: CarnetEvent[];
  activeEventId: number | null;
  onSelectEvent: (eventId: number) => void;
};

export function EventPicker({ events, activeEventId, onSelectEvent }: EventPickerProps) {
  return (
    <section className="carnet-event__overview">
      <div className="carnet-event__section-head">
        <p className="carnet-card__eyebrow">Eventos</p>
        <h3>Elegir evento</h3>
      </div>

      <div className="carnet-event-list">
        {events.length ? (
          events.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`carnet-event-chip ${item.id === activeEventId ? "is-active" : ""}`}
              onClick={() => onSelectEvent(item.id)}
            >
              <strong>{item.name}</strong>
              <span>{item.endDate ? item.endDate : "Sin fecha"}</span>
            </button>
          ))
        ) : (
          <p className="carnet-empty-inline">Todavia no hay eventos cargados.</p>
        )}
      </div>
    </section>
  );
}
