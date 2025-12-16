'use client';

import { useState } from 'react';
import { ExportButton } from './ExportButton';
import { ImportButton } from './ImportButton';
import type { ImportResult } from '@/types/persistence';

export function DataManagement() {
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);

  return (
    <div
      className="p-4 border rounded-lg bg-card"
      data-testid="data-management"
      role="region"
      aria-labelledby="data-management-heading"
    >
      <h3 id="data-management-heading" className="text-lg font-semibold mb-4">Data Management</h3>

      <div className="flex gap-4 mb-4">
        <ExportButton />
        <ImportButton onImportComplete={setLastImport} />
      </div>

      {lastImport && lastImport.success && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded" role="status">
          <p className="text-green-800 dark:text-green-200">
            Import successful! Imported: {lastImport.imported.join(', ')}
          </p>
          {lastImport.skipped.length > 0 && (
            <p className="text-yellow-600">Skipped: {lastImport.skipped.join(', ')}</p>
          )}
        </div>
      )}

      {lastImport && !lastImport.success && (
        <div
          className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded"
          role="alert"
          data-testid="import-error"
        >
          <p className="text-red-800 dark:text-red-200 font-medium">Import failed</p>
          {lastImport.errors.length > 0 && (
            <ul className="text-red-700 dark:text-red-300 text-sm mt-1 list-disc list-inside">
              {lastImport.errors.map((err, idx) => (
                <li key={idx}>{err.key}: {err.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
