'use client';

import { useState } from 'react';
import { exportAndDownload } from '@/services/persistence/exportService';

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      await exportAndDownload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        aria-label="Export all data as JSON backup file"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        data-testid="export-button"
      >
        {isExporting ? 'Exporting...' : 'Export Data'}
      </button>
      {error && <p className="text-red-500 mt-2" role="alert">{error}</p>}
    </div>
  );
}
