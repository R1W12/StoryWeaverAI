
import React, { ChangeEvent, useRef, useState, useCallback } from 'react';
import { PageInput } from '../types';
// FIX: Replaced non-existent UploadIcon with PhotoIcon.
import { PhotoIcon, TrashIcon } from './icons';

interface PageInputFormProps {
  page: PageInput;
  pageNumber: number;
  onUpdate: (id: string, updatedPage: Partial<Omit<PageInput, 'id'>>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const PageInputForm: React.FC<PageInputFormProps> = ({ page, pageNumber, onUpdate, onDelete, canDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string>(page.imageUrl || '');

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newImageUrl = URL.createObjectURL(file);
      setImageUrl(newImageUrl);
      onUpdate(page.id, { image: file, imageUrl: newImageUrl });
    }
  };
  
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(page.id, { userText: e.target.value });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = useCallback(() => {
    onDelete(page.id);
  }, [onDelete, page.id]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 relative transition-shadow hover:shadow-xl">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 md:w-1/3">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Page {pageNumber}: Drawing</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          <div
            onClick={handleUploadClick}
            className="w-full h-48 sm:h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center text-gray-500 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
            ) : (
              <div className="flex flex-col items-center">
                {/* FIX: Replaced non-existent UploadIcon with PhotoIcon. */}
                <PhotoIcon className="h-10 w-10 mb-2" />
                <span className="font-medium">Click to upload an image</span>
                <span className="text-sm">PNG, JPG, WEBP</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-lg text-gray-700 mb-2">Page {pageNumber}: Story Idea</h3>
          <textarea
            value={page.userText}
            onChange={handleTextChange}
            placeholder="e.g., A brave little fox discovers a hidden, glowing mushroom in the forest."
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
          />
        </div>
      </div>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-2 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
          aria-label="Delete page"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default PageInputForm;