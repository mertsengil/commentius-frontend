// src/types/card.ts
import { Business } from './business';

export interface Card {
  id: number;
  name: string;
  redirectUrl: string;
  qrCode: string | null;
  createdAt: string;
  type?: string;
  updatedAt: string;
  deletedAt: string | null;
  isActive: boolean;
  businessId: number;
  business: Business;
  address?: string;
  phone?: string;
}
