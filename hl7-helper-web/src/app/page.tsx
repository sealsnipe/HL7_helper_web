"use client";

import React, { useState } from 'react';
import { MessageEditor } from '@/components/MessageEditor';
import { SegmentDto } from '@/types';

export default function Home() {
  const [hl7Text, setHl7Text] = useState<string>('');
  const [segments, setSegments] = useState<SegmentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Assuming backend runs on localhost:5000 or similar. Adjust port if needed.
  // In production, this would be an environment variable.
  const API_BASE_URL = 'http://localhost:5125/api';

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: hl7Text,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || 'Failed to parse message');
      }

      const data: SegmentDto[] = await response.json();
      setSegments(data);
    } catch (err: any) {
      setError(err.message);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updatedSegments: SegmentDto[]) => {
    setSegments(updatedSegments);
    // Optional: Auto-generate on change, or wait for button click
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalHl7: hl7Text,
          segments: segments
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || 'Failed to generate message');
      }

      const data = await response.json();
      setHl7Text(data.hl7);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MARIS HL7 Helper</h1>
            <p className="text-gray-500 mt-1">Web Edition</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
              Load Template
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all">
              New Message
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Raw HL7 Message</label>
                <span className="text-xs text-gray-400">Paste your HL7 message here</span>
              </div>
              <textarea
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={hl7Text}
                onChange={(e) => setHl7Text(e.target.value)}
                placeholder="MSH|^~\&|..."
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={loading || !hl7Text}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {loading ? 'Processing...' : 'Parse Message'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md shadow-sm">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Editor */}
          <div className="space-y-4">
            {segments.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Message Editor</h2>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 shadow-sm transition-all"
                  >
                    Update Raw Message
                  </button>
                </div>
                <MessageEditor segments={segments} onUpdate={handleUpdate} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="mt-2 text-sm font-medium">No message parsed yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
