import { getPersistenceService } from './PersistenceService';
import type { ExportBundle } from '@/types/persistence';

/**
 * Create export bundle with all user data
 */
export async function createExportBundle(): Promise<ExportBundle> {
  const service = getPersistenceService();
  return service.exportAll();
}

/**
 * Download export bundle as JSON file
 * Default filename: hl7-helper-backup-YYYY-MM-DD.json
 */
export function downloadAsJson(bundle: ExportBundle, filename?: string): void {
  const defaultFilename = `hl7-helper-backup-${new Date().toISOString().split('T')[0]}.json`;
  const name = filename || defaultFilename;

  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download in one step
 */
export async function exportAndDownload(filename?: string): Promise<void> {
  const bundle = await createExportBundle();
  downloadAsJson(bundle, filename);
}
