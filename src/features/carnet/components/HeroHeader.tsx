import type { SourceState } from "../hooks/usePlayers";

type PlayerStats = {
  total: number;
  male: number;
  female: number;
  critical: number;
};

type HeroHeaderProps = {
  showStats: boolean;
  sourceState: SourceState;
  stats: PlayerStats;
};

export function HeroHeader({ showStats, sourceState, stats }: HeroHeaderProps) {
  return (
    <header className="carnet-hero">
      <div className="carnet-hero__top">
        <div>
          <p className="carnet-kicker">Registro de carnet</p>
          <h1>Equipo de Peñarol</h1>
          <p className="carnet-note">Gestion simple de jugadores, eventos y ranking de ventas, todo guardado en la base de datos.</p>
        </div>

        {showStats ? (
          <div className="carnet-hero__meta">
            <span className="carnet-source">
              {sourceState === "online" ? "Conectado" : sourceState === "offline" ? "Sin conexion" : "Cargando"}
            </span>
            <div className="carnet-stats" aria-label="Resumen">
              <article className="carnet-stat" aria-label={`Jugadores: ${stats.total}`}>
                <span>Jugadores</span>
                <strong>{stats.total}</strong>
              </article>
              <article className="carnet-stat" aria-label={`Masculino: ${stats.male}`}>
                <span>Masculino</span>
                <strong>{stats.male}</strong>
              </article>
              <article className="carnet-stat" aria-label={`Femenino: ${stats.female}`}>
                <span>Femenino</span>
                <strong>{stats.female}</strong>
              </article>
              <article className="carnet-stat" aria-label={`Crítico: ${stats.critical}`}>
                <span>Crítico</span>
                <strong>{stats.critical}</strong>
              </article>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
