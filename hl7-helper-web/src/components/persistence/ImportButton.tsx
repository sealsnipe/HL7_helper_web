'use client';

import { useState, useRef } from 'react';
import { importFromFile, type ValidationResult } from '@/services/persistence/importService';
import type { ImportResult } from '@/types/persistence';

interface ImportButtonProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function ImportButton({ onImportComplete }: ImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setValidation(null);

    try {
      const { validation, result } = await importFromFile(file);
      setValidation(validation);

      if (result) {
        if (result.success) {
          onImportComplete?.(result);
        } else if (result.errors.length > 0) {
          setError(result.errors.map(e => e.error).join(', '));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
        id="import-file"
        data-testid="import-file-input"
      />
      <label
        htmlFor="import-file"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer inline-block ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
        data-testid="import-button"
      >
        {isImporting ? 'Importing...' : 'Import Data'}
      </label>

      {validation && !validation.valid && (
        <div className="mt-2 text-red-500" role="alert">
          {validation.errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}

      {validation && validation.valid && validation.warnings.length > 0 && (
        <div className="mt-2 text-yellow-600" role="status">
          {validation.warnings.map((w) => <p key={w}>{w}</p>)}
        </div>
      )}

      {error && <p className="text-red-500 mt-2" role="alert">{error}</p>}
    </div>
  );
}
