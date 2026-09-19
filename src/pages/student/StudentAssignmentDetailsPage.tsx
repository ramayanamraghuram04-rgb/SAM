import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Award, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Assignment, Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge, SubmissionStatusBadge } from '../../components/common/Badge';
import { SubmitAssignmentModal } from '../../components/student/SubmitAssignmentModal';
import { formatDate, formatDateTime, getDaysRemaining } from '../../utils/dateUtils';

interface StudentAssignmentDetailsPageProps {
  assignment: Assignment;
  onBack: () => void;
}

export const StudentAssignmentDetailsPage: React.FC<StudentAssignmentDetailsPageProps> = ({
  assignment,
  onBack,
}) => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  const fetchSubmission = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const subs = await submissionService.getStudentSubmissions(user.uid);
      const match = subs.find((s) => s.assignmentId === assignment.id);
      setSubmission(match || null);
    } catch (err) {
      console.error('Error fetching assignment submission:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [assignment.id, user?.uid]);

  const deadline = getDaysRemaining(assignment.dueDate);
  const status = submission?.status || 'not_submitted';

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </button>

      {/* Main Assignment Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SemesterBadge semester={assignment.semester} />
              <span className="text-xs font-bold text-slate-700">{assignment.subject}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <SubmissionStatusBadge status={status} />
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Max: {assignment.maxMarks} Marks
            </span>
          </div>
        </div>

        {/* Question Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Notebook Question / Instructions
          </span>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {assignment.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Due Date: {formatDate(assignment.dueDate)}</span>
          </div>
          {deadline.text && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                deadline.isOverdue
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {deadline.text}
            </span>
          )}
        </div>
      </div>

      {/* Submission Status Box */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Your Submission</h3>
          <SubmissionStatusBadge status={status} />
        </div>

        {submission ? (
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Submitted URL:</span>
                <span className="text-slate-400">{formatDateTime(submission.submittedAt)}</span>
              </div>
              <a
                href={submission.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono font-medium truncate block flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{submission.driveLink}</span>
              </a>

              {submission.comment && (
                <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                  <span className="font-semibold text-slate-700">Your Comment: </span>
                  {submission.comment}
                </div>
              )}
            </div>

            {/* If Checked, show evaluated Marks & Teacher Feedback */}
            {submission.status === 'checked' && submission.marks !== null && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-base">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>Evaluation: {submission.marks} / {assignment.maxMarks} Marks</span>
                </div>
                {submission.teacherFeedback ? (
                  <p className="text-xs text-emerald-800 italic leading-relaxed">
                    Teacher Feedback: "{submission.teacherFeedback}"
                  </p>
                ) : (
                  <p className="text-xs text-emerald-700">Assignment verified and evaluated by faculty.</p>
                )}
              </div>
            )}

            {/* If Returned, show Resubmission note */}
            {submission.status === 'returned' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Resubmission Requested</span>
                </div>
                <p className="italic">
                  {submission.teacherFeedback || 'Please update your notebook assignment photos and resubmit.'}
                </p>
              </div>
            )}

            {/* Resubmit / Edit link button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
              >
                {submission.status === 'returned' ? 'Resubmit Assignment' : 'Update Google Drive Link'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You haven't submitted this notebook assignment yet. Complete your answers in your notebook, take clear photos, upload them to Google Drive, and submit the sharing link.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Google Drive Link
            </Button>
          </div>
        )}
      </Card>

      {/* Modal */}
      <SubmitAssignmentModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        assignment={assignment}
        existingSubmission={submission}
        onSubmitted={(newSub) => {
          setSubmission(newSub);
        }}
      />
    </div>
  );
};
