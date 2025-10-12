"use client";
import React from "react";
import UploadedFilePreview from "./UploadedFilePreview";
import Button from "@/components/ui/button/Button";
import { FileItem } from "@/services/fileService";

interface UploadedFilePreviewModalProps {
  file: FileItem | null;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadedFilePreviewModal({ file, fileUrl, isOpen, onClose }: UploadedFilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploaderName = () => {
    if (typeof file.uploader === 'object' && file.uploader !== null) {
      return file.uploader.name || file.uploader.email || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/[0.06] dark:bg-[#0B1220] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)} • {file.mimeType || 'Unknown type'}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Tutup
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[400px]">
          <UploadedFilePreview 
            fileUrl={fileUrl}
            fileName={file.originalName}
            mimeType={file.mimeType}
            maxWidth={600} 
            maxHeight={400}
            className="shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium">File Type:</span>
              <p className="text-gray-900 dark:text-white">{file.mimeType || 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium">Size:</span>
              <p className="text-gray-900 dark:text-white">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <span className="font-medium">Uploaded:</span>
              <p className="text-gray-900 dark:text-white">{new Date(file.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium">Uploader:</span>
              <p className="text-gray-900 dark:text-white">{getUploaderName()}</p>
            </div>
            {file.category && (
              <div>
                <span className="font-medium">Category:</span>
                <p className="text-gray-900 dark:text-white">{file.category}</p>
              </div>
            )}
            {file.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="text-gray-900 dark:text-white">{file.description}</p>
              </div>
            )}
            {file.tags && file.tags.length > 0 && (
              <div>
                <span className="font-medium">Tags:</span>
                <p className="text-gray-900 dark:text-white">{file.tags.join(', ')}</p>
              </div>
            )}
            <div>
              <span className="font-medium">Visibility:</span>
              <p className="text-gray-900 dark:text-white">{file.isPublic ? 'Public' : 'Private'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
