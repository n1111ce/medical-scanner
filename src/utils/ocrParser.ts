import { OCRMatch } from '../types';

// Date: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
const DATE_RE = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g;

// Time: HH:MM or HH:MM:SS with optional AM/PM
const TIME_RE = /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\b/g;

// HB/Hemoglobin: decimal 4.0–18.0, optionally followed by g/dL
const HB_RE = /\b((?:1[0-8]|[4-9])\.\d+|(?:1[0-8]|[4-9])(?:\.\d+)?)\s*(?:g\/dl|g\/dL|gm\/dl|gm\/dL)?\b/g;

// Age: integer 10–60 (obstetric context), NOT preceded by colon (to avoid times)
const AGE_RE = /(?<![:\d])(?<!\d)([1-5][0-9]|[1-9])(?!\d)(?!\s*[\/\-\.:]\d)/g;

// Patient ID: alphanumeric 4-12 chars, often has prefix letters
const ID_RE = /\b([A-Za-z]{1,4}[-\/\s]?\d{3,8}|\d{5,10})\b/g;

export interface ParsedOCR {
  ids: string[];
  ages: string[];
  lmps: string[];
  hbReadings: OCRMatch[];
  allDates: string[];
  allTimes: string[];
  rawText: string;
}

interface TextBlock {
  text: string;
  frame?: { x: number; y: number; width: number; height: number };
}

export function parseOCRBlocks(blocks: TextBlock[]): ParsedOCR {
  const fullText = blocks.map(b => b.text).join('\n');
  return parseOCRText(fullText);
}

export function parseOCRText(rawText: string): ParsedOCR {
  const lines = rawText.split(/\n+/);

  const allDates: string[] = [];
  const allTimes: string[] = [];

  lines.forEach(line => {
    const dateMatcher = line.matchAll(DATE_RE);
    for (const m of dateMatcher) allDates.push(m[1]);
    const timeMatcher = line.matchAll(TIME_RE);
    for (const m of timeMatcher) allTimes.push(m[1]);
  });

  // IDs: look across full text
  const ids: string[] = [];
  const idMatcher = rawText.matchAll(ID_RE);
  for (const m of idMatcher) {
    const val = m[1].trim();
    if (!ids.includes(val)) ids.push(val);
  }

  // Ages: only when no date/time context on same line
  const ages: string[] = [];
  lines.forEach(line => {
    if (DATE_RE.test(line) || TIME_RE.test(line)) return;
    DATE_RE.lastIndex = 0;
    TIME_RE.lastIndex = 0;
    AGE_RE.lastIndex = 0;
    const ageMatcher = line.matchAll(AGE_RE);
    for (const m of ageMatcher) {
      const val = m[1];
      if (!ages.includes(val)) ages.push(val);
    }
  });

  // LMP = any date that appears on a line containing "LMP", "lmp", "last", "period", or first date found
  const lmps: string[] = [];
  lines.forEach(line => {
    if (/lmp|last\s*mens|period/i.test(line)) {
      DATE_RE.lastIndex = 0;
      const m = line.matchAll(DATE_RE);
      for (const d of m) if (!lmps.includes(d[1])) lmps.push(d[1]);
    }
  });
  // fallback: all dates are LMP candidates when user activates LMP button
  if (lmps.length === 0) lmps.push(...allDates);

  // HB readings: find each HB value and associate closest date/time on same line or adjacent line
  const hbReadings: OCRMatch[] = [];
  lines.forEach((line, lineIdx) => {
    HB_RE.lastIndex = 0;
    const hbMatcher = line.matchAll(HB_RE);
    for (const m of hbMatcher) {
      const hbVal = m[1];
      // look for date/time on same line first, then ±2 lines
      let date = '';
      let time = '';
      const searchLines = [
        line,
        lines[lineIdx - 1] ?? '',
        lines[lineIdx + 1] ?? '',
        lines[lineIdx - 2] ?? '',
        lines[lineIdx + 2] ?? '',
      ];
      for (const sl of searchLines) {
        if (!date) {
          DATE_RE.lastIndex = 0;
          const dm = DATE_RE.exec(sl);
          if (dm) date = dm[1];
        }
        if (!time) {
          TIME_RE.lastIndex = 0;
          const tm = TIME_RE.exec(sl);
          if (tm) time = tm[1];
        }
        if (date && time) break;
      }
      hbReadings.push({ value: hbVal, date, time });
    }
  });

  return { ids, ages, lmps, hbReadings, allDates, allTimes, rawText };
}

export function dedupHBReadings(existing: OCRMatch[], incoming: OCRMatch[]): OCRMatch[] {
  const result = [...existing];
  for (const item of incoming) {
    const alreadyExists = result.some(r => r.value === item.value && r.date === item.date);
    if (!alreadyExists) result.push(item);
  }
  return result;
}
