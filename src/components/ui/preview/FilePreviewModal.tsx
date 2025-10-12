"use client";
import React from "react";
import FilePreview from "./FilePreview";
import Button from "@/components/ui/button/Button";

interface FilePreviewModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {file.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="ml-4"
          >
            Tutup
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[400px]">
          <FilePreview 
            file={file} 
            maxWidth={600} 
            maxHeight={400}
            className="shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">File Type:</span> {file.type || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
            </div>
            <div>
              <span className="font-medium">Last Modified:</span> {new Date(file.lastModified).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
