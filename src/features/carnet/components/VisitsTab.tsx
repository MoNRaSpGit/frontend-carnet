import { useEffect, useState } from "react";
import { listCarnetVisits } from "../carnet.api";
import type { CarnetVisitSummary } from "../carnet.types";
import { getVisitorId } from "../../../shared/utils/visitorId";
import { formatNumber } from "../utils/carnet.format";

function formatDateTime(isoString: string) {
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(isoString));
}

// Etiqueta corta a partir del user-agent, solo para distinguir de un
// vistazo (no es deteccion precisa de dispositivo/navegador).
function summarizeUserAgent(userAgent: string | null) {
  if (!userAgent) return "Desconocido";
  if (/iphone|ipad/i.test(userAgent)) return "iPhone/iPad";
  if (/android/i.test(userAgent)) return "Android";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "Mac";
  return "Otro";
}

export function VisitsTab() {
  const [visits, setVisits] = useState<CarnetVisitSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const myVisitorId = getVisitorId();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    listCarnetVisits()
      .then((result) => {
        if (!cancelled) setVisits(result.items);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las visitas.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const others = visits.filter((visit) => visit.visitorId !== myVisitorId);

  return (
    <section className="carnet-card" aria-label="Visitas">
      <div className="carnet-card__header">
        <div>
          <p className="carnet-card__eyebrow">Visitas</p>
          <h2>Quien entro a la app</h2>
        </div>
      </div>

      {isLoading ? (
        <p className="carnet-empty-state">Cargando...</p>
      ) : loadError ? (
        <p className="carnet-empty-state">{loadError}</p>
      ) : (
        <>
          <p className="carnet-visits-summary">
            {others.length === 0
              ? "Todavia no entro nadie mas que vos."
              : `${formatNumber(others.length)} ${others.length === 1 ? "persona distinta a vos entro" : "personas distintas a vos entraron"}.`}
          </p>

          <ul className="carnet-visits-list">
            {visits.map((visit) => {
              const isMe = visit.visitorId === myVisitorId;
              return (
                <li key={visit.visitorId} className={`carnet-visits-row ${isMe ? "is-me" : ""}`}>
                  <div className="carnet-visits-row__main">
                    <strong>{isMe ? "Vos" : visit.ip || "IP desconocida"}</strong>
                    <span className="carnet-visits-row__tag">{summarizeUserAgent(visit.userAgent)}</span>
                    {visit.role === "admin" ? <span className="carnet-visits-row__tag">Admin</span> : null}
                  </div>
                  <div className="carnet-visits-row__meta">
                    <span>{formatNumber(visit.visitCount)} {visit.visitCount === 1 ? "entrada" : "entradas"}</span>
                    <span>Ultima: {formatDateTime(visit.lastSeen)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
