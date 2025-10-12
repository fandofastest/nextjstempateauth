"use client";
import React, { useState } from "react";

interface UploadedFilePreviewProps {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export default function UploadedFilePreview({ 
  fileUrl, 
  fileName, 
  mimeType = '', 
  className = "", 
  maxWidth = 200, 
  maxHeight = 150 
}: UploadedFilePreviewProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getFileType = () => {
    const fileType = mimeType.toLowerCase();
    const name = fileName.toLowerCase();

    if (fileType.startsWith('image/')) {
      return 'image';
    } else if (fileType.startsWith('video/')) {
      return 'video';
    } else if (fileType.startsWith('audio/')) {
      return 'audio';
    } else if (fileType === 'application/pdf') {
      return 'pdf';
    } else if (fileType.startsWith('text/') || 
               name.endsWith('.txt') || 
               name.endsWith('.md') || 
               name.endsWith('.json') ||
               name.endsWith('.csv')) {
      return 'text';
    } else {
      return 'unknown';
    }
  };

  const getFileIcon = () => {
    const fileType = mimeType.toLowerCase();
    const name = fileName.toLowerCase();

    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
      return (
        <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
      return (
        <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  const renderPreview = () => {
    const fileType = getFileType();

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded border" style={{ width: maxWidth, height: maxHeight }}>
          {getFileIcon()}
          <p className="text-xs text-gray-500 mt-1 text-center">Preview not available</p>
        </div>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <div className="relative overflow-hidden rounded border" style={{ width: maxWidth, height: maxHeight }}>
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-full object-cover"
              onLoad={() => setLoading(false)}
              onError={() => {
                setError('Failed to load image');
                setLoading(false);
              }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="relative overflow-hidden rounded border bg-black" style={{ width: maxWidth, height: maxHeight }}>
            <video
              src={fileUrl}
              className="w-full h-full object-cover"
              onLoadedData={() => setLoading(false)}
              onError={() => {
                setError('Failed to load video');
                setLoading(false);
              }}
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded border" style={{ width: maxWidth, height: maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 text-center font-medium">Audio</p>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex flex-col items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 rounded border" style={{ width: maxWidth, height: maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-red-700 dark:text-red-300 mt-1 text-center font-medium">PDF</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded border" style={{ width: maxWidth, height: maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 text-center font-medium truncate max-w-full">
              {mimeType || 'File'}
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`uploaded-file-preview ${className}`}>
      {renderPreview()}
    </div>
  );
}
