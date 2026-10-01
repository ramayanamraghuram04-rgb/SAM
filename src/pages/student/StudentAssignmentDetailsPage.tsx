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
  RotateCcw,
  Camera,
  Image as ImageIcon,
  FileText,
  Maximize2
} from 'lucide-react';
import { Assignment, Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { SemesterBadge, AssignmentDisplayStatusBadge } from '../../components/common/Badge';
import { SubmitAssignmentModal } from '../../components/student/SubmitAssignmentModal';
import { NotebookImageViewer } from '../../components/common/NotebookImageViewer';
import { formatDate, formatDateTime, getDaysRemaining, getAssignmentDisplayStatus } from '../../utils/dateUtils';

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
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] = useState<boolean>(false);
  const [activeQuestionPageIndex, setActiveQuestionPageIndex] = useState<number>(0);

  const questionPages = (assignment.questionImageUrls && assignment.questionImageUrls.length > 0)
    ? assignment.questionImageUrls
    : (assignment.questionImageUrl ? [assignment.questionImageUrl] : []);

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
  const displayStatus = getAssignmentDisplayStatus(assignment, submission);

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
            <AssignmentDisplayStatusBadge displayStatus={displayStatus} />
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Max: {assignment.maxMarks} Marks
            </span>
          </div>
        </div>

        {/* Question Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Assignment Question</span>
          </span>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {assignment.description}
          </p>
        </div>

        {/* Question Image (Optional) */}
        {assignment.questionImageUrl && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Question Image / Diagram</span>
              </span>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {questionPages.length > 1 ? `${questionPages.length} Pages Available` : "Teacher's Reference Photo"}
              </span>
            </span>

            {/* If multiple pages, show thumbnail selector tabs */}
            {questionPages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {questionPages.map((_url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionPageIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeQuestionPageIndex === idx
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>Page {idx + 1}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative group overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={questionPages[activeQuestionPageIndex] || assignment.questionImageUrl}
                alt="Assignment Question"
                className="w-full max-h-[460px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsQuestionImageModalOpen(true)}
              />
              <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] text-slate-500">
                  {questionPages.length > 1 ? `Viewing Page ${activeQuestionPageIndex + 1} of ${questionPages.length} • Tap to enlarge` : 'Tap image to view in full resolution'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuestionImageModalOpen(true)}
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enlarge Diagram</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Optional Instructions */}
        {assignment.instructions && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
            <span className="font-bold uppercase tracking-wider text-blue-800">Instructions:</span>
            <p className="whitespace-pre-line leading-relaxed">{assignment.instructions}</p>
          </div>
        )}

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
          <AssignmentDisplayStatusBadge displayStatus={displayStatus} />
        </div>

        {submission ? (
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Submitted • {submission.imageUrls?.length || 1} Page{(submission.imageUrls?.length || 1) > 1 ? 's' : ''}</span>
                </span>
                <span className="text-slate-500">
                  Submission Date/Time: <strong className="text-slate-700">{formatDateTime(submission.submittedAt)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-500">Current Status:</span>
                <AssignmentDisplayStatusBadge displayStatus={displayStatus} />
              </div>

              {/* Full Interactive Notebook Image Viewer */}
              {submission.imageUrls && submission.imageUrls.length > 0 ? (
                <div className="pt-2">
                  <NotebookImageViewer
                    imageUrls={submission.imageUrls}
                    verificationCode={submission.verificationCode}
                    maxHeight="max-h-[50vh]"
                  />
                </div>
              ) : submission.driveLink ? (
                /* Legacy Drive Link fallback */
                <div className="pt-2">
                  <a
                    href={submission.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:underline font-mono font-medium text-xs flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ExternalLink className="w-4 h-4 shrink-0 text-blue-600" />
                      <span className="truncate">Open Legacy Google Drive Submission</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Open Link ↗</span>
                  </a>
                </div>
              ) : null}

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

            {/* If Returned, show Returned for Correction */}
            {submission.status === 'returned' && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Returned for Correction</span>
                </div>
                <p className="italic">
                  {submission.teacherFeedback || 'Please review your notebook assignment, update required pages, and resubmit.'}
                </p>
              </div>
            )}

            {/* Submission History Section */}
            {submission.history && submission.history.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Submission History ({submission.history.length} Previous {submission.history.length === 1 ? 'Version' : 'Versions'})</span>
                </h4>
                <div className="space-y-1.5">
                  {submission.history.map((hist, hIdx) => (
                    <div key={hIdx} className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-600">
                        Version {hIdx + 1}: {hist.submittedAt ? formatDateTime(hist.submittedAt) : 'Previous submission'} • {hist.imageUrls?.length || 1} Pages
                      </span>
                      {hist.status && (
                        <span className="font-semibold uppercase tracking-wider text-slate-500">
                          Status: {hist.status} {hist.marks !== undefined && hist.marks !== null ? `(${hist.marks} Marks)` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resubmit button if returned or recapture (unless assignment is closed) */}
            {assignment.status !== 'closed' && assignment.status !== 'archived' ? (
              <div className="pt-2">
                <Button
                  variant={submission.status === 'returned' ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  {submission.status === 'returned' ? 'Resubmit Assignment' : 'Recapture Assignment Pages'}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                This assignment is closed. New submissions are no longer accepted.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            {assignment.status === 'closed' || assignment.status === 'archived' ? (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 max-w-md mx-auto">
                This assignment is closed. Submissions are no longer accepted.
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You haven't submitted this notebook assignment yet. Use your device camera to capture clear photos of your handwritten notebook pages directly.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Camera className="w-4 h-4" />}
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Capture Assignment Pages
                </Button>
              </>
            )}
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

      {/* Question Image Fullscreen Modal */}
      {(assignment.questionImageUrl || questionPages.length > 0) && isQuestionImageModalOpen && (
        <Modal
          isOpen={isQuestionImageModalOpen}
          onClose={() => setIsQuestionImageModalOpen(false)}
          title={`Question Image / Reference Diagram ${questionPages.length > 1 ? `(Page ${activeQuestionPageIndex + 1} of ${questionPages.length})` : ''}`}
          subtitle={assignment.title}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2">
              <img
                src={questionPages[activeQuestionPageIndex] || assignment.questionImageUrl}
                alt={`Question Diagram Page ${activeQuestionPageIndex + 1}`}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
              <span>{assignment.subject} • {assignment.semester} Semester</span>
              <div className="flex items-center gap-2">
                {questionPages.length > 1 && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activeQuestionPageIndex === 0}
                      onClick={() => setActiveQuestionPageIndex((prev) => Math.max(0, prev - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activeQuestionPageIndex >= questionPages.length - 1}
                      onClick={() => setActiveQuestionPageIndex((prev) => Math.min(questionPages.length - 1, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
                <a
                  href={questionPages[activeQuestionPageIndex] || assignment.questionImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
                <Button size="sm" variant="outline" onClick={() => setIsQuestionImageModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

