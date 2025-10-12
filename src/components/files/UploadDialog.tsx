"use client";
import React, { useRef, useState, useEffect } from "react";
import TagsInput from "@/components/ui/input/TagsInput";
import Button from "@/components/ui/button/Button";
import FilePreview from "@/components/ui/preview/FilePreview";
import FilePreviewModal from "@/components/ui/preview/FilePreviewModal";
import { fileService, type CategoryItem } from "@/services/fileService";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

export default function UploadDialog({ isOpen, onClose, onUploaded }: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<'select-file' | 'configure'>('select-file');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Configuration states
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [globalIsPublic, setGlobalIsPublic] = useState(false);
  
  // Individual file configurations
  const [fileConfigs, setFileConfigs] = useState<Record<string, {
    category: string;
    description: string;
    tags: string[];
  }>>({});
  
  // Preview modal state
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load categories when dialog opens
  useEffect(() => {
    if (isOpen) {
      let mounted = true;
      (async () => {
        try {
          const list = await fileService.getCategories();
          if (mounted) setCategories(list);
        } catch (e) {
          // ignore
        }
      })();
      return () => { mounted = false; };
    }
  }, [isOpen]);

  // Reset dialog state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep('select-file');
      setSelectedFiles([]);
      setFileConfigs({});
      setGlobalIsPublic(false);
      setUploadProgress({});
      setError(null);
      setShowAddCat(false);
      setNewCatName('');
      setPreviewFile(null);
      setShowPreviewModal(false);
    }
  }, [isOpen]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    console.log('Adding files:', fileArray.map(f => f.name));
    
    setSelectedFiles(prevFiles => {
      // Filter out duplicate files
      const existingFileKeys = prevFiles.map(f => `${f.name}-${f.size}`);
      const newFiles = fileArray.filter(file => {
        const fileKey = `${file.name}-${file.size}`;
        return !existingFileKeys.includes(fileKey);
      });
      
      if (newFiles.length === 0) {
        console.log('No new files to add (duplicates filtered)');
        return prevFiles;
      }
      
      console.log('Adding new files:', newFiles.map(f => f.name));
      
      // Initialize config for new files
      setFileConfigs(prevConfigs => {
        const newConfigs = { ...prevConfigs };
        newFiles.forEach(file => {
          const fileKey = `${file.name}-${file.size}`;
          newConfigs[fileKey] = {
            category: '',
            description: '',
            tags: []
          };
        });
        return newConfigs;
      });
      
      setStep('configure');
      setError(null);
      
      return [...prevFiles, ...newFiles];
    });
  };

  const removeFile = (indexToRemove: number) => {
    const fileToRemove = selectedFiles[indexToRemove];
    const fileKey = `${fileToRemove.name}-${fileToRemove.size}`;
    
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setFileConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[fileKey];
      return newConfigs;
    });
    
    if (selectedFiles.length === 1) {
      setStep('select-file');
    }
  };

  const onCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    try {
      const created = await fileService.createCategory(name);
      const list = await fileService.getCategories();
      setCategories(list);
      setShowAddCat(false);
      setNewCatName('');
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat kategori');
    }
  };

  const updateFileConfig = (fileKey: string, field: string, value: any) => {
    setFileConfigs(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        [field]: value
      }
    }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Pilih minimal satu file');
      return;
    }

    // Check if all files have categories
    const missingCategories = selectedFiles.filter(file => {
      const fileKey = `${file.name}-${file.size}`;
      return !fileConfigs[fileKey]?.category;
    });
    
    if (missingCategories.length > 0) {
      setError(`Kategori harus dipilih untuk semua file`);
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      console.log('Uploading files with individual configs');
      
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileKey = `${file.name}-${file.size}`;
        const config = fileConfigs[fileKey];
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: true }));
        
        try {
          await fileService.upload(
            file, 
            config.category, 
            globalIsPublic, 
            config.description, 
            config.tags
          );
        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: false }));
      }
      
      onUploaded?.();
      if (typeof window !== "undefined") window.dispatchEvent(new Event("files:refresh"));
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/[0.06]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload File
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hidden inputs - always rendered */}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isUploading}
        />
        
        <input
          ref={addMoreInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            handleFileSelect(e.target.files);
            // Reset the input so same files can be selected again if needed
            if (e.target) e.target.value = '';
          }}
          disabled={isUploading}
        />

        {/* Content */}
        <div className="p-6">
          {step === 'select-file' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Pilih file yang ingin diupload
                </p>
                
                
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Klik untuk memilih file
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      atau drag & drop file ke sini
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'configure' && selectedFiles.length > 0 && (
            <div className="space-y-4">
              {/* Selected files info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    File Terpilih ({selectedFiles.length})
                  </h4>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (addMoreInputRef.current) {
                        addMoreInputRef.current.click();
                      }
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={isUploading}
                    type="button"
                  >
                    + Tambah file
                  </button>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedFiles.map((file, index) => {
                    const fileKey = `${file.name}-${file.size}`;
                    const isFileUploading = uploadProgress[fileKey];
                    const config = fileConfigs[fileKey] || { category: '', description: '', tags: [] };
                    
                    return (
                      <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded border">
                        {/* File header with preview */}
                        <div className="flex gap-3 mb-3">
                          {/* File preview */}
                          <div className="flex-shrink-0">
                            <div 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setPreviewFile(file);
                                setShowPreviewModal(true);
                              }}
                              title="Klik untuk preview lebih besar"
                            >
                              <FilePreview 
                                file={file} 
                                maxWidth={80} 
                                maxHeight={60}
                                className="border rounded"
                              />
                            </div>
                          </div>
                          
                          {/* File info and actions */}
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            
                            <div className="flex items-center ml-2">
                              {isFileUploading && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span className="ml-1 text-xs text-blue-600">Uploading...</span>
                                </div>
                              )}
                              
                              {!isUploading && (
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                  disabled={isUploading}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* File configuration */}
                        <div className="space-y-3 text-sm">
                          {/* Category */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Kategori *
                            </label>
                            <select
                              value={config.category}
                              onChange={(e) => updateFileConfig(fileKey, 'category', e.target.value)}
                              disabled={isUploading}
                              className="w-full rounded border px-2 py-1 text-xs bg-transparent"
                            >
                              <option value="">Pilih kategori</option>
                              {categories.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Description */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Deskripsi
                            </label>
                            <input
                              value={config.description}
                              onChange={(e) => updateFileConfig(fileKey, 'description', e.target.value)}
                              placeholder="Deskripsi singkat"
                              disabled={isUploading}
                              className="w-full rounded border px-2 py-1 text-xs bg-transparent"
                            />
                          </div>
                          
                          {/* Tags */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tags
                            </label>
                            <TagsInput
                              tags={config.tags}
                              onChange={(tags) => updateFileConfig(fileKey, 'tags', tags)}
                              placeholder="Ketik tag..."
                              disabled={isUploading}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: {selectedFiles.length} file(s) - {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))}
                  </p>
                </div>
              </div>

              {/* Global settings */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Pengaturan Global
                </h4>
                
                <div className="space-y-3">
                  {/* Add Category Button */}
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddCat(true)}
                      disabled={isUploading}
                      className="w-full"
                    >
                      + Tambah Kategori Baru
                    </Button>
                  </div>
                  
                  {/* Public checkbox */}
                  <div className="flex items-center">
                    <input
                      id="globalIsPublic"
                      type="checkbox"
                      checked={globalIsPublic}
                      onChange={(e) => setGlobalIsPublic(e.target.checked)}
                      disabled={isUploading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="globalIsPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Semua file dapat diakses publik
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 border-t border-gray-200 dark:border-white/[0.06]">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/[0.06]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Batal
          </Button>
          {step === 'configure' && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? `Mengupload ${selectedFiles.length} file(s)...` : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCat && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/25" onClick={() => setShowAddCat(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-theme-base font-semibold">Tambah Kategori</h3>
              <button className="px-2 py-1 text-sm" onClick={() => setShowAddCat(false)}>Tutup</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nama Kategori</label>
                <input 
                  value={newCatName} 
                  onChange={(e) => setNewCatName(e.target.value)} 
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                  placeholder="mis. Invoice" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAddCat(false)}>Batal</Button>
                <Button size="sm" onClick={onCreateCategory}>Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
