export type CarnetPlayer = {
  id: number;
  name: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
};

export type CarnetPlayerPayload = {
  name: string;
  expiryDate: string;
};
