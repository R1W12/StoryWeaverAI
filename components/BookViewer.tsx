
import React, { useState, useEffect, useCallback } from 'react';
import { BookPage } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, StopIcon, ArrowPathIcon } from './icons';

interface BookViewerProps {
  pages: BookPage[];
  onReset: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ pages, onReset }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Clean up speech synthesis on component unmount or page change
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  
  const handleNextPage = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentPageIndex((prev) => Math.min(prev + 1, pages.length - 1));
  }, [pages.length]);

  const handlePrevPage = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentPageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReadAloud = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // In a production app, this would be replaced with a call to the ElevenLabs API
      // to generate high-quality, expressive narration.
      const utterance = new SpeechSynthesisUtterance(pages[currentPageIndex].generatedText);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking, currentPageIndex, pages]);

  const currentPage = pages[currentPageIndex];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 w-full flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
            <img 
                src={currentPage.imageUrl} 
                alt={`Story page ${currentPageIndex + 1}`}
                className="w-full h-auto object-cover rounded-xl aspect-square" 
            />
        </div>
        <div className="lg:w-1/2 flex flex-col">
            <div className="flex-grow">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap font-serif">
                    {currentPage.generatedText}
                </p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleReadAloud}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200"
              >
                {isSpeaking ? (
                  <>
                    <StopIcon className="h-6 w-6" />
                    <span>Stop Narration</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-6 w-6" />
                    <span>Read Aloud</span>
                  </>
                )}
              </button>
            </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between w-full max-w-lg">
        <button
          onClick={handlePrevPage}
          disabled={currentPageIndex === 0}
          className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <span className="font-semibold text-gray-700">
          Page {currentPageIndex + 1} of {pages.length}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPageIndex === pages.length - 1}
          className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Page"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      <button
        onClick={onReset}
        className="mt-8 flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
        <ArrowPathIcon className="h-5 w-5" />
        Create Another Story
      </button>
    </div>
  );
};

export default BookViewer;
