export type AlertState = "normal" | "warning" | "critical";

export function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("es-UY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY").format(value);
}

export function getDaysUntil(dateString: string | null) {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  target.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) return null;

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAlertState(daysLeft: number): AlertState {
  if (daysLeft <= 21) return "critical";
  if (daysLeft <= 30) return "warning";
  return "normal";
}

export function sexLabel(sex: "masculino" | "femenino") {
  return sex === "femenino" ? "Femenino" : "Masculino";
}
