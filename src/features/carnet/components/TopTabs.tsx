import type { TabMode } from "../carnet.ui.types";

type TopTabsProps = {
  activeTab: TabMode;
  onChange: (tab: TabMode) => void;
};

const TABS: Array<{ id: TabMode; label: string }> = [
  { id: "players", label: "Jugadores" },
  { id: "male", label: "Masculino" },
  { id: "female", label: "Femenino" },
  { id: "events", label: "Evento" }
];

export function TopTabs({ activeTab, onChange }: TopTabsProps) {
  return (
    <header className="carnet-topbar">
      <nav className="carnet-tabs carnet-tabs--header" role="tablist" aria-label="Secciones">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`carnet-tab ${activeTab === tab.id ? "is-active" : ""}`}
            aria-pressed={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
