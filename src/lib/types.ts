// Database entity types

export interface Expense {
  id: number;
  type: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Refill {
  id: number;
  amountSpent: number;
  distanceTraveled: number;
  liters?: number;
  date: string;
  notes?: string;
  efficiency?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: number;
  distance: number;
  date: string;
  purpose?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  authenticated: boolean;
  createdAt: string;
  expiresAt: string;
}
