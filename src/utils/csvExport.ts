import { Patient } from '../types';

function esc(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function generateCSV(patients: Patient[]): string {
  if (patients.length === 0) return '';

  const maxHB = Math.max(...patients.map(p => p.hbReadings.length), 0);

  const hbHeaders: string[] = [];
  for (let i = 1; i <= maxHB; i++) {
    hbHeaders.push(`hb_${i}_value`, `hb_${i}_date`, `hb_${i}_time`);
  }

  const headers = [
    'patient_id', 'age', 'lmp', 'hospital', 'collection_date', 'created_at',
    ...hbHeaders,
  ];

  const rows = patients.map(p => {
    const hbCols: string[] = [];
    for (let i = 0; i < maxHB; i++) {
      const reading = p.hbReadings[i];
      hbCols.push(
        esc(reading?.hbValue ?? ''),
        esc(reading?.date ?? ''),
        esc(reading?.time ?? ''),
      );
    }
    return [
      esc(p.patientId),
      esc(p.age),
      esc(p.lmp),
      esc(p.hospital),
      esc(p.collectionDate),
      esc(p.createdAt),
      ...hbCols,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
