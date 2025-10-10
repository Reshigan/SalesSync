#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📁 Creating file upload components and integration...\n');

// File upload hook
const fileUploadHookContent = `'use client'

import { useState, useCallback } from 'react';
import apiService from '@/lib/api';

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  uploadEndpoint?: string;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB
    acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
    uploadEndpoint = '/files/upload'
  } = options;

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return \`File size exceeds \${Math.round(maxSize / 1024 / 1024)}MB limit\`;
    }

    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return \`File type not supported. Accepted types: \${acceptedTypes.join(', ')}\`;
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      throw new Error(\`Maximum \${maxFiles} files allowed\`);
    }

    const validatedFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      validatedFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: error ? 'error' : 'pending',
        error
      });
    });

    setFiles(prev => [...prev, ...validatedFiles]);
    return validatedFiles.filter(f => f.status === 'pending');
  }, [files.length, maxFiles, maxSize, acceptedTypes]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', url: response.data.url, progress: 100 }
                : f
            ));
            resolve();
          } catch (error) {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'error', error: 'Invalid response from server' }
                : f
            ));
            reject(error);
          }
        } else {
          const error = \`Upload failed with status \${xhr.status}\`;
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'error', error } : f
          ));
          reject(new Error(error));
        }
      };

      xhr.onerror = () => {
        const error = 'Upload failed due to network error';
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'error', error } : f
        ));
        reject(new Error(error));
      };

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      xhr.open('POST', \`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001/api'}\${uploadEndpoint}\`);
      
      // Add auth header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', \`Bearer \${token}\`);
      }

      xhr.send(formData);
    });
  };

  const uploadAll = async (): Promise<void> => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    try {
      await Promise.all(pendingFiles.map(uploadFile));
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const getSuccessfulUploads = () => files.filter(f => f.status === 'success');
  const getFailedUploads = () => files.filter(f => f.status === 'error');

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    getSuccessfulUploads,
    getFailedUploads
  };
};`;

// File upload components
const fileUploadComponentsContent = `import React, { useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, File, Image } from 'lucide-react';
import { useFileUpload, UploadFile } from '@/hooks/use-file-upload';

interface FileUploadProps {
  onUploadComplete?: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    getSuccessfulUploads
  } = useFileUpload({ maxFiles, maxSize, acceptedTypes });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      try {
        addFiles(selectedFiles);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error adding files');
      }
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      try {
        addFiles(droppedFiles);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error adding files');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    await uploadAll();
    const successfulFiles = getSuccessfulUploads();
    if (onUploadComplete && successfulFiles.length > 0) {
      onUploadComplete(successfulFiles);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={\`space-y-4 \${className}\`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maximum {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Selected Files ({files.length})</h3>
            <div className="space-x-2">
              <button
                onClick={handleUpload}
                disabled={isUploading || files.every(f => f.status !== 'pending')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((uploadFile) => (
              <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getFileIcon(uploadFile.file)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: \`\${uploadFile.progress}%\` }}
                      />
                    </div>
                  )}
                  
                  {uploadFile.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadFile.status)}
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple file input component
export const SimpleFileInput: React.FC<{
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
}> = ({ onFileSelect, accept = '*', className = '' }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <input
      type="file"
      accept={accept}
      onChange={handleChange}
      className={\`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 \${className}\`}
    />
  );
};`;

// Create directories
const hooksDir = path.join(__dirname, 'frontend/src/hooks');
const componentsDir = path.join(__dirname, 'frontend/src/components/ui');

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Write files
fs.writeFileSync(path.join(hooksDir, 'use-file-upload.ts'), fileUploadHookContent);
fs.writeFileSync(path.join(componentsDir, 'file-upload.tsx'), fileUploadComponentsContent);

console.log('✅ Created file upload hook');
console.log('✅ Created file upload components');
console.log('✅ Added drag & drop support');
console.log('✅ Added progress tracking');
console.log('\n🎉 File upload functionality implemented!');