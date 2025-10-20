import React, { useState, useCallback, DragEvent } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';

interface ImageUploaderProps {
  title: string;
  imagePreview: string | null;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, imagePreview, onImageUpload, onImageRemove }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  return (
    <div>
      <h3 className="text-md font-medium text-gray-300 mb-2">{title}</h3>
      <div 
        className={`relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${isDraggingOver ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 bg-gray-800'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="Preview" className="object-cover w-full h-full rounded-md" />
            <button onClick={onImageRemove} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <label htmlFor={`file-upload-${title.replace(' ','-')}`} className="cursor-pointer text-center p-4">
            <PlusIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <span className="text-sm text-gray-400">Seret & Lepas atau Klik</span>
            <input id={`file-upload-${title.replace(' ','-')}`} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;