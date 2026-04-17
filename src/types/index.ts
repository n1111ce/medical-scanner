export type FieldStatus = 'idle' | 'captured' | 'confirmed';

export interface FieldState {
  status: FieldStatus;
  value: string;
}

export interface HBReading {
  id: string;
  hbValue: string;
  date: string;
  time: string;
  status: FieldStatus;
}

export interface PatientFormState {
  hospital: string;
  patientId: FieldState;
  age: FieldState;
  lmp: FieldState;
  hbReadings: HBReading[];
  collectionDate: string;
}

export interface SavedHBReading {
  hbValue: string;
  date: string;
  time: string;
}

export interface Patient {
  uid: string;
  hospital: string;
  patientId: string;
  age: string;
  lmp: string;
  hbReadings: SavedHBReading[];
  collectionDate: string;
  createdAt: string;
}

export interface OCRMatch {
  value: string;
  date?: string;
  time?: string;
  x?: number;
  y?: number;
}
