import { Timestamp } from 'firebase/firestore';

export type UserRole = 'courier' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  city: string;
  role: UserRole;
}

export type ShipmentStatus = 'pending' | 'with_courier' | 'delivered';

export interface Shipment {
  resi: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  weight: number;
  courierUid: string;
  lastUpdate: Timestamp;
}

export type Relationship = 'ybs' | 'rekan_kerja' | 'mailing_room' | 'satpam' | 'lainnya';

export interface POD {
  resi: string;
  recipientName: string;
  relationship: Relationship;
  photoUrl?: string;
  signatureUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Timestamp;
  courierUid: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
