import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ColumnType = 'categorical' | 'numerical' | 'temporal' | 'unknown';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  uniqueValues?: (string | number)[];
  min?: number;
  max?: number;
  sampleValues: (string | number | Date | null)[];
}

export interface ParsedData {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  fileName: string;
  rowCount: number;
}

// Detect if a string is a date
function isDateString(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
    /^[A-Za-z]+ \d{1,2}, \d{4}$/,
    /^\d{1,2} [A-Za-z]+ \d{4}$/,
  ];
  
  if (datePatterns.some(pattern => pattern.test(value))) {
    return !isNaN(Date.parse(value));
  }
  
  // Check for month-year patterns
  const monthYearPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s-]?\d{2,4}$/i;
  if (monthYearPattern.test(value)) return true;
  
  return false;
}

// Detect column type from values
function detectColumnType(values: unknown[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'unknown';
  
  const sampleSize = Math.min(100, nonNullValues.length);
  const sample = nonNullValues.slice(0, sampleSize);
  
  // Check for dates
  let dateCount = 0;
  let numberCount = 0;
  
  for (const value of sample) {
    if (value instanceof Date) {
      dateCount++;
    } else if (typeof value === 'string' && isDateString(value)) {
      dateCount++;
    } else if (typeof value === 'number' && !isNaN(value)) {
      numberCount++;
    } else if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[,$]/g, ''));
      if (!isNaN(num)) {
        numberCount++;
      }
    }
  }
  
  const threshold = 0.7;
  
  if (dateCount / sample.length >= threshold) return 'temporal';
  if (numberCount / sample.length >= threshold) return 'numerical';
  
  return 'categorical';
}

// Get unique values for categorical columns
function getUniqueValues(values: unknown[], limit: number = 50): (string | number)[] {
  const unique = new Set<string | number>();
  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') {
      unique.add(String(v));
      if (unique.size >= limit) break;
    }
  }
  return Array.from(unique);
}

// Get min/max for numerical columns
function getMinMax(values: unknown[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  
  for (const v of values) {
    let num: number;
    if (typeof v === 'number') {
      num = v;
    } else if (typeof v === 'string') {
      num = parseFloat(v.replace(/[,$]/g, ''));
    } else {
      continue;
    }
    
    if (!isNaN(num)) {
      min = Math.min(min, num);
      max = Math.max(max, num);
    }
  }
  
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
}

// Parse Excel file
async function parseExcel(file: File): Promise<{ rows: Record<string, unknown>[]; columns: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
  
  const columns = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
  
  return { rows: jsonData as Record<string, unknown>[], columns };
}

// Parse CSV file
async function parseCSV(file: File): Promise<{ rows: Record<string, unknown>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields || [];
        resolve({ rows: results.data as Record<string, unknown>[], columns });
      },
      error: (error) => reject(error),
    });
  });
}

// Main parse function
export async function parseDataFile(file: File): Promise<ParsedData> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  let rawData: { rows: Record<string, unknown>[]; columns: string[] };
  
  if (extension === 'csv') {
    rawData = await parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    rawData = await parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel files.');
  }
  
  // Build column schema
  const columns: ColumnSchema[] = rawData.columns.map(colName => {
    const values = rawData.rows.map(row => row[colName]);
    const type = detectColumnType(values);
    
    const schema: ColumnSchema = {
      name: colName,
      type,
      sampleValues: values.slice(0, 5) as (string | number | Date | null)[],
    };
    
    if (type === 'categorical') {
      schema.uniqueValues = getUniqueValues(values);
    } else if (type === 'numerical') {
      const { min, max } = getMinMax(values);
      schema.min = min;
      schema.max = max;
    }
    
    return schema;
  });
  
  return {
    columns,
    rows: rawData.rows,
    fileName,
    rowCount: rawData.rows.length,
  };
}

// Get numerical value from cell
export function getNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[,$]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Format value for display
export function formatValue(value: unknown, type: ColumnType): string {
  if (value === null || value === undefined) return '-';
  
  if (type === 'numerical' && typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  
  if (type === 'temporal' && value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  return String(value);
}
