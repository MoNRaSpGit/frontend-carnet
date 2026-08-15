export type CarnetSex = "masculino" | "femenino";

export type CarnetPlayer = {
  id: number;
  name: string;
  expiryDate: string;
  sex: CarnetSex;
  cedula: string | null;
  birthDate: string | null;
  sales: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CarnetPlayerPayload = {
  name: string;
  expiryDate: string;
  sex: CarnetSex;
  cedula: string;
  birthDate: string;
  sales?: number | null;
};

// Resumen de un visitante anonimo (identificado solo por el visitorId
// generado en su navegador, sin login) para poder ver "cuanta gente
// distinta entro" a la app.
export type CarnetVisitSummary = {
  visitorId: string;
  ip: string | null;
  userAgent: string | null;
  role: string | null;
  visitCount: number;
  firstSeen: string;
  lastSeen: string;
};
