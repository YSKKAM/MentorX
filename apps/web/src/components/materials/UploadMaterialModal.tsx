'use client';

import React, { useState, useRef } from 'react';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface UploadMaterialModalProps {
  classroomId: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function UploadMaterialModal({ classroomId, onClose, onUploaded }: UploadMaterialModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Unsupported file type. Please upload a PDF or DOCX file.');
      return false;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25 MB limit.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped)) {
        setFile(dropped);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.postFormData(`/learning-materials/classroom/${classroomId}`, formData);
      onUploaded();
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.message || 'Failed to upload material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] text-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📤</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">Upload Material</h2>
              <p className="text-xs font-bold text-gray-400">PDF or DOCX document (up to 25 MB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
              : 'border-white/20 bg-black/40 hover:border-indigo-500/50 hover:bg-black/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
          />

          <div className="h-16 w-16 mb-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl">
            {file ? (file.name.endsWith('.pdf') ? '📄' : '📝') : '📁'}
          </div>

          {file ? (
            <div className="text-center">
              <p className="text-sm font-black text-white truncate max-w-xs">{file.name}</p>
              <p className="text-xs font-bold text-indigo-400 mt-1">{formatFileSize(file.size)}</p>
              <p className="text-[11px] text-gray-400 mt-2 underline">Click or drop to replace</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-bold text-white">Drag and drop document here</p>
              <p className="text-xs text-gray-400 mt-1">or browse from your computer</p>
              <div className="mt-3 inline-block rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-mono text-gray-300">
                Supports .PDF & .DOCX
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="font-black bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Processing Material...
              </span>
            ) : (
              'Upload & Process'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
