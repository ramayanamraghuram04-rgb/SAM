import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AnnotationStroke, AnnotationText, AnnotationPoint, PageAnnotation } from '../../types';
import { GripHorizontal } from 'lucide-react';

export type AnnotationTool = 'pen' | 'eraser' | 'text' | 'pan';
export type PenColor = '#EF4444' | '#3B82F6' | '#10B981' | '#111827';
export type PenThickness = 2 | 4 | 7;

interface AnnotationCanvasProps {
  pageIndex: number;
  imageUrl: string;
  initialAnnotation?: PageAnnotation;
  activeTool: AnnotationTool;
  color: PenColor;
  thickness: PenThickness;
  onAnnotationChange: (pageIndex: number, annotation: PageAnnotation) => void;
  undoTrigger?: number;
  redoTrigger?: number;
  clearTrigger?: number;
  onUndoRedoAvailabilityChange?: (canUndo: boolean, canRedo: boolean) => void;
  isPanActive?: boolean;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  pageIndex,
  imageUrl,
  initialAnnotation,
  activeTool,
  color,
  thickness,
  onAnnotationChange,
  undoTrigger = 0,
  redoTrigger = 0,
  clearTrigger = 0,
  onUndoRedoAvailabilityChange,
  isPanActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Current page stroke and text data
  const [strokes, setStrokes] = useState<AnnotationStroke[]>(initialAnnotation?.strokes || []);
  const [texts, setTexts] = useState<AnnotationText[]>(initialAnnotation?.texts || []);

  // Multi-level Undo & Redo stacks
  const [undoStack, setUndoStack] = useState<PageAnnotation[]>([]);
  const [redoStack, setRedoStack] = useState<PageAnnotation[]>([]);

  // Active drawing & dragging state
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<AnnotationStroke | null>(null);
  const draggingTextIndexRef = useRef<number | null>(null);
  const prevTextsBeforeDragRef = useRef<AnnotationText[]>([]);

  // Active inline text creation state
  const [activeTextInput, setActiveTextInput] = useState<{
    x: number; // normalized
    y: number; // normalized
    text: string;
  } | null>(null);

  // Dragging active input box state
  const isDraggingInputRef = useRef<boolean>(false);
  const inputDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Page switching & Initial load tracking
  const prevPageIndexRef = useRef<number>(pageIndex);
  const initialLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // When switching pages:
    if (prevPageIndexRef.current !== pageIndex) {
      prevPageIndexRef.current = pageIndex;
      const nextStrokes = initialAnnotation?.strokes || [];
      const nextTexts = initialAnnotation?.texts || [];
      setStrokes(nextStrokes);
      setTexts(nextTexts);
      setUndoStack([]);
      setRedoStack([]);
      setActiveTextInput(null);
      return;
    }

