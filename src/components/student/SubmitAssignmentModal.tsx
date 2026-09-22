import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Send, 
  AlertCircle, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  RefreshCw,
  UploadCloud,
  FileCheck2,
  Sparkles,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Assignment, Submission, SubmissionImageMetadata } from '../../types';
import { submissionService } from '../../services/submissionService';
import { cloudinaryService, CloudinaryUploadError } from '../../services/cloudinary';
import { captureAndCompressFromVideo, CompressedImageResult } from '../../utils/imageCompressor';
import { verificationCodeService } from '../../services/verificationCodeService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface CapturedPage {
  id: string;
  blob: Blob;
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  existingSubmission?: Submission | null;
  onSubmitted: (submission: Submission) => void;
}

type ModalView = 'verification_code' | 'camera' | 'page_preview' | 'review' | 'uploading' | 'success';

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  existingSubmission,
  onSubmitted,
}) => {
  const { studentUser } = useAuth();

  // Verification code states
  const [view, setView] = useState<ModalView>('verification_code');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [codeCreatedAt, setCodeCreatedAt] = useState<string>('');
  const [isCodeLoading, setIsCodeLoading] = useState<boolean>(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  // State management
  const [capturedPages, setCapturedPages] = useState<CapturedPage[]>([]);
  const [currentPendingPage, setCurrentPendingPage] = useState<CapturedPage | null>(null);
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [comment, setComment] = useState<string>(existingSubmission?.comment || '');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [createdSubmission, setCreatedSubmission] = useState<Submission | null>(null);

  // Camera stream & hardware states
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Uploading state
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number }>({
    current: 0,
    total: 0,
    percent: 0,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Video element and media stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Gracefully stop any active hardware camera stream
   */
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /**
   * Start camera stream requesting rear-facing camera on mobile devices
   */
  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);

    // Check MediaDevices API support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setCameraError(
        'Camera access is not supported in this browser or requires a secure HTTPS connection. Please open SAM in a modern browser (Chrome, Edge, Safari) with camera permissions enabled.'
      );
      return;
    }

    setIsCameraStarting(true);
    try {
      // First attempt with environment (rear) camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (envError) {
        // Fallback to any available video stream (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission is required to capture your assignment.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError(
          'Your camera is currently in use by another application or browser tab. Please close other camera apps and retry.'
        );
      } else {
        setCameraError(err.message || 'Unable to access camera. Please check your camera settings.');
      }
    } finally {
      setIsCameraStarting(false);
    }
  }, [facingMode, stopCameraStream]);

  // Fetch or generate authoritative verification code on modal open
  const fetchOrCreateCode = useCallback(async () => {
    if (!studentUser) return;
    setIsCodeLoading(true);
    setCodeError(null);

    try {
      const res = await verificationCodeService.getOrCreateVerificationCode({
        assignmentId: assignment.id,
        studentId: studentUser.uid,
        studentPIN: studentUser.pin,
        studentName: studentUser.name,
      });
      setVerificationCode(res.code);
      setCodeCreatedAt(res.createdAt);
    } catch (err: any) {
      console.error('Error in fetchOrCreateCode:', err);
      setCodeError('Unable to generate or retrieve verification code. Please check your network and retry.');
    } finally {
      setIsCodeLoading(false);
    }
  }, [assignment.id, studentUser]);

  // When modal opens/closes or view changes to/from camera
  useEffect(() => {
    if (isOpen) {
      // Start in verification_code view if no captured pages are pending
      if (capturedPages.length === 0 && !currentPendingPage) {
        setView('verification_code');
      }
      fetchOrCreateCode();
    }
  }, [isOpen, fetchOrCreateCode]);

  useEffect(() => {
    if (isOpen && view === 'camera') {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, view, startCameraStream, stopCameraStream]);

  // Reset state on modal close
  const handleModalClose = () => {
    stopCameraStream();
    onClose();
  };

  /**
   * Capture current frame from camera and compress to ~150 KB with watermark
   */
  const handleCaptureFrame = async () => {
    if (!videoRef.current || isCameraStarting) return;

    try {
      const compressed: CompressedImageResult = await captureAndCompressFromVideo(
        videoRef.current,
        {
          studentName: studentUser?.name,
          studentPIN: studentUser?.pin,
          verificationCode: verificationCode || undefined,
        }
      );
      const newPage: CapturedPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        blob: compressed.blob,
        dataUrl: compressed.dataUrl,
        sizeKb: compressed.sizeKb,
        width: compressed.width,
        height: compressed.height,
      };

      setCurrentPendingPage(newPage);
      stopCameraStream();
      setView('page_preview');
    } catch (err: any) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please hold steady and try again.');
    }
  };

  /**
   * Discard pending photo and return to camera
   */
  const handleRetake = () => {
    setCurrentPendingPage(null);
    setView('camera');
  };

  /**
   * Accept pending photo and continue capturing next page
   */
  const handleAcceptAndNextPage = () => {
    if (!currentPendingPage) return;
    setCapturedPages((prev) => [...prev, currentPendingPage]);
    setCurrentPendingPage(null);
    setView('camera');
  };

  /**
   * Accept pending photo and go to final review screen
   */
  const handleAcceptAndFinish = () => {
    if (!currentPendingPage) return;
    const updated = [...capturedPages, currentPendingPage];
    setCapturedPages(updated);
    setCurrentPendingPage(null);
    setActiveReviewIndex(updated.length - 1);
    setView('review');
  };

  /**
   * Delete a page from the captured list
   */
  const handleDeletePage = (indexToDelete: number) => {
    const updated = capturedPages.filter((_, idx) => idx !== indexToDelete);
    setCapturedPages(updated);
    if (updated.length === 0) {
      setView('camera');
    } else {
      setActiveReviewIndex(Math.max(0, indexToDelete - 1));
    }
  };

  /**
   * Switch between front and rear camera
   */
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  /**
   * Final submission: Upload all pages to Cloudinary, then save to Firestore
   */
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUser) return;
    if (capturedPages.length === 0) {
      setCameraError('Please capture at least one notebook page.');
      setView('camera');
      return;
    }

    if (!isConfirmed) {
      setUploadError('Please check the confirmation box before submitting.');
      return;
    }

    setUploadError(null);
    setView('uploading');

    const totalPages = capturedPages.length;
    const uploadedUrls: string[] = [];
    const uploadedMetadata: SubmissionImageMetadata[] = [];

    try {
      // Upload each page sequentially to Cloudinary under sam/assignments
      for (let i = 0; i < totalPages; i++) {
        const page = capturedPages[i];
        setUploadProgress({
          current: i + 1,
          total: totalPages,
          percent: 0,
        });

        const uploadResult = await cloudinaryService.uploadImage(page.blob, {
          folder: 'sam/assignments',
          fileName: `asg_${assignment.id}_pin_${studentUser.pin}_p${i + 1}_${Date.now()}.jpg`,
          onProgress: (pct) => {
            setUploadProgress({
              current: i + 1,
              total: totalPages,
              percent: pct,
            });
          },
        });

        uploadedUrls.push(uploadResult.secure_url);
        uploadedMetadata.push({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          bytes: uploadResult.bytes,
          format: uploadResult.format,
        });
      }

      // Save to Firestore with Cloudinary secure URLs, metadata, and verification code
      const res = await submissionService.submitAssignment({
        assignment,
        student: studentUser,
        imageUrls: uploadedUrls,
        imagesMetadata: uploadedMetadata,
        verificationCode: verificationCode || undefined,
        verificationCodeCreatedAt: codeCreatedAt || undefined,
        verificationCodeStatus: 'active',
        comment: comment.trim(),
      });

      if (res.error || !res.submission) {
        throw new Error(res.error || 'Failed to save submission record in Firestore.');
      }

      // Success: show professional submission confirmation screen
      setCreatedSubmission(res.submission);
      setView('success');
    } catch (err: any) {
      console.error('Submission upload error:', err);
      let errMsg = 'Upload failed. Please retry.';
      if (err instanceof CloudinaryUploadError) {
        errMsg = `Upload failed: ${err.message}. Please retry.`;
      } else if (err.message) {
        errMsg = `Upload failed: ${err.message}. Please retry.`;
      }
      setUploadError(errMsg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={existingSubmission ? 'Resubmit Assignment Pages' : 'Capture Assignment Pages'}
      subtitle={`${assignment.semester} Sem — ${assignment.subject}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Assignment Mini Header */}
        <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{assignment.title}</h4>
            <span className="text-[11px] text-slate-500">Due: {formatDate(assignment.dueDate)}</span>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
            {assignment.maxMarks} Marks
          </span>
        </div>

        {/* =================================================================== */}
        {/* VIEW 0: ASSIGNMENT VERIFICATION CODE SCREEN */}
        {/* =================================================================== */}
        {view === 'verification_code' && (
          <div className="py-2 px-1 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                  <span aria-hidden="true">🔐</span> Assignment Verification
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Your unique code
                </p>
              </div>
            </div>

            {isCodeLoading ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">
                  Retrieving your secure verification code...
                </p>
              </div>
            ) : codeError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-3">
                <AlertCircle className="w-5 h-5 text-rose-600 mx-auto" />
                <p className="text-xs text-rose-700 font-medium">{codeError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchOrCreateCode}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Retry Loading Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Clean, High-Contrast Verification Code Badge */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/70 to-indigo-50/40 border-2 border-dashed border-blue-300 text-center space-y-2 shadow-xs">
                  <span className="inline-block text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100/90 px-3 py-0.5 rounded-full">
                    YOUR ASSIGNMENT VERIFICATION CODE
                  </span>
                  <div
                    id="verification-code-display"
                    className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-slate-900 select-all py-1"
                  >
                    {verificationCode}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Write this exact 6-character code on your notebook page
                  </p>
                </div>

                {/* Clear Instruction Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      1
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Write this code clearly on your notebook before taking photos.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      2
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Keep this code visible in the photograph.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      3
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      Write this code clearly on your notebook before taking photos. Keep the code visible in the captured page.
                    </p>
                  </div>
                </div>

                {/* Primary Student Acknowledgment CTA */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setView('camera')}
                    leftIcon={<Camera className="w-5 h-5" />}
                    className="py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    I've Written the Code — Start Camera
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 1: LIVE CAMERA VIEW */}
        {/* =================================================================== */}
        {view === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <h4 className="text-sm font-bold text-rose-900">Camera Access Notice</h4>
                <p className="text-xs text-rose-700 leading-relaxed max-w-sm mx-auto">
                  {cameraError}
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startCameraStream}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-3/4 sm:aspect-4/3 max-h-[62vh] flex items-center justify-center shadow-lg border border-slate-800">
                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover"
                />

                {/* Notebook Document Alignment Framing Guides */}
                <div className="absolute inset-4 sm:inset-6 pointer-events-none border border-white/40 rounded-xl shadow-inner flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                      Page {capturedPages.length + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {verificationCode && (
                        <span className="bg-amber-400 text-slate-950 text-[11px] font-mono font-black px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 shadow-sm">
                          <Lock className="w-2.5 h-2.5 text-slate-950" />
                          {verificationCode}
                        </span>
                      )}
                      <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                        Live Camera
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="bg-black/60 text-white/90 text-[11px] font-medium px-3 py-1 rounded-full backdrop-blur-xs">
                      Align your handwritten notebook page inside the frame
                    </span>
                  </div>
                </div>

                {/* Camera Top Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    aria-label="Switch camera"
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Large Mobile-Friendly Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                  {capturedPages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setView('review')}
                      className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-xs shadow-md"
                    >
                      Done ({capturedPages.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    disabled={isCameraStarting}
                    aria-label="Capture page photo"
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white bg-white/30 hover:bg-white/40 active:scale-95 transition-all flex items-center justify-center shadow-xl group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white group-hover:scale-95 transition-transform flex items-center justify-center text-blue-600">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>

                  <div className="w-16" />
                </div>
              </div>
            )}

            {/* Bottom Info */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Pages Captured: <strong className="text-slate-800">{capturedPages.length}</strong></span>
              {capturedPages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView('review')}
                  className="text-blue-600 hover:text-blue-700 font-bold"
                >
                  Review All Pages &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: SINGLE CAPTURE PREVIEW (Verify Handwriting) */}
        {/* =================================================================== */}
        {view === 'page_preview' && currentPendingPage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                  Verify Page {capturedPages.length + 1}
                </span>
                <p className="text-xs text-slate-500">
                  Ensure your notebook handwriting and answers are clear and readable.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                ~{currentPendingPage.sizeKb} KB
              </span>
            </div>

            {/* Captured Image Preview */}
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-3/4 sm:aspect-4/3 max-h-[58vh] flex items-center justify-center">
              <img
                src={currentPendingPage.dataUrl}
                alt={`Captured Page ${capturedPages.length + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions for this single page */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleRetake}
                leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
                className="w-full"
              >
                Retake Photo
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAcceptAndNextPage}
                leftIcon={<Plus className="w-4 h-4 text-blue-600" />}
                className="w-full"
              >
                Add Next Page
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleAcceptAndFinish}
                leftIcon={<Check className="w-4 h-4" />}
                className="w-full"
              >
                Accept & Review
              </Button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: MULTI-PAGE REVIEW & FINAL SUBMISSION */}
        {/* =================================================================== */}
        {view === 'review' && (
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            {uploadError && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Verification Code Reminder in Review */}
            {verificationCode && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Verification Code
                    </span>
                    <span className="text-sm font-mono font-black text-slate-900 tracking-wider">
                      {verificationCode}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Watermarked on pages
                </span>
              </div>
            )}

            {/* Top Carousel Navigation for Multi-page Viewing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Page {activeReviewIndex + 1} of {capturedPages.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeReviewIndex <= 0}
                    onClick={() => setActiveReviewIndex((p) => Math.max(0, p - 1))}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activeReviewIndex >= capturedPages.length - 1}
                    onClick={() => setActiveReviewIndex((p) => Math.min(capturedPages.length - 1, p + 1))}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Main Active Page Display */}
              {capturedPages[activeReviewIndex] && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-3/4 sm:aspect-4/3 max-h-[46vh] flex items-center justify-center">
                  <img
                    src={capturedPages[activeReviewIndex].dataUrl}
                    alt={`Assignment Page ${activeReviewIndex + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Delete button for active page */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleDeletePage(activeReviewIndex)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold shadow-md backdrop-blur-xs transition-colors"
                      aria-label="Delete this page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Page</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Thumbnails strip & Add page trigger */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {capturedPages.map((page, idx) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActiveReviewIndex(idx)}
                    className={`relative w-14 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      idx === activeReviewIndex
                        ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={page.dataUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center">
                      P{idx + 1}
                    </span>
                  </button>
                ))}

                {/* Add Page Button */}
                <button
                  type="button"
                  onClick={() => setView('camera')}
                  className="w-14 h-16 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 flex flex-col items-center justify-center text-blue-600 shrink-0 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Add</span>
                </button>
              </div>
            </div>

            {/* Optional Comment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Student Comment (Optional)
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Attached Unit 1 questions 1 through 6 handwritten in notebook."
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Student Confirmation */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
              <input
                id="camera-confirm-check"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="camera-confirm-check" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                <span className="font-bold text-slate-900 block">Student Verification:</span>
                I confirm that I have photographed all required pages of my handwritten assignment and the handwriting is clearly legible.
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView('camera')}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                Add More Pages
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit {capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* =================================================================== */}
        {/* VIEW 4: PROGRESSIVE UPLOADING STATE */}
        {/* =================================================================== */}
        {view === 'uploading' && (
          <div className="py-8 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">
                Uploading Assignment Pages to Cloud Storage
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Uploading Page {uploadProgress.current} of {uploadProgress.total} directly to Cloudinary...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((uploadProgress.current - 1) / uploadProgress.total) * 100 +
                        uploadProgress.percent / uploadProgress.total
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>Page {uploadProgress.current} of {uploadProgress.total}</span>
                <span>{uploadProgress.percent}%</span>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl text-left flex items-start gap-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Upload Failed</p>
                  <p>{uploadError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setView('review')}
                    className="mt-2 text-slate-700 border-slate-300"
                  >
                    Back to Review & Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 5: PROFESSIONAL SUBMISSION SUCCESS CONFIRMATION */}
        {/* =================================================================== */}
        {view === 'success' && (
          <div className="py-6 px-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                Assignment Submitted Successfully
              </h3>
              <p className="text-xs font-semibold text-emerald-700">
                ✓ Submission Successful
              </p>
              <p className="text-xs text-slate-500">
                Your assignment has been submitted to your teacher.
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-left max-w-md mx-auto space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[220px]">
                  {assignment.title}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Subject:</span>
                <span className="font-bold text-slate-900">{assignment.subject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Submitted At:</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(createdSubmission?.submittedAt || new Date().toISOString())}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Pages Submitted:</span>
                <span className="font-bold text-blue-700">
                  {createdSubmission?.imageUrls?.length || capturedPages.length} Pages
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  SUBMITTED
                </span>
              </div>
            </div>

            <div className="pt-2 max-w-md mx-auto">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => {
                  if (createdSubmission) {
                    onSubmitted(createdSubmission);
                  }
                  handleModalClose();
                }}
              >
                View Submission
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
