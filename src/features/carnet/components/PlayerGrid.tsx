import { PlayerCard } from "./PlayerCard";
import type { CarnetPlayer } from "../carnet.types";

type PlayerGridProps = {
  players: CarnetPlayer[];
  onEdit: (player: CarnetPlayer) => void;
};

export function PlayerGrid({ players, onEdit }: PlayerGridProps) {
  return (
    <section className="carnet-grid">
      {players.length ? (
        players.map((player) => <PlayerCard key={player.id} player={player} onEdit={onEdit} />)
      ) : (
        <article className="carnet-empty-state">
          <h2>No hay jugadores cargados</h2>
          <p>Usa el formulario de arriba para crear el primer registro y guardarlo en la base de datos.</p>
        </article>
      )}
    </section>
  );
}
