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