    // On initial mount or when first async data arrives for the current page:
    if (
      !initialLoadedRef.current &&
      initialAnnotation &&
      ((initialAnnotation.strokes && initialAnnotation.strokes.length > 0) ||
        (initialAnnotation.texts && initialAnnotation.texts.length > 0))
    ) {
      initialLoadedRef.current = true;
      setStrokes(initialAnnotation.strokes || []);
      setTexts(initialAnnotation.texts || []);
    }
  }, [pageIndex, initialAnnotation]);

  // Update undo/redo availability in parent toolbar
  useEffect(() => {
    if (onUndoRedoAvailabilityChange) {
      onUndoRedoAvailabilityChange(undoStack.length > 0, redoStack.length > 0);
    }
  }, [undoStack.length, redoStack.length, onUndoRedoAvailabilityChange]);

  // Render canvas with all strokes and texts
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas (ensures transparent layer overlay)
    ctx.clearRect(0, 0, width, height);

    // Draw all completed strokes
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPt = stroke.points[0];
      ctx.moveTo(firstPt.x * width, firstPt.y * height);

      if (stroke.points.length === 1) {
        ctx.lineTo(firstPt.x * width + 0.1, firstPt.y * height + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * width, pt.y * height);
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    // Draw current in-progress stroke if any
    const active = currentStrokeRef.current;
    if (active && active.points && active.points.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = active.color;
      ctx.lineWidth = active.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPt = active.points[0];
      ctx.moveTo(firstPt.x * width, firstPt.y * height);

      for (let i = 1; i < active.points.length; i++) {
        const pt = active.points[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw text annotations
    texts.forEach((item) => {
      ctx.save();
      const fontSize = item.fontSize || 16;
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Measure text for background pill
      const metrics = ctx.measureText(item.text);
      const textX = item.x * width;
      const textY = item.y * height;
      const paddingX = 8;
      const paddingY = 4;
      const pillWidth = metrics.width + paddingX * 2;
      const pillHeight = fontSize + paddingY * 2;

      // Draw rounded background pill for high contrast readability over student handwriting
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;

      // Pill shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      const r = 6;
      ctx.beginPath();
      ctx.roundRect(textX - paddingX, textY - fontSize - paddingY, pillWidth, pillHeight, r);
      ctx.fill();
      ctx.stroke();

      // Reset shadow for crisp text
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, textX, textY - 2);
      ctx.restore();
    });
  }, [strokes, texts]);

  // Handle image load to size the canvas to exact natural geometry
  const handleImageLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Use high-resolution coordinate system matching image natural dimensions
    const naturalWidth = img.naturalWidth || 1200;
    const naturalHeight = img.naturalHeight || 1600;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    redrawCanvas();
  };

  // Re-render whenever strokes or texts change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Listen to Undo trigger from parent toolbar
  useEffect(() => {
    if (undoTrigger > 0 && undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      const newUndo = undoStack.slice(0, -1);

      setRedoStack((r) => [...r, { pageIndex, strokes, texts }]);
      setUndoStack(newUndo);
      setStrokes(prev.strokes);
      setTexts(prev.texts);

      onAnnotationChange(pageIndex, prev);
    }
  }, [undoTrigger]);

  // Listen to Redo trigger from parent toolbar
  useEffect(() => {
    if (redoTrigger > 0 && redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      const newRedo = redoStack.slice(0, -1);

      setUndoStack((u) => [...u, { pageIndex, strokes, texts }]);
      setRedoStack(newRedo);
      setStrokes(next.strokes);
      setTexts(next.texts);

      onAnnotationChange(pageIndex, next);
    }
  }, [redoTrigger]);

  // Listen to Clear All trigger from parent toolbar
  useEffect(() => {
    if (clearTrigger > 0 && (strokes.length > 0 || texts.length > 0)) {
      setUndoStack((u) => [...u, { pageIndex, strokes, texts }]);
      setRedoStack([]);
      setStrokes([]);
      setTexts([]);
      onAnnotationChange(pageIndex, { pageIndex, strokes: [], texts: [] });
    }
  }, [clearTrigger]);

  // Helper: map pointer event to normalized 0-1 coordinates
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): AnnotationPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / rect.width));
    const normY = Math.max(0, Math.min(1, clientY / rect.height));

    return {
      x: Number(normX.toFixed(5)),
      y: Number(normY.toFixed(5)),
    };
  };

  // Helper: check if a point is near a stroke (for vector eraser)
  const isNearStroke = (stroke: AnnotationStroke, pt: AnnotationPoint, tolerance: number = 0.025): boolean => {
    for (const p of stroke.points) {
      const dx = p.x - pt.x;
      const dy = p.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) <= tolerance) {
        return true;
      }
    }
    return false;
  };

  // Pointer Down on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanActive || activeTool === 'pan') return;

    // Capture pointer for smooth stylus/touch/mouse tracking outside element
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const pt = getNormalizedPoint(e);

    if (activeTool === 'pen') {
      isDrawingRef.current = true;
      const stroke: AnnotationStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        points: [pt],
        color,
        thickness,
        tool: 'pen',
      };
      currentStrokeRef.current = stroke;
      redrawCanvas();
    } else if (activeTool === 'eraser') {
      isDrawingRef.current = true;
      eraseAtPoint(pt);
    } else if (activeTool === 'text') {
      // Check if user clicked an existing text to move/drag it (Section 9: movable text)
      const hitIndex = texts.findIndex((t) => {
        return Math.abs(t.x - pt.x) < 0.06 && Math.abs(t.y - pt.y) < 0.035;
      });

      if (hitIndex >= 0) {
        // Start dragging existing text
        draggingTextIndexRef.current = hitIndex;
        prevTextsBeforeDragRef.current = [...texts];
        isDrawingRef.current = true;
      } else {
        // Place inline text box at clicked location
        setActiveTextInput({
          x: pt.x,
          y: pt.y,
          text: '',
        });
      }
    }
  };

  // Erase stroke or text at point
  const eraseAtPoint = (pt: AnnotationPoint) => {
    // 1. Check strokes
    const strokeIndex = strokes.findIndex((s) => isNearStroke(s, pt, 0.03));
    if (strokeIndex >= 0) {
      setUndoStack((prev) => [...prev, { pageIndex, strokes, texts }]);
      setRedoStack([]);

      const updatedStrokes = strokes.filter((_, idx) => idx !== strokeIndex);
      setStrokes(updatedStrokes);
      onAnnotationChange(pageIndex, { pageIndex, strokes: updatedStrokes, texts });
      return;
    }

    // 2. Check texts
    const textIndex = texts.findIndex((t) => {
      return Math.abs(t.x - pt.x) < 0.05 && Math.abs(t.y - pt.y) < 0.03;
    });
    if (textIndex >= 0) {
      setUndoStack((prev) => [...prev, { pageIndex, strokes, texts }]);
      setRedoStack([]);

      const updatedTexts = texts.filter((_, idx) => idx !== textIndex);
      setTexts(updatedTexts);
      onAnnotationChange(pageIndex, { pageIndex, strokes, texts: updatedTexts });
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isPanActive || activeTool === 'pan') return;

    const pt = getNormalizedPoint(e);

    if (activeTool === 'pen' && currentStrokeRef.current) {
      currentStrokeRef.current.points.push(pt);
      redrawCanvas();
    } else if (activeTool === 'eraser') {
      eraseAtPoint(pt);
    } else if (activeTool === 'text' && draggingTextIndexRef.current !== null) {
      const idx = draggingTextIndexRef.current;
      setTexts((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], x: pt.x, y: pt.y };
        return copy;
      });
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (activeTool === 'pen' && currentStrokeRef.current) {
      const finished = currentStrokeRef.current;
      currentStrokeRef.current = null;

      // Save state to undo stack
      setUndoStack((prev) => [...prev, { pageIndex, strokes, texts }]);
      setRedoStack([]);

      const updated = [...strokes, finished];
      setStrokes(updated);
      onAnnotationChange(pageIndex, { pageIndex, strokes: updated, texts });
    } else if (activeTool === 'text' && draggingTextIndexRef.current !== null) {
      // Completed dragging existing text
      setUndoStack((prev) => [...prev, { pageIndex, strokes, texts: prevTextsBeforeDragRef.current }]);
      setRedoStack([]);
      draggingTextIndexRef.current = null;
      onAnnotationChange(pageIndex, { pageIndex, strokes, texts });
    }
  };

  // Submit entered text correction
  const handleConfirmText = (textValue: string) => {
    if (!activeTextInput || !textValue.trim()) {
      setActiveTextInput(null);
      return;
    }

    const newText: AnnotationText = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      x: activeTextInput.x,
      y: activeTextInput.y,
      text: textValue.trim(),
      color,
      fontSize: 16,
    };

    setUndoStack((prev) => [...prev, { pageIndex, strokes, texts }]);
    setRedoStack([]);

    const updatedTexts = [...texts, newText];
    setTexts(updatedTexts);
    onAnnotationChange(pageIndex, { pageIndex, strokes, texts: updatedTexts });
    setActiveTextInput(null);
  };

  // Dragging active input box handlers
  const handleInputDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingInputRef.current = true;
    inputDragOffsetRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleInputDragMove = (e: React.PointerEvent) => {
    if (!isDraggingInputRef.current || !activeTextInput || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - inputDragOffsetRef.current.x) / canvasRect.width;
    const deltaY = (e.clientY - inputDragOffsetRef.current.y) / canvasRect.height;

    inputDragOffsetRef.current = { x: e.clientX, y: e.clientY };

    setActiveTextInput((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        x: Math.max(0.02, Math.min(0.95, prev.x + deltaX)),
        y: Math.max(0.02, Math.min(0.95, prev.y + deltaY)),
      };
    });
  };

  const handleInputDragEnd = (e: React.PointerEvent) => {
    isDraggingInputRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none overflow-visible shadow-2xl rounded-lg"
      style={{ touchAction: activeTool === 'pan' || isPanActive ? 'auto' : 'none' }}
    >
      {/* 1. ORIGINAL SUBMITTED ASSIGNMENT IMAGE (Never modified or overwritten) */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={`Submitted Assignment Page ${pageIndex + 1}`}
        onLoad={handleImageLoad}
        className="block max-h-[calc(100vh-170px)] w-auto max-w-full object-contain rounded-lg border border-slate-800 bg-white pointer-events-none select-none shadow-2xl"
        draggable={false}
      />

      {/* 2. TRANSPARENT TEACHER ANNOTATION CANVAS LAYER */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 w-full h-full rounded-lg ${
          activeTool === 'pen'
            ? 'cursor-crosshair'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : activeTool === 'text'
            ? 'cursor-text'
            : 'cursor-grab'
        }`}
        style={{
          pointerEvents: isPanActive ? 'none' : 'auto',
          touchAction: isPanActive ? 'pan-x pan-y' : 'none',
        }}
      />

      {/* 3. FLOATING INLINE TEXT TOOL INPUT BOX (Movable before saving) */}
      {activeTextInput && (
        <div
          className="absolute z-30 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-xs space-y-2 w-68 animate-in zoom-in-95 duration-100 backdrop-blur-md"
          style={{
            left: `${Math.min(activeTextInput.x * 100, 75)}%`,
            top: `${Math.min(activeTextInput.y * 100, 85)}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Draggable Header */}
          <div
            className="flex items-center justify-between text-[11px] font-bold text-slate-300 cursor-move pb-1 border-b border-slate-800/80 select-none"
            onPointerDown={handleInputDragStart}
            onPointerMove={handleInputDragMove}
            onPointerUp={handleInputDragEnd}
            title="Drag to reposition note before saving"
          >
            <div className="flex items-center gap-1 text-slate-400">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span className="text-slate-200">Add Correction Note</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTextInput(null)}
              className="text-slate-500 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            autoFocus
            value={activeTextInput.text}
            onChange={(e) =>
              setActiveTextInput({ ...activeTextInput, text: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmText(activeTextInput.text);
              } else if (e.key === 'Escape') {
                setActiveTextInput(null);
              }
            }}
            placeholder="Type comment (e.g. Good, Check step 2)"
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-xs outline-none focus:border-blue-500 placeholder:text-slate-500"
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
            {['Wrong answer', 'Good', 'Correct this step', 'Missing explanation'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleConfirmText(preset)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setActiveTextInput(null)}
              className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleConfirmText(activeTextInput.text)}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
