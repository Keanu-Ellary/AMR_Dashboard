export type ExportFormat = 'csv' | 'tsv' | 'json';

interface ExportData {
  [key: string]: string | number | boolean | null | undefined;
}


export function convertToCSV(data: ExportData[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(item =>
    headers
      .map(header => {
        const value = item[header];
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      })
      .join(',')
  );

  return [headerRow, ...rows].join('\n');
}


export function convertToTSV(data: ExportData[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join('\t');

  const rows = data.map(item =>
    headers
      .map(header => item[header] ?? '')
      .join('\t')
  );

  return [headerRow, ...rows].join('\n');
}


export function convertToJSON(data: ExportData[]): string {
  return JSON.stringify(data, null, 2);
}


export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}


export function exportStatistics(
  data: ExportData[],
  format: ExportFormat,
  filename: string
) {
  let content = '';
  let mimeType = 'text/plain';
  let extension = format;

  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv';
      break;
    case 'tsv':
      content = convertToTSV(data);
      mimeType = 'text/tab-separated-values';
      break;
    case 'json':
      content = convertToJSON(data);
      mimeType = 'application/json';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${timestamp}.${extension}`;

  downloadFile(content, fullFilename, mimeType);
}
