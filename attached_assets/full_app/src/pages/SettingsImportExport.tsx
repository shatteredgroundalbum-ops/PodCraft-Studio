import React, { useState, useRef } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import {
  ChevronRightIcon,
  UploadCloudIcon,
  DownloadIcon,
  FileTextIcon,
  CheckIcon,
  XIcon } from
'lucide-react';
type ExportEntry = {
  id: number;
  date: string;
  type: string;
  format: string;
  status: 'Completed' | 'Processing';
  size: string;
};
export function SettingsImportExport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [exportType, setExportType] = useState('Episodes');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exports, setExports] = useState<ExportEntry[]>([]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      setImportDone(false);
    }
  };
  const handleImport = () => {
    if (!selectedFile) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportDone(true);
    }, 1200);
  };
  const handleConfigureExport = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formatBytes = ['1.2 MB', '3.4 MB', '512 KB', '8.7 MB'][
    Math.floor(Math.random() * 4)];

    setExports([
    {
      id: Date.now(),
      date: now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      type: exportType,
      format: exportFormat,
      status: 'Completed',
      size: formatBytes
    },
    ...exports]
    );
    setShowExportForm(false);
  };
  const removeExport = (id: number) =>
  setExports(exports.filter((e) => e.id !== id));
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Import & Export
        </h1>
        <p className="text-sm text-gray-500">
          Import data into Podify or export your data.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Import Data */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
            <p className="text-sm text-gray-500 mb-4">
              Import your data from a file.
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                <UploadCloudIcon className="w-6 h-6 text-violet-500" />
              </div>
              {!selectedFile ?
              <>
                  <p className="text-sm text-gray-700 font-medium">
                    No file selected.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose a file or drag and drop to import.
                  </p>
                </> :

              <>
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </>
              }

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden" />
              

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                  
                  {selectedFile ? 'Change File' : 'Choose File'}
                </button>
                {selectedFile && !importDone &&
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60">
                  
                    {importing ? 'Importing…' : 'Start Import'}
                  </button>
                }
                {importDone &&
                <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-green-700 font-medium">
                    <CheckIcon className="w-4 h-4" />
                    Import complete
                  </span>
                }
              </div>
            </div>
          </section>

          {/* Export Data */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
            <p className="text-sm text-gray-500 mb-4">
              Export your data from Podify.
            </p>

            {!showExportForm ?
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <DownloadIcon className="w-6 h-6 text-violet-500" />
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  No export configured.
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Configure export settings and run an export.
                </p>
                <button
                onClick={() => setShowExportForm(true)}
                className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                
                  Configure Export
                </button>
              </div> :

            <form
              onSubmit={handleConfigureExport}
              className="bg-violet-50/50 border border-violet-100 rounded-lg p-5 space-y-4">
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Data type
                  </label>
                  <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  
                    <option>Episodes</option>
                    <option>Analytics</option>
                    <option>Team members</option>
                    <option>All data</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Format
                  </label>
                  <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  
                    <option>CSV</option>
                    <option>JSON</option>
                    <option>XLSX</option>
                    <option>PDF</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                  
                    Run Export
                  </button>
                  <button
                  type="button"
                  onClick={() => setShowExportForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  
                    Cancel
                  </button>
                </div>
              </form>
            }
          </section>

          {/* Export History */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Export History
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              View your previous exports.
            </p>

            {exports.length === 0 ?
            <div className="border border-gray-100 rounded-lg">
                <div className="grid grid-cols-6 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span>Date</span>
                  <span>Type</span>
                  <span>Format</span>
                  <span>Status</span>
                  <span>Size</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <FileTextIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    No exports found.
                  </p>
                  <p className="text-sm text-gray-400">
                    Your export history will appear here.
                  </p>
                </div>
              </div> :

            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-6 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <span>Date</span>
                  <span>Type</span>
                  <span>Format</span>
                  <span>Status</span>
                  <span>Size</span>
                  <span className="text-right">Actions</span>
                </div>
                {exports.map((entry) =>
              <div
                key={entry.id}
                className="grid grid-cols-6 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 items-center">
                
                    <span className="text-gray-700">{entry.date}</span>
                    <span className="font-medium text-gray-900">
                      {entry.type}
                    </span>
                    <span className="text-gray-600">{entry.format}</span>
                    <span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {entry.status}
                      </span>
                    </span>
                    <span className="text-gray-600">{entry.size}</span>
                    <div className="text-right flex items-center justify-end gap-3">
                      <button className="text-violet-600 hover:text-violet-700 text-xs font-medium">
                        Download
                      </button>
                      <button
                    onClick={() => removeExport(entry.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors">
                    
                        <XIcon className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>

          <div className="flex justify-end">
            <button className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors inline-flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>);

}