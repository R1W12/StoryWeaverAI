import React, { useState, useCallback, useRef } from 'react';
import { BookPage } from './types';
import { generateBookFromStory } from './services/geminiService';
import BookViewer from './components/BookViewer';
import { BookOpenIcon, SparklesIcon, PhotoIcon, TrashIcon } from './components/icons';

const App: React.FC = () => {
  const [storyText, setStoryText] = useState<string>('');
  const [characterFiles, setCharacterFiles] = useState<File[]>([]);
  const [characterImageUrls, setCharacterImageUrls] = useState<string[]>([]);

  const [generatedBook, setGeneratedBook] = useState<BookPage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCharacterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Simple validation for file types
      const validFiles = files.filter(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
      
      setCharacterFiles(prev => [...prev, ...validFiles]);
      
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setCharacterImageUrls(prev => [...prev, ...urls]);

      // Reset file input value to allow re-uploading the same file
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCharacterImage = (indexToRemove: number) => {
    setCharacterFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setCharacterImageUrls(prev => {
        const urlToRemove = prev[indexToRemove];
        URL.revokeObjectURL(urlToRemove); // Clean up memory
        return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleGenerateBook = async () => {
    setError(null);
    if (!storyText.trim() || characterFiles.length === 0) {
      setError("Please write a story and upload at least one character drawing.");
      return;
    }

    setIsLoading(true);
    setGeneratedBook(null);

    try {
      const newBookPages = await generateBookFromStory(
        storyText,
        characterFiles,
        setLoadingMessage,
      );
      setGeneratedBook(newBookPages);
    } catch (err) {
      console.error("Error generating book:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`An error occurred while creating your story. Please try again. (${errorMessage})`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setGeneratedBook(null);
    setStoryText('');
    setCharacterFiles([]);
    characterImageUrls.forEach(url => URL.revokeObjectURL(url));
    setCharacterImageUrls([]);
    setError(null);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              Story Weaver AI
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!generatedBook && (
          <>
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">Bring Your Story to Life</h2>
              <p className="mt-2 text-gray-600">
                Write your full story and upload drawings of your characters or scenes. Our AI will craft a beautifully illustrated and narrated digital book for you.
              </p>
            </div>
          
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 space-y-6">
              <div>
                <label htmlFor="story-text" className="block text-lg font-semibold text-gray-700 mb-2">1. Write Your Story</label>
                <textarea
                  id="story-text"
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Once upon a time, in a land filled with candy cane trees and gingerbread houses, lived a brave little fox named Finn..."
                  rows={12}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">2. Add Character Art</h3>
                 <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleCharacterImageChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center text-gray-500 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors p-6"
                  >
                    <div className="flex flex-col items-center">
                        <PhotoIcon className="h-10 w-10 mb-2" />
                        <span className="font-medium">Click to upload drawings</span>
                        <span className="text-sm">Provide one or more images of characters or scenes</span>
                    </div>
                </div>

                {characterImageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {characterImageUrls.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img src={url} alt={`Character art ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm"/>
                                <button
                                    onClick={() => handleRemoveCharacterImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                                    aria-label="Remove image"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <button
                onClick={handleGenerateBook}
                disabled={isLoading}
                className="w-full max-w-xs flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessage || 'Weaving your story...'}</span>
                  </>
                ) : (
                   <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Generate My Book</span>
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-center text-red-500 mt-4 font-medium">{error}</p>}
          </>
        )}

        {generatedBook && !isLoading && (
          <BookViewer pages={generatedBook} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;
