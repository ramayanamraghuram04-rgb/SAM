import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { Button } from './Button';

interface NotebookImageViewerProps {
  imageUrls: string[];
  verificationCode?: string;
  studentName?: string;
  studentPIN?: string;
  maxHeight?: string;
}

export const NotebookImageViewer: React.FC<NotebookImageViewerProps> = ({
  imageUrls,
  verificationCode,
  studentName,
  studentPIN,
  maxHeight = 'max-h-[60vh]',
}) => {
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Reset zoom on page change
  useEffect(() => {
    setZoomLevel(1);
  }, [activePageIndex]);

  // Keyboard navigation (ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActivePageIndex((p) => Math.max(0, p - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePageIndex((p) => Math.min(imageUrls.length - 1, p + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrls.length]);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
        No notebook pages found.
      </div>
    );
  }

  const currentUrl = imageUrls[activePageIndex];
  const totalPages = imageUrls.length;

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(0.75, Number((z - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleOpenOriginal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        {/* Page Counter & Mode Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            Page {activePageIndex + 1} of {totalPages}
          </span>
          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
            Notebook Capture
          </span>
          {verificationCode && (
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              Code: {verificationCode}
            </span>
          )}
        </div>

        {/* Action Controls: Zoom, Navigation, Original */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-colors"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-30"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open Original in New Tab */}
          <button
            type="button"
            onClick={handleOpenOriginal}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
            title="Open Original High-Resolution Photo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Prev / Next Page Buttons */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={activePageIndex <= 0}
            onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Prev
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={activePageIndex >= totalPages - 1}
            onClick={() => setActivePageIndex((p) => Math.min(totalPages - 1, p + 1))}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Main Page Image Stage */}
      <div 
        className={`relative w-full rounded-xl overflow-auto bg-slate-950 border border-slate-200/80 flex items-center justify-center p-2 min-h-[320px] ${maxHeight}`}
      >
        <div 
          className="transition-transform duration-150 ease-out flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={currentUrl}
            alt={`Notebook page ${activePageIndex + 1} of ${totalPages}`}
            className="max-w-full max-h-[55vh] object-contain rounded shadow-lg select-none"
            loading="eager"
          />
        </div>

        {/* Floating Quick Hint */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded pointer-events-none">
          Use ← → keys to navigate
        </div>
      </div>

      {/* Bottom Thumbnails Strip (if > 1 page) */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
          {imageUrls.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={() => setActivePageIndex(idx)}
              className={`relative w-14 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                idx === activePageIndex
                  ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105 shadow-sm'
                  : 'border-slate-200 opacity-60 hover:opacity-100'
              }`}
              title={`Page ${idx + 1}`}
            >
              <img
                src={url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center py-0.5">
                P{idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
