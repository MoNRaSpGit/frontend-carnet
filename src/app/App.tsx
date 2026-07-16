import { useMemo, useState } from "react";
import { CarnetEventTab } from "../features/carnet/components/CarnetEventTab";
import { EditPlayerModal } from "../features/carnet/components/EditPlayerModal";
import { HeroHeader } from "../features/carnet/components/HeroHeader";
import { PlayerFormCard } from "../features/carnet/components/PlayerFormCard";
import { PlayerGrid } from "../features/carnet/components/PlayerGrid";
import { TopTabs } from "../features/carnet/components/TopTabs";
import { useCarnetEvents } from "../features/carnet/hooks/useCarnetEvents";
import { usePlayers } from "../features/carnet/hooks/usePlayers";
import { getAlertState, getDaysUntil, getNextExpiringDays } from "../features/carnet/utils/carnet.format";
import type { TabMode } from "../features/carnet/carnet.ui.types";
import type { CarnetPlayer } from "../features/carnet/carnet.types";

export function App() {
  const [activeTab, setActiveTab] = useState<TabMode>("players");
  const [editingPlayer, setEditingPlayer] = useState<CarnetPlayer | null>(null);

  const carnetEvents = useCarnetEvents();
  const carnetPlayers = usePlayers({ onPlayerChanged: carnetEvents.syncPlayer });

  const stats = useMemo(() => {
    const critical = carnetPlayers.players.filter(
      (player) => getAlertState(getDaysUntil(player.expiryDate) ?? 0) === "critical"
    ).length;
    const maleNextDays = getNextExpiringDays(carnetPlayers.players, "masculino");
    const femaleNextDays = getNextExpiringDays(carnetPlayers.players, "femenino");

    return { total: carnetPlayers.players.length, maleNextDays, femaleNextDays, critical };
  }, [carnetPlayers.players]);

  const malePlayers = carnetPlayers.players.filter((player) => player.sex === "masculino");
  const femalePlayers = carnetPlayers.players.filter((player) => player.sex === "femenino");

  const tabContent =
    activeTab === "players" ? (
      <PlayerFormCard onCreate={carnetPlayers.createPlayer} listError={carnetPlayers.listError} />
    ) : activeTab === "male" ? (
      <section className="carnet-card" aria-label="Jugadores masculinos">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Masculino</p>
            <h2>Jugadores</h2>
          </div>
        </div>
        <PlayerGrid players={malePlayers} onEdit={setEditingPlayer} />
      </section>
    ) : activeTab === "female" ? (
      <section className="carnet-card" aria-label="Jugadoras femeninas">
        <div className="carnet-card__header">
          <div>
            <p className="carnet-card__eyebrow">Femenino</p>
            <h2>Jugadoras</h2>
          </div>
        </div>
        <PlayerGrid players={femalePlayers} onEdit={setEditingPlayer} />
      </section>
    ) : (
      <CarnetEventTab
        players={carnetPlayers.players}
        events={carnetEvents.events}
        activeEventId={carnetEvents.activeEventId}
        activeEventDetail={carnetEvents.activeEventDetail}
        loadingEvent={carnetEvents.loadingEvent}
        eventError={carnetEvents.eventError}
        onSelectEvent={carnetEvents.setActiveEventId}
        onAttachPlayer={carnetEvents.attachPlayer}
        onUpdatePlayerSales={carnetEvents.updatePlayerSales}
      />
    );

  return (
    <main className="carnet-shell">
      <TopTabs activeTab={activeTab} onChange={setActiveTab} />

      <section className="carnet-layout">
        <HeroHeader showStats={activeTab === "players"} sourceState={carnetPlayers.sourceState} stats={stats} />
        {tabContent}
      </section>

      {editingPlayer ? (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSave={(payload) => carnetPlayers.updatePlayer(editingPlayer.id, payload)}
          onDelete={() => carnetPlayers.removePlayer(editingPlayer)}
        />
      ) : null}
    </main>
  );
}
