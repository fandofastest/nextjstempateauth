"use client";
import React, { useState, useEffect } from "react";

interface FilePreviewProps {
  file: File;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export default function FilePreview({ 
  file, 
  className = "", 
  maxWidth = 200, 
  maxHeight = 150 
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Determine preview type
    if (fileType.startsWith('image/')) {
      setPreviewType('image');
      createImagePreview();
    } else if (fileType.startsWith('video/')) {
      setPreviewType('video');
      createVideoPreview();
    } else if (fileType.startsWith('audio/')) {
      setPreviewType('audio');
      createAudioPreview();
    } else if (fileType === 'application/pdf') {
      setPreviewType('pdf');
    } else if (fileType.startsWith('text/') || 
               fileName.endsWith('.txt') || 
               fileName.endsWith('.md') || 
               fileName.endsWith('.json') ||
               fileName.endsWith('.csv')) {
      setPreviewType('text');
      createTextPreview();
    } else {
      setPreviewType('unknown');
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  const createImagePreview = () => {
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    } catch (err) {
      setError('Failed to create image preview');
    }
  };

  const createVideoPreview = () => {
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    } catch (err) {
      setError('Failed to create video preview');
    }
  };

  const createAudioPreview = () => {
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    } catch (err) {
      setError('Failed to create audio preview');
    }
  };

  const createTextPreview = () => {
    if (file.size > 50000) { // Don't preview large text files
      setError('File too large for preview');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read text file');
    };
    reader.readAsText(file);
  };

  const getFileIcon = () => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return (
        <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return (
        <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600" style={{ maxWidth, maxHeight }}>
          {getFileIcon()}
          <p className="text-xs text-gray-500 mt-2 text-center">Preview not available</p>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return previewUrl ? (
          <div className="relative overflow-hidden rounded border" style={{ maxWidth, maxHeight }}>
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              style={{ maxWidth, maxHeight }}
              onError={() => setError('Failed to load image')}
            />
          </div>
        ) : null;

      case 'video':
        return previewUrl ? (
          <div className="relative overflow-hidden rounded border" style={{ maxWidth, maxHeight }}>
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              style={{ maxWidth, maxHeight }}
              controls={false}
              muted
              onError={() => setError('Failed to load video')}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        ) : null;

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded border" style={{ maxWidth, maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 text-center font-medium">Audio File</p>
            <p className="text-xs text-gray-500 text-center truncate max-w-full">{file.name}</p>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded border" style={{ maxWidth, maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-red-700 dark:text-red-300 mt-2 text-center font-medium">PDF Document</p>
            <p className="text-xs text-red-600 dark:text-red-400 text-center truncate max-w-full">{file.name}</p>
          </div>
        );

      case 'text':
        return previewUrl ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border text-xs font-mono overflow-hidden" style={{ maxWidth, maxHeight }}>
            <div className="overflow-hidden">
              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-xs leading-tight">
                {previewUrl.length > 200 ? previewUrl.substring(0, 200) + '...' : previewUrl}
              </pre>
            </div>
          </div>
        ) : null;

      default:
        return (
          <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded border" style={{ maxWidth, maxHeight }}>
            {getFileIcon()}
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 text-center font-medium">
              {file.type || 'Unknown file type'}
            </p>
            <p className="text-xs text-gray-500 text-center truncate max-w-full">{file.name}</p>
          </div>
        );
    }
  };

  return (
    <div className={`file-preview ${className}`}>
      {renderPreview()}
    </div>
  );
}
