import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore, AssetCategory } from '../store/MediaStore';
import {
  AudioLinesIcon, MusicIcon, Music2Icon, AudioWaveformIcon, ImageIcon,
  FileTextIcon, VideoIcon, UploadIcon, HardDriveIcon, ClockIcon,
  ChevronDownIcon, ChevronRightIcon, Trash2Icon, DownloadIcon, PlusIcon,
  FolderOpenIcon,
} from 'lucide-react';

type CategoryDef = { id: AssetCategory; label: string; description: string; icon: React.ElementType };

const CATEGORIES: CategoryDef[] = [
  { id: 'studio', label: 'Studio', description: 'Recordings, sessions, and exports from Studio.', icon: AudioLinesIcon },
  { id: 'audio', label: 'Audio', description: 'All audio files for your podcasts and projects.', icon: MusicIcon },
  { id: 'music', label: 'Music', description: 'Music tracks and background scores.', icon: Music2Icon },
  { id: 'sfx', label: 'SFX', description: 'Sound effects and audio elements.', icon: AudioWaveformIcon },
  { id: 'images', label: 'Images', description: 'Artwork, photos, and graphics.', icon: ImageIcon },
  { id: 'videos', label: 'Videos', description: 'Video recordings and clips.', icon: VideoIcon },
  { id: 'documents', label: 'Documents', description: 'Scripts, show notes, and documents.', icon: FileTextIcon },
];

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function MediaLibrary() {
  const { mediaAssets, addAsset, removeAsset, getStorageStats } = useMediaStore();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetCategory, setUploadTargetCategory] = useState<AssetCategory | null>(null);

  const selectedAsset = mediaAssets.find((a) => a.id === selectedAssetId);
  const stats = getStorageStats();

  const toggleSection = (id: string) => setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!uploadTargetCategory) return;
    files.forEach((file) => {
      addAsset({
        name: file.name,
        category: uploadTargetCategory,
        source: 'upload',
        size: file.size,
        type: file.type,
        addedBy: 'User',
        tags: [],
        description: '',
        url: URL.createObjectURL(file),
      });
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadTargetCategory(null);
  };

  return (
    <AppLayout title="Media Library">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">Manage all media files for your podcast projects.</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg">
            <HardDriveIcon className="w-4 h-4 text-violet-600" />
            <span className="font-medium text-gray-900">{formatSize(stats.totalSize)}</span>
            <span>used</span>
            <span className="text-gray-300">·</span>
            <span className="font-medium text-gray-900">{stats.totalFiles}</span>
            <span>files</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* File Tree */}
        <div className="flex-1 space-y-3">
          {CATEGORIES.map((cat) => {
            const assets = mediaAssets.filter((a) => a.category === cat.id);
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(cat.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 flex-shrink-0">
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{cat.label}</h3>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{assets.length} files</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadTargetCategory(cat.id); fileInputRef.current?.click(); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      <UploadIcon className="w-3 h-3" /> Upload
                    </button>
                    {expandedSections[cat.id] ? <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>

                {expandedSections[cat.id] && (
                  <div className="border-t border-gray-100">
                    {assets.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <FolderOpenIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 mb-3">No {cat.label.toLowerCase()} files yet.</p>
                        <button
                          onClick={() => { setUploadTargetCategory(cat.id); fileInputRef.current?.click(); }}
                          className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg text-sm font-medium mx-auto">
                          <PlusIcon className="w-4 h-4" /> Upload {cat.label}
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {assets.map((asset) => (
                          <div key={asset.id}
                            className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedAssetId === asset.id ? 'bg-violet-50' : ''}`}
                            onClick={() => setSelectedAssetId(selectedAssetId === asset.id ? null : asset.id)}>
                            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <cat.icon className="w-4 h-4 text-violet-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                              <p className="text-xs text-gray-500">{asset.type || '—'}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">{formatSize(asset.size)}</span>
                              <div className="flex items-center gap-1">
                                {asset.url && (
                                  <a href={asset.url} download={asset.name} onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                                    <DownloadIcon className="w-4 h-4" />
                                  </a>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this file?')) { removeAsset(asset.id); if (selectedAssetId === asset.id) setSelectedAssetId(null); } }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2Icon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Asset Details Panel */}
        {selectedAsset && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm">File Details</h3>
                <button onClick={() => setSelectedAssetId(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
              </div>
              <div className="w-full h-32 bg-violet-50 rounded-lg flex items-center justify-center mb-4">
                {selectedAsset.url && (selectedAsset.category === 'studio' || selectedAsset.category === 'audio' || selectedAsset.category === 'music' || selectedAsset.category === 'sfx') ? (
                  <audio controls src={selectedAsset.url} className="w-full px-2" />
                ) : (
                  <AudioLinesIcon className="w-12 h-12 text-violet-300" />
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-gray-900 break-all">{selectedAsset.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-500 mb-0.5">Size</p><p className="text-sm font-medium text-gray-900">{formatSize(selectedAsset.size)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Type</p><p className="text-sm font-medium text-gray-900 truncate">{selectedAsset.type || '—'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Added By</p><p className="text-sm font-medium text-gray-900">{selectedAsset.addedBy}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Source</p><p className="text-sm font-medium text-gray-900 capitalize">{selectedAsset.source}</p></div>
                </div>
                <div><p className="text-xs text-gray-500 mb-0.5">Added On</p><p className="text-sm font-medium text-gray-900">{new Date(selectedAsset.createdAt).toLocaleDateString()}</p></div>
                {selectedAsset.description && (
                  <div><p className="text-xs text-gray-500 mb-0.5">Description</p><p className="text-sm text-gray-700">{selectedAsset.description}</p></div>
                )}
                {selectedAsset.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.tags.map((tag) => <span key={tag} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">{tag}</span>)}
                    </div>
                  </div>
                )}
                <div className="pt-3 flex gap-2">
                  {selectedAsset.url && (
                    <a href={selectedAsset.url} download={selectedAsset.name}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700">
                      <DownloadIcon className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  <button onClick={() => { if (confirm('Delete this file?')) { removeAsset(selectedAsset.id); setSelectedAssetId(null); } }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">
                    <Trash2Icon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="*/*" onChange={handleFileChange} />
    </AppLayout>
  );
}
