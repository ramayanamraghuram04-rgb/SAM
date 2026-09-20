import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, RotateCcw, Award, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  maxMarks?: number;
  onGraded: (updatedSubmission: Submission) => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  maxMarks = 10,
  onGraded,
}) => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<number | ''>(submission.marks ?? '');
  const [feedback, setFeedback] = useState<string>(submission.teacherFeedback || '');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const hasImages = Boolean(submission.imageUrls && submission.imageUrls.length > 0);
  const isDriveLink = Boolean(submission.driveLink && submission.driveLink.includes('drive.google.com'));

  const handleOpenDrive = () => {
    if (submission.driveLink) {
      window.open(submission.driveLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenImageFullscreen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaveMarks = async (status: 'checked' | 'returned') => {
    if (!user) return;
    setError('');

    if (status === 'checked') {
      if (marks === '' || marks < 0 || marks > maxMarks) {
        setError(`Please enter valid marks between 0 and ${maxMarks}.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await submissionService.gradeSubmission({
        submission,
        teacherId: user.uid,
        teacherName: user.name,
        marks: status === 'checked' ? Number(marks) : 0,
        maxMarks,
        feedback: feedback.trim(),
        status,
      });

      if (!res.success) {
        setError(res.error || 'Failed to update marks.');
      } else {
        onGraded({
          ...submission,
          marks: status === 'checked' ? Number(marks) : null,
          teacherFeedback: feedback.trim(),
          status,
          checkedAt: status === 'checked' ? new Date().toISOString() : null,
        });
        onClose();
      }
    } catch {
      setError('Something went wrong while saving marks.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluate Submission"
      subtitle={`Student: ${submission.studentName} (${submission.studentPIN})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Student submission info box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Assignment
              </span>
              <h4 className="text-sm font-bold text-slate-900">{submission.assignmentTitle}</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Submitted: {formatDateTime(submission.submittedAt)}
            </span>
          </div>

          {submission.comment && (
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Student Note: </span>
              {submission.comment}
            </div>
          )}

          {/* SUBMISSION VIEWER: Cloudinary Captured Images or Legacy Drive */}
          {hasImages ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    Page {activePageIndex + 1} of {submission.imageUrls!.length}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Camera Capture
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activePageIndex <= 0}
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    leftIcon={<ChevronLeft className="w-3 h-3" />}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={activePageIndex >= submission.imageUrls!.length - 1}
                    onClick={() => setActivePageIndex((p) => Math.min(submission.imageUrls!.length - 1, p + 1))}
                    rightIcon={<ChevronRight className="w-3 h-3" />}
                  >
                    Next
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleOpenImageFullscreen(submission.imageUrls![activePageIndex])}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                    title="Open full size in new tab"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Page Image Box */}
              <div 
                onClick={() => handleOpenImageFullscreen(submission.imageUrls![activePageIndex])}
                className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 aspect-3/4 sm:aspect-4/3 max-h-[50vh] flex items-center justify-center cursor-zoom-in group shadow-inner"
              >
                <img
                  src={submission.imageUrls![activePageIndex]}
                  alt={`Notebook page ${activePageIndex + 1}`}
                  className="w-full h-full object-contain group-hover:scale-101 transition-transform"
                />
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                  Click to Zoom / Open Original
                </span>
              </div>

              {/* Thumbnails row (if > 1 page) */}
              {submission.imageUrls!.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {submission.imageUrls!.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        idx === activePageIndex
                          ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center">
                        P{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : isDriveLink ? (
            /* LEGACY GOOGLE DRIVE BUTTON FOR OLD SUBMISSIONS */
            <div className="pt-1">
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
                onClick={handleOpenDrive}
              >
                OPEN GOOGLE DRIVE
              </Button>
              <p className="text-[11px] text-slate-400 text-center mt-1">
                Legacy submission: Opens student's assignment photos in Google Drive
              </p>
            </div>
          ) : (
            <div className="p-3 text-xs text-slate-500 text-center">
              No attached images found for this submission.
            </div>
          )}
        </div>

        {/* Marks Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Marks Awarded (out of {maxMarks})
          </label>
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                type="number"
                min={0}
                max={maxMarks}
                placeholder="0"
                value={marks}
                onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
                leftIcon={<Award className="w-4 h-4 text-blue-500" />}
              />
            </div>
            <span className="text-base font-bold text-slate-500">/ {maxMarks} Marks</span>
          </div>
        </div>

        {/* Teacher Feedback / Comments */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Teacher Feedback / Correction Notes
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Good work. Improve the explanation of the loop. Handwriting is neat."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSaveMarks('returned')}
            isLoading={isLoading}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
            className="text-rose-600 hover:bg-rose-50"
          >
            Request Resubmission
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => handleSaveMarks('checked')}
              isLoading={isLoading}
            >
              Save Marks & Check
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
