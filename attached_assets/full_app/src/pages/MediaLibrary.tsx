import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore, MediaAsset, AssetCategory } from '../store/MediaStore';
import {
  AudioLinesIcon,
  MusicIcon,
  Music2Icon,
  AudioWaveformIcon,
  ImageIcon,
  FileTextIcon,
  VideoIcon,
  UploadIcon,
  FolderIcon,
  FileIcon,
  HardDriveIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Trash2Icon,
  DownloadIcon } from
'lucide-react';
export function MediaLibrary() {
  const { mediaAssets, addAsset, removeAsset, getStorageStats } =
  useMediaStore();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>>(
    {
      studio: true,
      audio: true,
      music: true,
      sfx: true,
      images: true,
      videos: true,
      documents: true
    });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetCategory, setUploadTargetCategory] =
  useState<AssetCategory | null>(null);
  const selectedAsset = mediaAssets.find((a) => a.id === selectedAssetId);
  const stats = getStorageStats();
  const categories: {
    id: AssetCategory;
    label: string;
    description: string;
    icon: any;
  }[] = [
  {
    id: 'studio',
    label: 'Studio',
    description:
    'Record, mix, and edit in Studio. Your sessions and exports.',
    icon: AudioLinesIcon
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'All audio files for your podcasts and projects.',
    icon: MusicIcon
  },
  {
    id: 'music',
    label: 'Music',
    description: 'Music tracks and background scores.',
    icon: Music2Icon
  },
  {
    id: 'sfx',
    label: 'SFX',
    description: 'Sound effects and audio elements.',
    icon: AudioWaveformIcon
  },
  {
    id: 'images',
    label: 'Images',
    description: 'Artwork, photos, and graphics.',
    icon: ImageIcon
  },
  {
    id: 'videos',
    label: 'Videos',
    description: 'Video files and clips.',
    icon: VideoIcon
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Documents, scripts, and other files.',
    icon: FileTextIcon
  }];

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const handleUploadClick = (category: AssetCategory) => {
    setUploadTargetCategory(category);
    fileInputRef.current?.click();
  };
  const handleGlobalUploadClick = () => {
    setUploadTargetCategory(null); // auto-detect
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let category: AssetCategory = uploadTargetCategory || 'documents';
    // Auto-detect if global upload
    if (!uploadTargetCategory) {
      if (file.type.startsWith('audio/')) category = 'audio';else
      if (file.type.startsWith('image/')) category = 'images';else
      if (file.type.startsWith('video/')) category = 'videos';
    }
    addAsset({
      name: file.name,
      category,
      source: 'upload',
      size: file.size,
      type: file.type || 'unknown',
      addedBy: 'Studio Creator',
      tags: [],
      description: ''
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  return (
    <AppLayout title="Media Library">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          All your podcast assets in one place. Open Studio to record, mix, and
          edit.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" />
      

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-violet-50 rounded-xl flex items-center justify-center">
                <FolderIcon className="w-8 h-8 text-violet-600" />
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FileIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Total Files
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {stats.totalFiles}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <HardDriveIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Total Size
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatSize(stats.totalSize)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FolderIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Total Folders
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">7</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Last Updated
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {mediaAssets.length > 0 ?
                    new Date(
                      mediaAssets[mediaAssets.length - 1].createdAt
                    ).toLocaleDateString() :
                    '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/studio"
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                
                <AudioLinesIcon className="w-4 h-4" />
                Open Studio
              </Link>
              <button
                onClick={handleGlobalUploadClick}
                className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                
                <UploadIcon className="w-4 h-4" />
                Upload File
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryAssets = mediaAssets.filter(
                (a) => a.category === category.id
              );
              const isExpanded = expandedSections[category.id];
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection(category.id)}>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                        <category.icon className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadClick(category.id);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-xs font-medium transition-colors">
                        
                        <UploadIcon className="w-3 h-3" />
                        Upload {category.label}
                      </button>
                      {isExpanded ?
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" /> :

                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </div>

                  {isExpanded &&
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      {categoryAssets.length === 0 ?
                    <div className="text-center py-8 text-gray-500 text-sm">
                          No {category.label.toLowerCase()} files yet.
                        </div> :

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryAssets.map((asset) =>
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAssetId === asset.id ? 'border-violet-500 bg-violet-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-violet-300'}`}>
                        
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <category.icon className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                              className="text-sm font-medium text-gray-900 truncate"
                              title={asset.name}>
                              
                                    {asset.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {formatSize(asset.size)} •{' '}
                                    {new Date(
                                asset.createdAt
                              ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                      )}
                        </div>
                    }
                    </div>
                  }
                </div>);

            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Media Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-6">Media Details</h3>

            {!selectedAsset ?
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <FileIcon className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  No file selected
                </p>
                <p className="text-xs text-gray-500">
                  Select a file or folder to view details.
                </p>
              </div> :

            <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                  {categories.
                find((c) => c.id === selectedAsset.category)?.
                icon({
                  className: 'w-12 h-12 text-violet-400 mb-3'
                })}
                  <p className="text-sm font-bold text-gray-900 text-center px-4 break-all">
                    {selectedAsset.name}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">File Name</span>
                    <span
                    className="font-medium text-gray-900 truncate max-w-[150px]"
                    title={selectedAsset.name}>
                    
                      {selectedAsset.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">File Type</span>
                    <span className="font-medium text-gray-900">
                      {selectedAsset.type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">File Size</span>
                    <span className="font-medium text-gray-900">
                      {formatSize(selectedAsset.size)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium text-gray-900">
                      {new Date(selectedAsset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Added By</span>
                    <span className="font-medium text-gray-900">
                      {selectedAsset.addedBy}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Source</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {selectedAsset.source}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-sm font-medium transition-colors">
                    <DownloadIcon className="w-4 h-4" />
                    Download
                  </button>
                  <button
                  onClick={() => {
                    if (confirm('Delete this file?')) {
                      removeAsset(selectedAsset.id);
                      setSelectedAssetId(null);
                    }
                  }}
                  className="flex items-center justify-center p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            }
          </div>

          {/* Storage Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-6">Storage Overview</h3>

            <div className="flex flex-col items-center justify-center py-6 mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-gray-100"
                    strokeWidth="12"
                    fill="none" />
                  
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="stroke-violet-500"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="351.858"
                    strokeDashoffset={
                    mediaAssets.length === 0 ? '351.858' : '250'
                    }
                    strokeLinecap="round" />
                  
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <HardDriveIcon className="w-8 h-8 text-violet-600 mb-1" />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <div>
                <p className="text-gray-500 mb-1">Total Size</p>
                <p className="font-bold text-gray-900">
                  {formatSize(stats.totalSize)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 mb-1">Total Files</p>
                <p className="font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}