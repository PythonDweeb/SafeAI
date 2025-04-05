'use client';

import { useState, useRef } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  maxSize?: number; // in MB
}

const FileUpload = ({ 
  onFileSelect, 
  accept = 'video/mp4,video/webm,video/ogg', 
  label = 'Upload video for analysis',
  maxSize = 50 // 50MB
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcessFile(file);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
    }
  };
  
  const validateAndProcessFile = (file: File) => {
    setError(null);
    
    // Check file type
    const fileType = file.type;
    if (!accept.includes(fileType)) {
      setError(`Invalid file type. Please upload ${accept.replace(/,/g, ' or ')} files.`);
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize}MB.`);
      return;
    }
    
    onFileSelect(file);
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileSelect}
      />
      
      <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />
      
      <p className="mt-2 text-sm text-gray-600">{label}</p>
      <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
      
      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
      
      <button
        type="button"
        onClick={handleButtonClick}
        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
      >
        Select File
      </button>
    </div>
  );
};

export default FileUpload;
