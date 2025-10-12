'use client'

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
      return `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
    }

    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`);
    }

    const validatedFiles: UploadFile[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      validatedFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
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
          const error = `Upload failed with status ${xhr.status}`;
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

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:12001/api'}${uploadEndpoint}`);
      
      // Add auth header if available
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
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
};