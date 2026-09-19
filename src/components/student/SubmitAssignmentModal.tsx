import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, FileText, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Assignment, Submission } from '../../types';
import { validateDriveUrl } from '../../utils/driveValidator';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  existingSubmission?: Submission | null;
  onSubmitted: (submission: Submission) => void;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  existingSubmission,
  onSubmitted,
}) => {
  const { studentUser } = useAuth();
  const [driveLink, setDriveLink] = useState<string>(existingSubmission?.driveLink || '');
  const [comment, setComment] = useState<string>(existingSubmission?.comment || '');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUrlChange = (val: string) => {
    setDriveLink(val);
    setError('');
    setWarning('');
    setIsConfirmed(false);

    if (val.trim()) {
      const check = validateDriveUrl(val);
      if (!check.isValid) {
        setError(check.errorMessage || 'Invalid URL');
      } else if (!check.isGoogleDrive) {
        setWarning('Notice: Link should ideally be from drive.google.com with public "Anyone with link" view access.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUser) return;
    setError('');

    const validation = validateDriveUrl(driveLink);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Please enter a valid Google Drive link.');
      return;
    }

    if (!isConfirmed) {
      setError('Please check the confirmation box below before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await submissionService.submitAssignment({
        assignment,
        student: studentUser,
        driveLink: validation.normalizedUrl || driveLink.trim(),
        comment: comment.trim(),
      });

      if (res.error || !res.submission) {
        setError(res.error || 'Failed to submit assignment.');
      } else {
        onSubmitted(res.submission);
        onClose();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
      subtitle={`${assignment.semester} Sem — ${assignment.subject}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Assignment Prompt Overview */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">{assignment.title}</h4>
            <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
              Max: {assignment.maxMarks} Marks
            </span>
          </div>
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {assignment.description}
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            Due Date: {formatDate(assignment.dueDate)}
          </div>
        </div>

        {/* Google Drive Link Input */}
        <div>
          <Input
            label="Google Drive Sharing Link"
            placeholder="https://drive.google.com/file/d/... or folder link"
            value={driveLink}
            onChange={(e) => handleUrlChange(e.target.value)}
            leftIcon={<ExternalLink className="w-4 h-4 text-blue-500" />}
            helperText="Upload your physical notebook photos to Google Drive, set access to 'Anyone with link', and paste the link here."
          />
        </div>

        {/* Optional Comment */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Student Comment (Optional)
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Attached questions 1 to 5 from Unit 1 notebook."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Submission Confirmation Checkbox */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
          <input
            id="drive-confirm-check"
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded mt-0.5 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="drive-confirm-check" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
            <span className="font-bold text-slate-900 block">Confirmation:</span>
            Your assignment will be submitted using this Google Drive link. Make sure the file or folder permissions allow your teacher to view the photos.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            isLoading={isLoading}
          >
            {existingSubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
