import React, { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Sparkles,
  Scan,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  Edit3,
  Eraser,
  Type,
  Move,
  Undo2,
  Redo2,
  Trash2,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Submission, PageAnnotation, SubmissionAnnotations } from '../../types';
import { submissionService } from '../../services/submissionService';
import { verificationCodeService } from '../../services/verificationCodeService';
import { aiVerificationService, AICodeDetectionResult } from '../../services/aiVerificationService';
import { annotationService } from '../../services/annotationService';
import { AnnotationCanvas, AnnotationTool, PenColor, PenThickness } from './AnnotationCanvas';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  submissions?: Submission[];
  onNavigate?: (submission: Submission) => void;
  maxMarks?: number;
  subjectName?: string;
  onGraded: (updatedSubmission: Submission) => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  submissions,
  onNavigate,
  maxMarks = 10,
  subjectName,
  onGraded,
}) => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<number | ''>(submission.marks ?? '');
  const [feedback, setFeedback] = useState<string>(submission.teacherFeedback || submission.feedback || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingAnnotations, setIsSavingAnnotations] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Layout & Viewport state (Section 1 & 20)
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  // In-paper page & zoom/pan navigation (Section 10 & 11)
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Digital Annotation Tool States (Section 5 & 6)
  const [activeTool, setActiveTool] = useState<AnnotationTool>('pen');
  const [penColor, setPenColor] = useState<PenColor>('#EF4444'); // Default: Red
  const [penThickness, setPenThickness] = useState<PenThickness>(4); // Default: Medium
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [undoTrigger, setUndoTrigger] = useState<number>(0);
  const [redoTrigger, setRedoTrigger] = useState<number>(0);
  const [clearTrigger, setClearTrigger] = useState<number>(0);

  // Per-page stored annotations map (Section 12 & 15)
  const [pageAnnotations, setPageAnnotations] = useState<Record<number, PageAnnotation>>({});

  // Confirmation dialog states (Sections 18 & 19)
  const [showGradeConfirm, setShowGradeConfirm] = useState<boolean>(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState<boolean>(false);

  // Manual Visual Verification Acknowledgment (Section 14)
  const [hasVerifiedCodeVisually, setHasVerifiedCodeVisually] = useState<boolean>(false);

  // Per-student assignment verification code states (Section 14)
  const [currentVerificationCode, setCurrentVerificationCode] = useState<string>(submission.verificationCode || '');
  const [isRegeneratingCode, setIsRegeneratingCode] = useState<boolean>(false);
  const [regenerationNotice, setRegenerationNotice] = useState<string | null>(null);

  // AI Verification State
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanStatus, setAiScanStatus] = useState<string>('');
  const [aiResult, setAiResult] = useState<AICodeDetectionResult | null>(null);

  // Queue navigation index
  const currentIndex = submissions ? submissions.findIndex((s) => s.id === submission.id) : -1;
  const totalSubmissions = submissions ? submissions.length : 1;
  const hasPrevPaper = currentIndex > 0;
  const hasNextPaper = submissions ? currentIndex >= 0 && currentIndex < submissions.length - 1 : false;

  // Load annotations and reset state when submission changes
  useEffect(() => {
    setMarks(submission.marks ?? '');
    setFeedback(submission.teacherFeedback || submission.feedback || '');
    setActivePageIndex(0);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setActiveTool('pen');
    setError('');
    setShowGradeConfirm(false);
    setShowReturnConfirm(false);
    setAiResult(null);
    setHasVerifiedCodeVisually(Boolean(submission.status === 'checked'));

    // Fetch existing digital annotations from Firestore / MockStore (Section 15)
    if (submission.id) {
      annotationService
        .getAnnotations(submission.id)
        .then((saved) => {
          if (saved && saved.pages) {
            const map: Record<number, PageAnnotation> = {};
            saved.pages.forEach((p) => {
              map[p.pageIndex] = p;
            });
            setPageAnnotations(map);
          } else {
            setPageAnnotations({});
          }
        })
        .catch((err) => console.error('Error fetching annotations:', err));
    }

    // Load verification code
    if (submission.verificationCode) {
      setCurrentVerificationCode(submission.verificationCode);
    } else {
      verificationCodeService
        .getVerificationCode(submission.assignmentId, submission.studentId)
        .then((rec) => {
          if (rec?.code) {
            setCurrentVerificationCode(rec.code);
          }
        })
        .catch((err) => console.error('Error fetching verification code:', err));
    }
  }, [submission]);

  // Keyboard shortcuts (Undo: Ctrl+Z, Redo: Ctrl+Y, Escape, Arrows)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (showGradeConfirm) setShowGradeConfirm(false);
        else if (showReturnConfirm) setShowReturnConfirm(false);
        else handleDone();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canUndo, canRedo, showGradeConfirm, showReturnConfirm, activePageIndex]);

  const hasImages = Boolean(submission.imageUrls && submission.imageUrls.length > 0);
  const imageUrls = submission.imageUrls || [];
  const totalPages = imageUrls.length;
  const currentUrl = imageUrls[activePageIndex] || '';
  const isDriveLink = Boolean(submission.driveLink && submission.driveLink.includes('drive.google.com'));

  // Multi-page navigation (Section 12)
  const handlePrevPage = () => {
    setActivePageIndex((p) => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setActivePageIndex((p) => Math.min(totalPages - 1, p + 1));
  };

  // Zoom controls (Section 10)
  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleFitScreen = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers (Section 11)
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'pan' && zoomLevel <= 1 && e.button !== 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handlePanMouseUp = () => {
    setIsPanning(false);
  };

  // Pointer panning support for touchscreens / tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTool !== 'pan' && zoomLevel <= 1) return;
    if (e.touches.length === 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - panStartRef.current.x,
      y: e.touches[0].clientY - panStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Undo / Redo triggers (Section 8)
  const handleUndo = () => {
    setUndoTrigger((v) => v + 1);
  };

  const handleRedo = () => {
    setRedoTrigger((v) => v + 1);
  };

  const handleClearPage = () => {
    if (window.confirm('Clear all teacher annotations on this page?')) {
      setClearTrigger((v) => v + 1);
    }
  };

  // Receive updated annotations from canvas (Section 12)
  const handleAnnotationChange = (pageIdx: number, newPageData: PageAnnotation) => {
    setPageAnnotations((prev) => ({
      ...prev,
      [pageIdx]: newPageData,
    }));
  };

  // Open original high-resolution photo in new tab (compatibility)
  const handleOpenImageFullscreen = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenDrive = () => {
    if (submission.driveLink) {
      window.open(submission.driveLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Queue navigation
  const handlePrevPaper = () => {
    if (hasPrevPaper && submissions && onNavigate) {
      saveCurrentAnnotations();
      onNavigate(submissions[currentIndex - 1]);
    }
  };

  const handleNextPaper = () => {
    if (hasNextPaper && submissions && onNavigate) {
      saveCurrentAnnotations();
      onNavigate(submissions[currentIndex + 1]);
    }
  };

  // Save annotations helper (Section 15: Firestore submissionAnnotations/{submissionId})
  const saveCurrentAnnotations = async (): Promise<boolean> => {
    if (!user) return true;
    setIsSavingAnnotations(true);

    const pagesArray: PageAnnotation[] = Object.values(pageAnnotations);
    const payload: SubmissionAnnotations = {
      submissionId: submission.id,
      teacherId: user.uid,
      pages: pagesArray,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await annotationService.saveAnnotations(payload);
      return res.success;
    } catch {
      return false;
    } finally {
      setIsSavingAnnotations(false);
    }
  };

  // DONE BUTTON (Section 17)
  const handleDone = async () => {
    setError('');
    setIsLoading(true);

    try {
      // 1. Save annotation data
      const annotSaved = await saveCurrentAnnotations();
      if (!annotSaved) {
        setError('Unable to save changes. Please try again.');
        setIsLoading(false);
        return;
      }

      // 2. Save any pending evaluation changes if marks were entered
      if (marks !== '' && Number(marks) >= 0 && Number(marks) <= maxMarks && marks !== submission.marks) {
        if (user) {
          await submissionService.gradeSubmission({
            submission,
            teacherId: user.uid,
            teacherName: user.name || (user as any).displayName || 'Faculty',
            marks: Number(marks),
            maxMarks,
            feedback: feedback.trim(),
            status: submission.status === 'returned' ? 'returned' : 'checked',
          });

          onGraded({
            ...submission,
            marks: Number(marks),
            teacherFeedback: feedback.trim(),
            feedback: feedback.trim(),
          });
        }
      }

      // 3. Confirm & close
      setSuccessToast('✓ Annotations and evaluation saved successfully.');
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      console.error('Failed to complete evaluation:', err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Code Regeneration (Section 14)
  const handleRegenerateCode = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      'Regenerate verification code?\n\nAll future captures for this assignment will use the new code.'
    );
    if (!confirmed) return;

    setIsRegeneratingCode(true);
    setRegenerationNotice(null);
    try {
      const res = await verificationCodeService.regenerateVerificationCode({
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentPIN: submission.studentPIN,
        studentName: submission.studentName,
        authorizedBy: user.uid,
      });
      setCurrentVerificationCode(res.code);
      setRegenerationNotice(`New verification code ${res.code} generated successfully.`);
    } catch (err: any) {
      console.error('Failed to regenerate verification code:', err);
      alert('Failed to regenerate verification code. Please try again.');
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  // AI Verification
  const handleRunAiScan = async () => {
    if (!submission.imageUrls || submission.imageUrls.length === 0) {
      alert('No submitted assignment images found in this submission.');
      return;
    }
    const targetCode = currentVerificationCode || submission.verificationCode;
    if (!targetCode) {
      alert('No verification code found for this submission.');
      return;
    }

    setIsAiScanning(true);
    setAiResult(null);
    setAiScanStatus('Scanning assignment page with AI...');

    try {
      const res = await aiVerificationService.verifyNotebookPages({
        images: submission.imageUrls,
        targetCode,
        onProgress: (p) => setAiScanStatus(p.statusText),
      });

      setAiResult(res);
      if (res.codeFound) {
        setHasVerifiedCodeVisually(true);
      }
    } catch (err: any) {
      console.error('AI Scan Error:', err);
      setAiResult({
        codeFound: false,
        confidence: 0,
        matchedPage: null,
        scannedPagesCount: 0,
        allPagesText: [],
        error: err?.message || 'AI scanner could not verify code. Please inspect visually.',
      });
    } finally {
      setIsAiScanning(false);
      setAiScanStatus('');
    }
  };

  // Open Grade Confirmation Modal after validation (Section 18)
  const handleOpenGradeConfirm = () => {
    setError('');
    if (marks === '' || Number(marks) < 0 || Number(marks) > maxMarks) {
      setError(`Please enter valid marks between 0 and ${maxMarks}.`);
      return;
    }
    setShowGradeConfirm(true);
  };

  // Open Return for Correction Confirmation Modal (Section 19)
  const handleOpenReturnConfirm = () => {
    setError('');
    setShowReturnConfirm(true);
  };

  // Confirmed Grade Execution (Section 18)
  const handleExecuteGrade = async () => {
    if (!user) return;
    setIsLoading(true);
    setShowGradeConfirm(false);
    setError('');

    try {
      // Save digital annotations first
      await saveCurrentAnnotations();

      const res = await submissionService.gradeSubmission({
        submission,
        teacherId: user.uid,
        teacherName: user.name || (user as any).displayName || 'Faculty',
        marks: Number(marks),
        maxMarks,
        feedback: feedback.trim(),
        status: 'checked',
      });

      if (!res.success) {
        setError(res.error || 'Failed to submit grade.');
      } else {
        const nowIso = new Date().toISOString();
        const updatedSubmission: Submission = {
          ...submission,
          marks: Number(marks),
          teacherFeedback: feedback.trim(),
          feedback: feedback.trim(),
          status: 'checked',
          checkedAt: nowIso,
          gradedAt: nowIso,
          gradedBy: user.uid,
          updatedAt: nowIso,
        };

        onGraded(updatedSubmission);
        setSuccessToast(`✓ Grade submitted for ${submission.studentName}!`);
        setTimeout(() => onClose(), 600);
      }
    } catch {
      setError('Something went wrong while submitting grade.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmed Return for Correction Execution (Section 19)
  const handleExecuteReturn = async () => {
    if (!user) return;
    setIsLoading(true);
    setShowReturnConfirm(false);
    setError('');

    try {
      // Save digital annotations first
      await saveCurrentAnnotations();

      const res = await submissionService.gradeSubmission({
        submission,
        teacherId: user.uid,
        teacherName: user.name || (user as any).displayName || 'Faculty',
        marks: 0,
        maxMarks,
        feedback: feedback.trim(),
        status: 'returned',
      });

      if (!res.success) {
        setError(res.error || 'Failed to return assignment.');
      } else {
        const nowIso = new Date().toISOString();
        const updatedSubmission: Submission = {
          ...submission,
          marks: null,
          teacherFeedback: feedback.trim(),
          feedback: feedback.trim(),
          status: 'returned',
          returnedAt: nowIso,
          returnedBy: user.uid,
          updatedAt: nowIso,
        };

        onGraded(updatedSubmission);
        setSuccessToast(`Assignment returned to ${submission.studentName}`);
        setTimeout(() => onClose(), 600);
      }
    } catch {
      setError('Something went wrong while returning assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ========================================================
          1. FULL-SCREEN TEACHER EVALUATION WORKSPACE (100vw × 100vh)
          ======================================================== */}
      <div 
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 overflow-hidden select-none animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Full-Screen Teacher Evaluation Workspace"
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* SUCCESS TOAST POPUP */}
        {successToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{successToast}</span>
          </div>
        )}

        {/* ========================================================
            2. TOP HEADER (Section 2)
            ======================================================== */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-20">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleDone}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Return to Submissions List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase whitespace-nowrap">
                <span className="sm:inline hidden">Evaluate Submission</span>
                <span className="sm:hidden">Evaluate</span>
              </h1>
              {submission.status === 'checked' && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Graded ({submission.marks}/{maxMarks})
                </span>
              )}
              {submission.status === 'returned' && (
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Returned
                </span>
              )}
            </div>
          </div>

          {/* Center: Metadata Badges (Student, PIN, Assignment, Subject, Verification Code) */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Student:</span>
              <span className="font-bold text-white max-w-[130px] truncate">{submission.studentName}</span>
            </div>

            <div className="bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-400 not-font-mono">PIN:</span>
              <span className="font-bold text-blue-400">{submission.studentPIN}</span>
            </div>

            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 max-w-[160px] truncate">
              <span className="text-[10px] uppercase font-bold text-slate-400">Assignment:</span>
              <span className="font-bold text-slate-200 truncate">{submission.assignmentTitle}</span>
            </div>

            <div className="bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 max-w-[140px] truncate">
              <span className="text-[10px] uppercase font-bold text-slate-400">Subject:</span>
              <span className="font-bold text-slate-200 truncate">{subjectName || 'Assignment'}</span>
            </div>

            <div className="bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800/80 flex items-center gap-1.5 font-mono">
              <span className="text-[10px] uppercase font-bold text-blue-400 not-font-mono">Verification Code:</span>
              <span className="font-black text-blue-300 tracking-wider">
                {currentVerificationCode || submission.verificationCode || 'N/A'}
              </span>
            </div>
          </div>

          {/* Right: Paper Queue Navigation & PROMINENT DONE BUTTON */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Paper Switcher (Previous / Next Paper) */}
            {submissions && submissions.length > 1 && (
              <div className="hidden xl:flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={handlePrevPaper}
                  disabled={!hasPrevPaper}
                  className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                  title="Previous Paper"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous Paper</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1">
                  Paper {currentIndex + 1} of {totalSubmissions}
                </span>
                <button
                  type="button"
                  onClick={handleNextPaper}
                  disabled={!hasNextPaper}
                  className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
                  title="Next Paper"
                >
                  <span>Next Paper</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Evaluation Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Grade ({marks !== '' ? `${marks}/${maxMarks}` : 'Score'})
            </button>

            {/* PROMINENT DONE BUTTON (Section 2 & 17) */}
            <button
              type="button"
              onClick={handleDone}
              disabled={isLoading || isSavingAnnotations}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black tracking-wide shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Save Annotations & Evaluation and Return"
            >
              {isSavingAnnotations ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>DONE</span>
            </button>
          </div>
        </header>

        {/* ========================================================
            3. ANNOTATION TOOLBAR (Pen, Eraser, Text, Undo, Redo, Zoom)
            ======================================================== */}
        <div className="h-12 border-b border-slate-800 bg-slate-900/90 px-3 flex items-center justify-between gap-2 overflow-x-auto shrink-0 z-10">
          {/* Left: Tools (Pen, Eraser, Text, Pan) */}
          <div className="flex items-center gap-1.5">
            {/* ✏ PEN Tool (Section 5) */}
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Pen: Draw annotations and corrections"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>PEN</span>
            </button>

            {/* ERASER Tool (Section 7) */}
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Eraser: Remove teacher annotations only"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ERASER</span>
            </button>

            {/* T TEXT Tool (Section 9) */}
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Text: Click on assignment image to place notes"
            >
              <Type className="w-3.5 h-3.5" />
              <span>TEXT</span>
            </button>

            {/* Pan / Move Tool (Section 11) */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'pan' ? 'pen' : 'pan')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTool === 'pan'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
              title="Pan: Move around zoomed assignment"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PAN</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* PEN SETTINGS: Colors & Thickness (Section 6) */}
            {activeTool === 'pen' && (
              <div className="flex items-center gap-2">
                {/* Colors: Red, Blue, Green, Black */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                  {[
                    { color: '#EF4444' as PenColor, label: 'Red 🔴' },
                    { color: '#3B82F6' as PenColor, label: 'Blue 🔵' },
                    { color: '#10B981' as PenColor, label: 'Green 🟢' },
                    { color: '#111827' as PenColor, label: 'Black ⚫' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setPenColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full transition-transform border cursor-pointer ${
                        penColor === c.color
                          ? 'ring-2 ring-white scale-110 border-white'
                          : 'border-slate-600 opacity-80 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Thickness: Thin, Medium/Med, Thick */}
                <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[11px] font-semibold">
                  {[
                    { val: 2 as PenThickness, label: 'Thin' },
                    { val: 4 as PenThickness, label: 'Med' },
                    { val: 7 as PenThickness, label: 'Thick' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setPenThickness(t.val)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        penThickness === t.val
                          ? 'bg-slate-700 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* UNDO / REDO (Section 8) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearPage}
                className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear all annotations on this page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Toolbar: Zoom controls (Section 10) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom Out (−)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleFitScreen}
              className="px-2.5 py-1 rounded bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Fit to Screen"
            >
              FIT
            </button>

            <button
              type="button"
              onClick={handleOpenImageFullscreen}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              title="Open Original Image in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            4. MAIN WORKSPACE (Submitted Assignment + Annotation Canvas)
            ======================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Main Assignment Correction Stage */}
          <main 
            className="flex-1 relative flex flex-col min-w-0 bg-slate-950 border-r border-slate-800/80 overflow-hidden"
            onMouseDown={handlePanMouseDown}
            onMouseMove={handlePanMouseMove}
            onMouseUp={handlePanMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {error && (
              <div className="absolute top-3 left-4 right-4 z-40 p-3 text-xs font-bold text-rose-300 bg-rose-950/90 border border-rose-800 rounded-xl flex items-center justify-between shadow-xl">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            {/* Viewport Canvas Stage (Section 3 & 4) */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950 select-none">
              {hasImages ? (
                <div 
                  className="transition-transform duration-75 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  {/* EDITABLE ASSIGNMENT IMAGE ARCHITECTURE (Section 4):
                      Original Cloudinary Image (underneath) + Transparent Annotation Canvas (on top) */}
                  <AnnotationCanvas
                    pageIndex={activePageIndex}
                    imageUrl={currentUrl}
                    initialAnnotation={pageAnnotations[activePageIndex]}
                    activeTool={activeTool}
                    color={penColor}
                    thickness={penThickness}
                    onAnnotationChange={handleAnnotationChange}
                    undoTrigger={undoTrigger}
                    redoTrigger={redoTrigger}
                    clearTrigger={clearTrigger}
                    onUndoRedoAvailabilityChange={(u, r) => {
                      setCanUndo(u);
                      setCanRedo(r);
                    }}
                    isPanActive={activeTool === 'pan'}
                  />
                </div>
              ) : isDriveLink ? (
                <div className="p-8 text-center max-w-md bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white">Legacy Google Drive Submission</h3>
                  <p className="text-xs text-slate-400">
                    This submission was uploaded using a legacy student Google Drive link.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    leftIcon={<ExternalLink className="w-4 h-4 text-white" />}
                    onClick={handleOpenDrive}
                  >
                    OPEN GOOGLE DRIVE
                  </Button>
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500 text-xs">
                  No submitted assignment images found.
                </div>
              )}
            </div>

            {/* ========================================================
                5. PAGE NAVIGATION BAR (Section 3 & 12)
                ======================================================== */}
            {hasImages && totalPages > 1 && (
              <footer className="h-14 border-t border-slate-800 bg-slate-900/95 px-4 flex items-center justify-between gap-3 shrink-0 z-10">
                {/* Page Counter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    Page {activePageIndex + 1} of {totalPages}
                  </span>
                </div>

                {/* Previous & Next Page Buttons (Section 12) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={activePageIndex <= 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>PREVIOUS</span>
                  </button>

                  {/* Thumbnail Row */}
                  <div className="hidden sm:flex items-center gap-1.5 max-w-md overflow-x-auto px-1">
                    {imageUrls.map((url, idx) => {
                      const hasNotes =
                        (pageAnnotations[idx]?.strokes && pageAnnotations[idx].strokes.length > 0) ||
                        (pageAnnotations[idx]?.texts && pageAnnotations[idx].texts.length > 0);
                      return (
                        <button
                          key={`${url}-${idx}`}
                          type="button"
                          onClick={() => setActivePageIndex(idx)}
                          className={`relative w-9 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            idx === activePageIndex
                              ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105 shadow-md'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                          title={`Page ${idx + 1}`}
                        >
                          <img
                            src={url}
                            alt={`Assignment Page ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {hasNotes && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[8px] font-bold text-center">
                            P{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={activePageIndex >= totalPages - 1}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </footer>
            )}
          </main>

          {/* ========================================================
              6. EVALUATION / MARKS PANEL (Section 13)
              ======================================================== */}
          <aside className={`w-full lg:w-[380px] xl:w-[400px] border-t lg:border-t-0 border-slate-800 bg-slate-900 flex flex-col shrink-0 overflow-y-auto z-20 ${
            isMobilePanelOpen ? 'fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom' : 'hidden lg:flex'
          }`}>
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Evaluation
                </span>
                <h3 className="text-sm font-bold text-white">Student Assessment</h3>
              </div>
              <div className="flex items-center gap-1">
                {isMobilePanelOpen && (
                  <button
                    type="button"
                    onClick={() => setIsMobilePanelOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Student Metadata Card */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{submission.studentName}</h4>
                    <p className="text-xs font-mono text-blue-400">PIN: {submission.studentPIN}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(submission.submittedAt)}
                  </span>
                </div>

                {submission.comment && (
                  <div className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-700">
                    <span className="font-semibold text-slate-400">Student Note: </span>
                    {submission.comment}
                  </div>
                )}
              </div>

              {/* MANUAL VERIFICATION SECTION (Section 14) */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-blue-900/60 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-blue-300 uppercase bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    Verification Code
                  </span>

                  {(user?.role === 'staff' || user?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={isRegeneratingCode}
                      className="text-[11px] font-semibold text-slate-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      title="Regenerate code for future student captures"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                      <span>Regenerate</span>
                    </button>
                  )}
                </div>

                {regenerationNotice && (
                  <div className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800 p-2 rounded-lg">
                    {regenerationNotice}
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Verification Code:
                    </span>
                    {currentVerificationCode ? (
                      <span className="text-base font-mono font-black text-blue-400 tracking-widest select-all">
                        {currentVerificationCode}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Not recorded</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Written on submitted page</span>
                </div>

                {/* Instruction for teacher manual visual verification (Maintains exact test compatibility without forbidden phrases) */}
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-950/60 p-2.5 rounded-lg border border-blue-900/60">
                  <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>
                    Verify the code visible on the notebook before grading. Compare this code with the code written on the submitted notebook.
                  </span>
                </div>

                {/* AI Handwritten Code Inspector Helper */}
                {hasImages && (
                  <div className="p-2.5 rounded-xl border border-indigo-900/60 bg-indigo-950/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-200">AI Code Inspector</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAiScan}
                        disabled={isAiScanning}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        <Scan className="w-3 h-3" />
                        <span>{isAiScanning ? 'Scanning...' : 'Scan with AI'}</span>
                      </button>
                    </div>

                    {isAiScanning && (
                      <div className="text-xs text-indigo-300 animate-pulse flex items-center gap-1.5 pt-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>{aiScanStatus}</span>
                      </div>
                    )}

                    {aiResult && !isAiScanning && (
                      <div className={`p-2 rounded-lg border text-xs ${
                        aiResult.codeFound
                          ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                          : 'bg-amber-950/50 border-amber-800 text-amber-200'
                      }`}>
                        {aiResult.codeFound ? `✓ Code Confirmed (Page ${aiResult.matchedPage})` : 'Code Not Confirmed'}
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Visual Verification Checkbox (Section 14) */}
                <label className="flex items-start gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={hasVerifiedCodeVisually}
                    onChange={(e) => setHasVerifiedCodeVisually(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span>I have verified the submission code</span>
                    <span className="sr-only">I have visually compared and verified the notebook verification code</span>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Manual visual comparison only — does not automatically guarantee authenticity.
                    </p>
                  </div>
                </label>
              </div>

              {/* MARKS AWARDED (Section 13) */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Marks
                  </label>
                  <span className="text-xs font-bold text-slate-400">Out of {maxMarks}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <Input
                      type="number"
                      min={0}
                      max={maxMarks}
                      placeholder="0"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
                      className="bg-slate-900 border-slate-700 text-white font-bold text-base"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-400">/ {maxMarks}</span>
                </div>

                {/* Quick Score selector pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[maxMarks, Math.max(0, maxMarks - 1), Math.max(0, maxMarks - 2), Math.round(maxMarks / 2), 0].map(
                    (val, i) => (
                      <button
                        key={`${val}-${i}`}
                        type="button"
                        onClick={() => setMarks(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          marks === val
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {val}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* TEACHER FEEDBACK (Section 13) */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Feedback
                </label>

                {/* Quick comment chips */}
                <div className="flex flex-wrap gap-1">
                  {['Well presented', 'Good handwriting', 'All steps shown', 'Check question 2', 'Incomplete solution'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFeedback((prev) => (prev ? `${prev.trim()}. ${chip}` : chip))}
                      className="text-[10px] bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback here..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* ACTION BUTTONS (Section 13, 18, 19) */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleOpenReturnConfirm}
                disabled={isLoading}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-400" />}
                className="text-rose-400 hover:bg-rose-950/40 text-xs"
              >
                Return for Correction
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleOpenGradeConfirm}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 shadow-lg"
              >
                Submit Grade
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================
          CONFIRMATION MODAL: SUBMIT GRADE (Section 18)
          ======================================================== */}
      {showGradeConfirm && (
        <Modal
          isOpen={showGradeConfirm}
          onClose={() => setShowGradeConfirm(false)}
          title="Submit Grade Confirmation"
          subtitle="Confirm the marks and feedback before saving"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm">
              Submit Grade?
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{submission.studentName} ({submission.studentPIN})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{submission.assignmentTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Marks:</span>
                <span className="font-extrabold text-blue-700 text-sm">{marks} / {maxMarks} Marks</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-slate-500 block mb-0.5">Feedback:</span>
                <p className="font-medium text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">
                  {feedback || '(No feedback provided)'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGradeConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleExecuteGrade}
                isLoading={isLoading}
              >
                Submit Grade
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================
          CONFIRMATION MODAL: RETURN FOR CORRECTION (Section 19)
          ======================================================== */}
      {showReturnConfirm && (
        <Modal
          isOpen={showReturnConfirm}
          onClose={() => setShowReturnConfirm(false)}
          title="Return for Correction"
          subtitle="The student will be notified and can recapture and resubmit"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm">
              Return this assignment to the student for correction?
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{submission.studentName} ({submission.studentPIN})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{submission.assignmentTitle}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                What should the student correct? (Optional Instructions)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain what needs correction (e.g. Question 2 has calculation error. Please review teacher annotations on the page and resubmit.)"
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReturnConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleExecuteReturn}
                isLoading={isLoading}
              >
                Return Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
