import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ClassItem, Assignment, TeachingAssignment } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { academicService } from '../../services/academicService';
import { cloudinaryService } from '../../services/cloudinary';
import { validateQuestionImageFile, compressQuestionImage } from '../../utils/imageCompressor';
import { validateDriveUrl } from '../../utils/driveValidator';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_MAX_MARKS } from '../../config/constants';
import { formatDate } from '../../utils/dateUtils';
import { 
  BookOpen, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Save,
  Image as ImageIcon,
  Upload,
  X,
  RefreshCw,
  Camera,
  Check,
  RotateCcw,
  Eye,
  SwitchCamera,
  Link as LinkIcon,
  Cloud,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export interface CapturedQuestionPage {
  id: string;
  file?: File;
  previewUrl: string;
  source: 'camera' | 'upload' | 'existing';
  publicId?: string;
  createdAt?: string;
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: ClassItem[];
  defaultClassId?: string;
  editingAssignment?: Assignment | null;
  onAssignmentCreated: (assignment: Assignment) => void;
  initialAttachmentMode?: 'camera' | 'upload' | 'drive' | null;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classes: propClasses = [],
  defaultClassId,
  editingAssignment = null,
  onAssignmentCreated,
  initialAttachmentMode = null,
}) => {
  const { user } = useAuth();

  // Teaching Assignments state
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [authorizedClasses, setAuthorizedClasses] = useState<TeachingAssignment[]>([]);
  const [selectedTeachingAssignmentId, setSelectedTeachingAssignmentId] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [driveLink, setDriveLink] = useState<string>('');
  const [showDriveInput, setShowDriveInput] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string>('');

  // Default due date = 7 days from today
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [maxMarks, setMaxMarks] = useState<number>(DEFAULT_MAX_MARKS);

  // Status & Confirmation
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Multi-Page Question Image state
  const [capturedPages, setCapturedPages] = useState<CapturedQuestionPage[]>([]);
  const [retakingPageIndex, setRetakingPageIndex] = useState<number | null>(null);
  const [previewingPageIndex, setPreviewingPageIndex] = useState<number | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState<boolean>(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState<boolean>(false);
  const [attachmentTab, setAttachmentTab] = useState<'all' | 'camera' | 'upload' | 'drive'>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Synchronized compatibility accessors
  const questionImagePreview = capturedPages.length > 0 ? capturedPages[0].previewUrl : null;
  const questionImageFile = capturedPages.find((p) => p.file)?.file || null;
  const imageSource = capturedPages.length > 0 ? capturedPages[0].source : null;
  const setQuestionImagePreview = (val: string | null) => {
    if (!val) setCapturedPages([]);
  };
  const setQuestionImageFile = (_val: File | null) => {};
  const setImageSource = (_val: any) => {};

  // Camera capture modal state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedFrame, setCapturedFrame] = useState<{ blob: Blob; dataUrl: string } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load Staff teaching assignments when modal opens
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadTeachingRelationships();
    }
  }, [isOpen, user?.uid, editingAssignment]);

  const loadTeachingRelationships = async () => {
    if (!user?.uid) return;
    try {
      const tas = await academicService.getStaffTeachingAssignments(user.uid);
      setTeachingAssignments(tas);

      // Extract unique authorized subjects
      const subjs = Array.from(
        new Set(tas.map((t) => t.subjectName || t.subjectId).filter(Boolean))
      );
      setAvailableSubjects(subjs);

      if (editingAssignment) {
        // Pre-fill form from existing assignment
        setTitle(editingAssignment.title || '');
        setDescription(editingAssignment.description || '');
        setInstructions(editingAssignment.instructions || '');
        setDueDate(editingAssignment.dueDate || defaultDueDate);
        setMaxMarks(editingAssignment.maxMarks || DEFAULT_MAX_MARKS);
        const initialPages: CapturedQuestionPage[] = [];
        if (editingAssignment.questionImageUrls && editingAssignment.questionImageUrls.length > 0) {
          editingAssignment.questionImageUrls.forEach((url, i) => {
            initialPages.push({
              id: `existing_${i}_${Date.now()}`,
              previewUrl: url,
              source: 'existing',
              publicId: editingAssignment.questionImages?.[i]?.publicId,
              createdAt: editingAssignment.questionImages?.[i]?.createdAt,
            });
          });
        } else if (editingAssignment.questionImageUrl) {
          initialPages.push({
            id: `existing_0_${Date.now()}`,
            previewUrl: editingAssignment.questionImageUrl,
            source: 'existing',
          });
        }
        setCapturedPages(initialPages);
        setIsImageRemoved(false);
        setDriveLink(editingAssignment.driveLink || '');
        setShowDriveInput(Boolean(editingAssignment.driveLink));

        const matchingClasses = tas.filter(
          (t) => (t.subjectName || t.subjectId) === editingAssignment.subject
        );
        setAuthorizedClasses(matchingClasses);
        const matchTa = matchingClasses.find((t) => t.semester === editingAssignment.semester);
        setSelectedTeachingAssignmentId(matchTa ? matchTa.id : (matchingClasses[0]?.id || ''));
      } else {
        // New assignment defaults
        const initialSubj = subjs[0] || '';
        setSelectedSubject(initialSubj);
        setCapturedPages([]);
        setIsImageRemoved(false);
        setDriveLink('');
        setShowDriveInput(false);

        const classesForSubj = tas.filter(
          (t) => (t.subjectName || t.subjectId) === initialSubj
        );
        setAuthorizedClasses(classesForSubj);
        setSelectedTeachingAssignmentId(classesForSubj[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load teaching assignments for staff:', err);
    }
  };

  // When staff changes subject, update authorized classes list
  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    const classesForSubj = teachingAssignments.filter(
      (t) => (t.subjectName || t.subjectId) === newSubject
    );
    setAuthorizedClasses(classesForSubj);
    setSelectedTeachingAssignmentId(classesForSubj[0]?.id || '');
  };

  const validateForm = (): boolean => {
    setError('');
    setDriveError('');

    if (!title.trim()) {
      setError('Please enter an assignment title.');
      return false;
    }
    if (!description.trim()) {
      setError('Please enter the assignment question or description.');
      return false;
    }
    if (!selectedSubject) {
      setError('Please select an authorized subject.');
      return false;
    }
    if (!selectedTeachingAssignmentId && authorizedClasses.length === 0) {
      setError('No authorized classes available for this subject.');
      return false;
    }
    if (!dueDate) {
      setError('Please select a valid due date.');
      return false;
    }
    if (maxMarks <= 0 || maxMarks > 100) {
      setError('Maximum marks must be between 1 and 100.');
      return false;
    }

    if (driveLink.trim()) {
      const driveCheck = validateDriveUrl(driveLink);
      if (!driveCheck.isValid) {
        setDriveError(driveCheck.errorMessage || 'Please enter a valid Google Drive link.');
        setError('Please provide a valid Google Drive link or clear the field.');
        return false;
      }
    }

    return true;
  };

  // --- CAMERA MANAGEMENT ---

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

  const startCameraStream = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    setIsCameraStarting(true);
    setCapturedFrame(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setCameraError('Camera is not available on this device.');
      setIsCameraStarting(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
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
      console.error('Teacher camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission is required to capture a question.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Camera is not available on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application. Please close other camera tabs and try again.');
      } else {
        setCameraError('Camera is not available on this device.');
      }
    } finally {
      setIsCameraStarting(false);
    }
  }, [facingMode, stopCameraStream]);

  // Clean up camera stream if modal closes
  useEffect(() => {
    if (!isOpen || !isCameraOpen) {
      stopCameraStream();
    }
  }, [isOpen, isCameraOpen, stopCameraStream]);

  const handleOpenLiveCamera = () => {
    setError('');
    setCameraError(null);
    setCapturedFrame(null);
    setIsCameraOpen(true);
    startCameraStream(facingMode);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedFrame(null);
    setCameraError(null);
  };

  // Synchronize initialAttachmentMode on open
  useEffect(() => {
    if (isOpen) {
      if (initialAttachmentMode === 'camera') {
        setAttachmentTab('camera');
        handleOpenLiveCamera();
      } else if (initialAttachmentMode === 'upload') {
        setAttachmentTab('upload');
        stopCameraStream();
        setIsCameraOpen(false);
      } else if (initialAttachmentMode === 'drive') {
        setAttachmentTab('drive');
        setShowDriveInput(true);
        stopCameraStream();
        setIsCameraOpen(false);
      } else {
        setAttachmentTab('all');
      }
    }
  }, [isOpen, initialAttachmentMode]);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || isCameraStarting) return;

    try {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCameraError('Failed to capture frame from video.');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setCapturedFrame({ blob, dataUrl });
            stopCameraStream();
          } else {
            setCameraError('Empty or invalid capture. Please try again.');
          }
        },
        'image/jpeg',
        0.88
      );
    } catch (err: any) {
      console.error('Photo capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  const handleRetakeCapturedPhoto = () => {
    setCapturedFrame(null);
    startCameraStream(facingMode);
  };

  const handleUseCapturedPhoto = () => {
    if (!capturedFrame || !capturedFrame.blob || capturedFrame.blob.size === 0) {
      setCameraError('Empty or invalid capture. Please try again.');
      return;
    }

    const pageIndex = retakingPageIndex !== null ? retakingPageIndex : capturedPages.length;
    const file = new File(
      [capturedFrame.blob],
      `question_camera_page_${pageIndex + 1}_${Date.now()}.jpg`,
      { type: 'image/jpeg' }
    );

    setQuestionImageFile(file);
    setQuestionImagePreview(capturedFrame.dataUrl);

    const newPage: CapturedQuestionPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      previewUrl: capturedFrame.dataUrl,
      source: 'camera',
    };

    if (retakingPageIndex !== null && retakingPageIndex >= 0 && retakingPageIndex < capturedPages.length) {
      setCapturedPages((prev) => {
        const next = [...prev];
        next[retakingPageIndex] = newPage;
        return next;
        });
      setRetakingPageIndex(null);
    } else {
      setCapturedPages((prev) => [...prev, newPage]);
    }

    setIsImageRemoved(false);
    handleCloseCamera();
  };

  const handleRetakeSpecificPage = (index: number) => {
    setRetakingPageIndex(index);
    handleOpenLiveCamera();
  };

  const handleDeletePage = (index: number) => {
    setCapturedPages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setIsImageRemoved(true);
      }
      return next;
    });
  };

  const handlePreviewPage = (index: number) => {
    setPreviewingPageIndex(index);
    setShowFullscreenPreview(true);
  };

  // --- FILE UPLOAD MANAGEMENT ---

  const processSelectedFile = (file: File) => {
    setError('');
    const val = validateQuestionImageFile(file);
    if (!val.isValid) {
      setError(val.error || 'Please select a valid image (JPG, PNG, WEBP, max 10MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newPage: CapturedQuestionPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      previewUrl: objectUrl,
      source: 'upload',
    };

    setCapturedPages((prev) => [...prev, newPage]);
    setIsImageRemoved(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleRemoveImage = () => {
    setCapturedPages([]);
    setIsImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Helper to upload question images to Cloudinary folder sam/assignments/questions
  const uploadAllQuestionImages = async (): Promise<{
    urls: string[];
    items: { url: string; publicId?: string; createdAt?: string }[];
    error: string | null;
  }> => {
    if (capturedPages.length === 0) {
      return { urls: [], items: [], error: null };
    }

    const finalUrls: string[] = [];
    const finalItems: { url: string; publicId?: string; createdAt?: string }[] = [];

    for (let i = 0; i < capturedPages.length; i++) {
      const page = capturedPages[i];
      if (page.file) {
        setUploadStatusText(`Uploading question image ${i + 1} of ${capturedPages.length}...`);
        try {
          const optimizedBlob = await compressQuestionImage(page.file);
          const uploadResult = await cloudinaryService.uploadQuestionImage(optimizedBlob, {
            fileName: page.file.name,
          });

          if (!uploadResult?.secure_url) {
            return {
              urls: [],
              items: [],
              error: 'Image upload failed. Please try again.', // Question image upload failed. Please try again.
            };
          }

          finalUrls.push(uploadResult.secure_url);
          finalItems.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            createdAt: uploadResult.created_at || new Date().toISOString(),
          });
        } catch (err: any) {
          console.error(`Page ${i + 1} upload error:`, err);
          return {
            urls: [],
            items: [],
            error: 'Image upload failed. Please try again.', // Question image upload failed. Please try again.
          };
        }
      } else if (page.previewUrl && page.previewUrl.startsWith('http')) {
        finalUrls.push(page.previewUrl);
        finalItems.push({
          url: page.previewUrl,
          publicId: page.publicId,
          createdAt: page.createdAt || new Date().toISOString(),
        });
      }
    }

    setUploadStatusText('Question images uploaded.');
    return { urls: finalUrls, items: finalItems, error: null };
  };

  const uploadImageIfSelected = async (): Promise<{ url: string | undefined; urls: string[]; error: string | null }> => {
    const res = await uploadAllQuestionImages();
    if (res.error) {
      return { url: undefined, urls: [], error: res.error };
    }
    const primaryUrl = res.urls.length > 0 ? res.urls[0] : (isImageRemoved ? '' : editingAssignment?.questionImageUrl);
    return { url: primaryUrl, urls: res.urls, error: null };
  };

  const getTargetClassItem = (): ClassItem | null => {
    const selectedTa = authorizedClasses.find((t) => t.id === selectedTeachingAssignmentId) || authorizedClasses[0];
    if (!selectedTa) return null;

    const classId = `cls_${selectedTa.semester}_${selectedTa.subjectId}_${user?.uid}`.replace(/[^a-zA-Z0-9_]/g, '_');
    return {
      id: classId,
      teacherId: user?.uid || '',
      teacherName: user?.name || 'Faculty',
      department: 'CSE',
      semester: selectedTa.semester,
      subject: selectedTa.subjectName,
      status: 'active',
      createdAt: selectedTa.createdAt || new Date().toISOString(),
    };
  };

  // Save as Draft handler
  const handleSaveDraft = async () => {
    if (!user) return;
    if (!validateForm()) return;

    const targetClass = getTargetClassItem();
    if (!targetClass) {
      setError('Could not resolve authorized target class.');
      return;
    }

    setIsLoading(true);
    setUploadStatusText('');
    try {
      // 1. Upload question image to sam/assignments/questions if selected
      const imgRes = await uploadAllQuestionImages();
      if (imgRes.error) {
        setError(imgRes.error);
        setIsLoading(false);
        setUploadStatusText('');
        return; // DO NOT create broken assignment!
      }

      const finalQuestionImageUrls = imgRes.urls;
      const finalQuestionImageUrl = imgRes.urls.length > 0 ? imgRes.urls[0] : (isImageRemoved ? undefined : editingAssignment?.questionImageUrl);
      const finalQuestionImages = imgRes.items;
      const cleanDriveLink = driveLink.trim();

      if (editingAssignment) {
        const updates: Partial<Assignment> = {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'draft',
          published: false,
          driveLink: cleanDriveLink || undefined,
        };
        if (finalQuestionImageUrl !== undefined) {
          updates.questionImageUrl = finalQuestionImageUrl;
          updates.questionImageUrls = finalQuestionImageUrls;
          updates.questionImages = finalQuestionImages;
        } else if (isImageRemoved) {
          updates.questionImageUrl = undefined;
          updates.questionImageUrls = [];
          updates.questionImages = [];
        }

        const res = await assignmentService.updateAssignment(
          editingAssignment.id,
          user.uid,
          updates
        );
        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to save draft.');
        } else {
          onAssignmentCreated(res.assignment);
          onClose();
        }
      } else {
        const res = await assignmentService.createAssignment({
          classItem: targetClass,
          teacherId: user.uid,
          teacherName: user.name,
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'draft',
          published: false,
          questionImageUrl: finalQuestionImageUrl || undefined,
          questionImageUrls: finalQuestionImageUrls.length > 0 ? finalQuestionImageUrls : undefined,
          questionImages: finalQuestionImages.length > 0 ? finalQuestionImages : undefined,
          driveLink: cleanDriveLink || undefined,
        });

        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to save draft.');
        } else {
          onAssignmentCreated(res.assignment);
          resetForm();
          onClose();
        }
      }
    } catch {
      setError('Network error while saving draft. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadStatusText('');
    }
  };

  // Open Publish Confirmation Dialog
  const handleOpenPublishConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPublishConfirm(true);
    }
  };

  // Confirmed Publish Execution
  const handleExecutePublish = async () => {
    if (!user) return;
    const targetClass = getTargetClassItem();
    if (!targetClass) {
      setError('Could not resolve authorized target class.');
      setShowPublishConfirm(false);
      return;
    }

    setIsLoading(true);
    setShowPublishConfirm(false);
    setUploadStatusText('');

    try {
      // 1. Upload question image to sam/assignments/questions if selected
      const imgRes = await uploadAllQuestionImages();
      if (imgRes.error) {
        setError(imgRes.error);
        setIsLoading(false);
        setUploadStatusText('');
        return; // DO NOT create broken assignment!
      }

      const finalQuestionImageUrls = imgRes.urls;
      const finalQuestionImageUrl = imgRes.urls.length > 0 ? imgRes.urls[0] : (isImageRemoved ? undefined : editingAssignment?.questionImageUrl);
      const finalQuestionImages = imgRes.items;
      const cleanDriveLink = driveLink.trim();

      if (editingAssignment) {
        const updates: Partial<Assignment> = {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'published',
          published: true,
          driveLink: cleanDriveLink || undefined,
        };
        if (finalQuestionImageUrl !== undefined) {
          updates.questionImageUrl = finalQuestionImageUrl;
          updates.questionImageUrls = finalQuestionImageUrls;
          updates.questionImages = finalQuestionImages;
        } else if (isImageRemoved) {
          updates.questionImageUrl = undefined;
          updates.questionImageUrls = [];
          updates.questionImages = [];
        }

        const res = await assignmentService.updateAssignment(
          editingAssignment.id,
          user.uid,
          updates
        );
        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to publish assignment.');
        } else {
          onAssignmentCreated(res.assignment);
          onClose();
        }
      } else {
        const res = await assignmentService.createAssignment({
          classItem: targetClass,
          teacherId: user.uid,
          teacherName: user.name,
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'published',
          published: true,
          questionImageUrl: finalQuestionImageUrl || undefined,
          questionImageUrls: finalQuestionImageUrls.length > 0 ? finalQuestionImageUrls : undefined,
          questionImages: finalQuestionImages.length > 0 ? finalQuestionImages : undefined,
          driveLink: cleanDriveLink || undefined,
        });

        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to publish assignment.');
        } else {
          onAssignmentCreated(res.assignment);
          resetForm();
          onClose();
        }
      }
    } catch {
      setError('Network error while publishing assignment. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadStatusText('');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setDriveLink('');
    setShowDriveInput(false);
    setDriveError('');
    setError('');
    setShowPublishConfirm(false);
    setCapturedPages([]);
    setIsImageRemoved(false);
    setUploadStatusText('');
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedFrame(null);
    setRetakingPageIndex(null);
    setPreviewingPageIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  const selectedClassInfo = authorizedClasses.find((t) => t.id === selectedTeachingAssignmentId) || authorizedClasses[0];

  return (
    <>
      <Modal
        isOpen={isOpen && !showPublishConfirm && !isCameraOpen && !showFullscreenPreview}
        onClose={onClose}
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        subtitle="Configure and publish notebook questions for authorized classes"
        maxWidth="lg"
      >
        <form onSubmit={handleOpenPublishConfirm} className="space-y-4">
          {error && (
            <div className="p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject & Class Selection (Authorized Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subject Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Subject *</span>
              </label>
              {availableSubjects.length === 0 ? (
                <div className="p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                  No subjects assigned by Admin.
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {availableSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Class / Semester Dropdown (Filtered to Selected Subject) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Class / Semester *</span>
              </label>
              {authorizedClasses.length === 0 ? (
                <div className="p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                  No classes authorized for this subject.
                </div>
              ) : (
                <select
                  value={selectedTeachingAssignmentId}
                  onChange={(e) => setSelectedTeachingAssignmentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {authorizedClasses.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.semester} Semester (CSE)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Assignment Title */}
          <Input
            label="Assignment Title *"
            placeholder="e.g. Assignment 1: Functions & Pointers in C"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Question / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Assignment Question / Description *</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the questions clearly (e.g. 1. Write a program to find the factorial of a number using recursion. 2. Write algorithm and draw flowchart in your assignment notebook)."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* --- QUESTION MATERIAL: CAMERA, UPLOAD FROM DRIVE/DEVICE, OR GOOGLE DRIVE LINK --- */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Question Image (Optional)</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500">
                Camera • Device Upload • Drive Link
              </span>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
            />
            <input
              type="file"
              ref={mobileCameraInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {capturedPages.length === 0 ? (
              <div className="space-y-3">
                {/* Clear Option: Capture with Camera Button */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-950">Camera Question Capture</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Capture question paper, handwritten questions, or textbook diagrams using your camera.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRetakingPageIndex(null);
                      handleOpenLiveCamera();
                    }}
                    leftIcon={<Camera className="w-4 h-4" />}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 shadow-xs"
                  >
                    📷 Capture with Camera
                  </Button>
                </div>

                {/* Cards for Camera and Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1. Camera Capture Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setRetakingPageIndex(null);
                      handleOpenLiveCamera();
                    }}
                    className="p-3.5 rounded-xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-white hover:bg-blue-50/50 shadow-xs hover:shadow-md transition-all flex items-center gap-3 group text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-blue-950">
                          Take Photo with Camera
                        </p>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded">
                          Live
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        📷 Capture Question • Rear camera on mobile
                      </p>
                    </div>
                  </button>

                  {/* 2. File Upload from Device */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processSelectedFile(file);
                    }}
                    onClick={handleTriggerFileSelect}
                    className={`p-3.5 rounded-xl border-2 border-dashed transition-all flex items-center gap-3 group text-left cursor-pointer ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-md'
                        : 'border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-100/70 shadow-xs hover:shadow-md'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                      <Upload className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">
                        Upload from Device
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Choose JPG, PNG, WEBP from disk
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Multi-Page Captured Pages UI */
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Captured Pages</span>
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRetakingPageIndex(null);
                      handleOpenLiveCamera();
                    }}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    📷 Capture Another Page
                  </Button>
                </div>

                {/* Captured Pages Thumbnails Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {capturedPages.map((page, index) => (
                    <div
                      key={page.id || index}
                      className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div 
                        className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden cursor-pointer"
                        onClick={() => handlePreviewPage(index)}
                      >
                        <img
                          src={page.previewUrl}
                          alt={`Page ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-white font-black text-[11px] shadow-sm">
                          Page {index + 1}
                        </div>
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-bold flex items-center gap-1 bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-xs">
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handlePreviewPage(index)}
                          className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Preview page"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRetakeSpecificPage(index)}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Retake this page"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retake</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePage(index)}
                          className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Delete this page"
                        >
                          <X className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Next Page Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setRetakingPageIndex(null);
                      handleOpenLiveCamera();
                    }}
                    className="rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/70 transition-all flex flex-col items-center justify-center p-3 text-center gap-2 cursor-pointer min-h-[140px] group"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-950">Page {capturedPages.length + 1}</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">Capture with Camera</p>
                    </div>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">
                    {capturedPages.length} {capturedPages.length === 1 ? 'question page' : 'question pages'} attached.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTriggerFileSelect}
                      disabled={isLoading}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                    >
                      Replace Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      leftIcon={<X className="w-3 h-3" />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Google Drive Link Section */}
            <div className="pt-2 border-t border-slate-200/60">
              {!showDriveInput && !driveLink ? (
                <button
                  type="button"
                  onClick={() => setShowDriveInput(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>+ Attach Google Drive Link (Optional)</span>
                </button>
              ) : (
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Google Drive Sharing Link (Optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setDriveLink('');
                        setShowDriveInput(false);
                        setDriveError('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600"
                    >
                      Remove Link
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={driveLink}
                      onChange={(e) => {
                        setDriveLink(e.target.value);
                        setDriveError('');
                      }}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {driveLink && (
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1.5 text-blue-600 hover:text-blue-800 p-0.5"
                        title="Open link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {driveError && (
                    <p className="text-[11px] text-rose-600">{driveError}</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Paste sharing link for reference PDFs, question sheets, or folders on Google Drive.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notebook Submission Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Write verification code prominently at the top of each page. Ensure all handwriting is legible before submitting."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Due Date & Max Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Due Date *"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Maximum Marks"
              type="number"
              min={1}
              max={100}
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              helperText="Default standard is 10 marks"
            />
          </div>

          {/* Actions: Cancel, Save Draft, Publish Assignment */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                Save Draft
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                disabled={isLoading || availableSubjects.length === 0}
              >
                Publish Assignment
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* --- LIVE CAMERA CAPTURE MODAL FOR TEACHERS --- */}
      {isCameraOpen && (
        <Modal
          isOpen={isCameraOpen}
          onClose={handleCloseCamera}
          title="Capture Question Photo"
          subtitle="Position question notebook, textbook, or blackboard clearly in view"
          maxWidth="lg"
        >
          <div className="space-y-3.5">
            {cameraError && (
              <div className="p-3 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-2">
                  <span>{cameraError}</span>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startCameraStream(facingMode)}
                    >
                      Try Again
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleCloseCamera();
                        handleTriggerFileSelect();
                      }}
                    >
                      Upload File Instead
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Video Viewfinder or Frozen Captured Frame */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-inner">
              {!capturedFrame ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Framing Overlay */}
                  <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-white/50 rounded-xl flex items-end justify-center pb-3">
                    <div className="bg-slate-950/75 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-medium text-white flex items-center gap-1.5 shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      <span>Position question text & diagrams inside frame</span>
                    </div>
                  </div>

                  {isCameraStarting && (
                    <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-white">
                      <LoadingSpinner />
                      <p className="text-xs font-semibold">Starting camera...</p>
                    </div>
                  )}

                  {/* Camera Controls Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFacingMode}
                      className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-xs border border-white/20 transition-transform active:scale-95 cursor-pointer"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                /* Frozen Frame Review */
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                  <img
                    src={capturedFrame.dataUrl}
                    alt="Captured Question"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Photo Captured</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Shutter & Action Controls */}
            {!capturedFrame ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseCamera}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleCapturePhoto}
                  disabled={isCameraStarting || !!cameraError}
                  leftIcon={<Camera className="w-5 h-5" />}
                  className="px-6 py-2.5 shadow-lg shadow-blue-500/25"
                >
                  Capture Photo
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    mobileCameraInputRef.current?.click();
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Use Device App
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetakeCapturedPhoto}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Retake Photo
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseCamera}
                  >
                    Discard
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleUseCapturedPhoto}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Use This Photo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* --- FULLSCREEN PREVIEW LIGHTBOX MODAL --- */}
      {/* --- FULLSCREEN PREVIEW LIGHTBOX MODAL --- */}
      {showFullscreenPreview && (
        <Modal
          isOpen={showFullscreenPreview}
          onClose={() => setShowFullscreenPreview(false)}
          title={`Question Image Preview ${capturedPages.length > 1 ? `(Page ${(previewingPageIndex !== null ? previewingPageIndex : 0) + 1} of ${capturedPages.length})` : ''}`}
          subtitle="Inspect question text, diagrams, and handwriting legibility"
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-slate-900 rounded-xl p-2 border border-slate-700">
              <img
                src={previewingPageIndex !== null && capturedPages[previewingPageIndex] ? capturedPages[previewingPageIndex].previewUrl : (questionImagePreview || '')}
                alt="Full Question Preview"
                className="max-h-[66vh] w-auto object-contain rounded"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                {previewingPageIndex !== null && capturedPages[previewingPageIndex]?.file 
                  ? capturedPages[previewingPageIndex].file?.name 
                  : `Question Page ${(previewingPageIndex !== null ? previewingPageIndex : 0) + 1}`}
              </span>
              <div className="flex items-center gap-2">
                {capturedPages.length > 1 && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewingPageIndex === null || previewingPageIndex === 0}
                      onClick={() => setPreviewingPageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewingPageIndex === null || previewingPageIndex >= capturedPages.length - 1}
                      onClick={() => setPreviewingPageIndex((prev) => (prev !== null && prev < capturedPages.length - 1 ? prev + 1 : prev))}
                    >
                      Next
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowFullscreenPreview(false)}
                >
                  Done Inspecting
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* --- TEACHER ASSIGNMENT PREVIEW BEFORE PUBLISHING --- */}
      {showPublishConfirm && (
        <Modal
          isOpen={showPublishConfirm}
          onClose={() => setShowPublishConfirm(false)}
          title="Assignment Preview"
          subtitle="Inspect exactly how assignment questions and captured pages will appear to students"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-blue-950">
                  Publish this assignment to the selected class?
                </p>
                <p className="text-blue-700 text-[11px] mt-0.5">
                  Review the typed prompt and captured question pages below before publishing to students.
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg">
                Preview Mode
              </span>
            </div>

            {/* Assignment Details Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/70">
                <span className="font-semibold text-slate-500">Assignment Title:</span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-right">{title}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 border-b border-slate-200/70">
                <div>
                  <span className="font-semibold text-slate-500 block text-[11px]">Subject:</span>
                  <span className="font-bold text-slate-900">{selectedSubject}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[11px]">Class:</span>
                  <span className="font-bold text-blue-700">{selectedClassInfo?.semester || 'Target'} Semester (CSE)</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[11px]">Due Date:</span>
                  <span className="font-bold text-slate-900">{formatDate(dueDate)} ({maxMarks} Marks)</span>
                </div>
              </div>

              {/* Question: section */}
              <div className="space-y-2 pt-1">
                <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Question:</span>
                </span>

                {/* [Typed Question] */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900 leading-relaxed whitespace-pre-line text-xs font-normal">
                  {description}
                </div>

                {/* [Captured Question Images] */}
                {questionImagePreview && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Question Image: ({capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'})</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{imageSource === 'camera' ? 'Camera Captured' : 'Attached'}</span>
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {capturedPages.map((page, pIdx) => (
                        <div 
                          key={page.id || pIdx} 
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">Captured Question Page {pIdx + 1}</span>
                            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {page.source === 'camera' ? 'Camera' : 'Upload'}
                            </span>
                          </div>
                          <div className="p-2 flex items-center justify-center bg-slate-950/5 min-h-[140px] max-h-[220px] overflow-hidden">
                            <img
                              src={page.previewUrl}
                              alt={`Captured Question Page ${pIdx + 1}`}
                              className="max-h-[200px] w-auto object-contain rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {driveLink && (
                  <div className="flex justify-between py-1 border-t border-slate-200/60 pt-2 text-[11px]">
                    <span className="font-semibold text-slate-500">Drive Reference:</span>
                    <span className="font-mono text-blue-600 truncate max-w-[200px]">{driveLink}</span>
                  </div>
                )}

                {instructions && (
                  <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 space-y-0.5">
                    <span className="font-bold uppercase tracking-wider text-blue-800">Instructions:</span>
                    <p className="whitespace-pre-line">{instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {uploadStatusText && (
              <div className="p-3 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                <LoadingSpinner />
                <span>{uploadStatusText}</span>
              </div>
            )}

            {/* Requested Action Buttons: [ Edit ], [ Add More ], [ Publish Assignment ] */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPublishConfirm(false)}
                disabled={isLoading}
              >
                Edit
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPublishConfirm(false);
                    setRetakingPageIndex(null);
                    handleOpenLiveCamera();
                  }}
                  disabled={isLoading}
                  leftIcon={<Camera className="w-4 h-4" />}
                >
                  Add More
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleExecutePublish}
                  isLoading={isLoading}
                >
                  Publish Assignment
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
