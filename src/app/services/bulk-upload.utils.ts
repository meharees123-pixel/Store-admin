import { read, utils, write } from 'xlsx';

export type BulkTemplate = {
  headers: (string | number)[];
  row: (string | number)[];
};

export function normalizeBulkCode(value: any): string {
  if (value === undefined || value === null) return '';
  return String(value).trim().toUpperCase();
}

export function getRowValue(row: any, keys: string[]): string {
  for (const key of keys) {
    if (row?.hasOwnProperty(key)) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
  }
  return '';
}

export function parseBulkBoolean(row: any, keys: string[], fallback = true): boolean {
  const value = getRowValue(row, keys);
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return true;
}

export function parseBulkNumber(row: any, keys: string[]): number | null {
  const value = getRowValue(row, keys);
  if (!value) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

export function readExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) {
        reject(new Error('Empty file.'));
        return;
      }
      const workbook = read(data as ArrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        reject(new Error('No sheet found.'));
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = utils.sheet_to_json(worksheet, { defval: '' });
      resolve(Array.isArray(rows) ? rows : []);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function buildTemplateWorkbook(template: BulkTemplate): ArrayBuffer {
  const data: (string | number)[][] = [template.headers, template.row];
  const worksheet = utils.aoa_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Template');
  return write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function triggerDownload(filename: string, data: ArrayBuffer): void {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
