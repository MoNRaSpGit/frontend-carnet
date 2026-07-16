import type { SourceState } from "../hooks/usePlayers";

type PlayerStats = {
  total: number;
  maleNextDays: number | null;
  femaleNextDays: number | null;
  critical: number;
};

function formatNextDays(days: number | null) {
  if (days === null) return "—";
  if (days === 0) return "Vence hoy";
  return `${days} dias`;
}

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
              <article className="carnet-stat" aria-label={`Masculino, proximo vencimiento: ${formatNextDays(stats.maleNextDays)}`}>
                <span>Masculino</span>
                <strong>{formatNextDays(stats.maleNextDays)}</strong>
              </article>
              <article className="carnet-stat" aria-label={`Femenino, proximo vencimiento: ${formatNextDays(stats.femaleNextDays)}`}>
                <span>Femenino</span>
                <strong>{formatNextDays(stats.femaleNextDays)}</strong>
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
