import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Patient, PatientFormState, HBReading, FieldStatus } from '../types';

const STORAGE_KEY = 'patients_v1';

const emptyForm = (hospital: string): PatientFormState => ({
  hospital,
  collectionDate: new Date().toLocaleDateString('en-GB'),
  patientId: { status: 'idle', value: '' },
  age: { status: 'idle', value: '' },
  lmp: { status: 'idle', value: '' },
  hbReadings: [],
});

interface PatientStore {
  patients: Patient[];
  form: PatientFormState;

  loadPatients: () => Promise<void>;
  savePatients: (patients: Patient[]) => Promise<void>;
  deletePatient: (uid: string) => void;

  initForm: (hospital: string) => void;
  setFieldCaptured: (field: 'patientId' | 'age' | 'lmp', value: string) => void;
  setFieldStatus: (field: 'patientId' | 'age' | 'lmp', status: FieldStatus) => void;
  addHBCaptured: (hbValue: string, date: string, time: string) => void;
  setHBStatus: (id: string, status: FieldStatus) => void;
  removeHBReading: (id: string) => void;

  submitForm: () => Patient | null;
}

let idCounter = 0;
const uid = () => `${Date.now()}_${idCounter++}`;

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  form: emptyForm(''),

  loadPatients: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ patients: JSON.parse(raw) });
    } catch {}
  },

  savePatients: async (patients) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    } catch {}
  },

  deletePatient: (uidToDelete) => {
    const next = get().patients.filter(p => p.uid !== uidToDelete);
    set({ patients: next });
    get().savePatients(next);
  },

  initForm: (hospital) => set({ form: emptyForm(hospital) }),

  setFieldCaptured: (field, value) =>
    set(s => ({
      form: {
        ...s.form,
        [field]: { status: 'captured', value },
      },
    })),

  setFieldStatus: (field, status) =>
    set(s => {
      const current = s.form[field];
      if (status === 'idle') return { form: { ...s.form, [field]: { status: 'idle', value: '' } } };
      return { form: { ...s.form, [field]: { ...current, status } } };
    }),

  addHBCaptured: (hbValue, date, time) =>
    set(s => {
      const exists = s.form.hbReadings.some(
        r => r.hbValue === hbValue && r.date === date,
      );
      if (exists) return s;
      const newReading: HBReading = { id: uid(), hbValue, date, time, status: 'captured' };
      return { form: { ...s.form, hbReadings: [...s.form.hbReadings, newReading] } };
    }),

  setHBStatus: (id, status) =>
    set(s => ({
      form: {
        ...s.form,
        hbReadings: s.form.hbReadings.map(r =>
          r.id === id ? { ...r, status } : r,
        ),
      },
    })),

  removeHBReading: (id) =>
    set(s => ({
      form: {
        ...s.form,
        hbReadings: s.form.hbReadings.filter(r => r.id !== id),
      },
    })),

  submitForm: () => {
    const { form, patients } = get();
    const confirmed = form.hbReadings.filter(r => r.status === 'confirmed');
    const sorted = [...confirmed].sort((a, b) => {
      // sort by date ascending
      const da = parseDateStr(a.date);
      const db = parseDateStr(b.date);
      return da - db;
    });
    const patient: Patient = {
      uid: uid(),
      hospital: form.hospital,
      patientId: form.patientId.value,
      age: form.age.value,
      lmp: form.lmp.value,
      hbReadings: sorted.map(r => ({ hbValue: r.hbValue, date: r.date, time: r.time })),
      collectionDate: form.collectionDate,
      createdAt: new Date().toISOString(),
    };
    const next = [...patients, patient];
    set({ patients: next });
    get().savePatients(next);
    return patient;
  },
}));

function parseDateStr(d: string): number {
  if (!d) return 0;
  const parts = d.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 1000) return new Date(c, b - 1, a).getTime(); // DD/MM/YYYY
    if (a > 1000) return new Date(a, b - 1, c).getTime(); // YYYY/MM/DD
  }
  return 0;
}
