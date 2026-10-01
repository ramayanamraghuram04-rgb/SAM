import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Users,
  Edit3,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { Assignment, Submission, ClassMember } from '../../types';
import { submissionService } from '../../services/submissionService';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { SemesterBadge, SubmissionStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { GradeSubmissionModal } from '../../components/teacher/GradeSubmissionModal';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';
import { SubmissionCard } from '../../components/teacher/SubmissionCard';
import { formatDate } from '../../utils/dateUtils';

interface TeacherAssignmentDetailsPageProps {
  assignment: Assignment;
  onBack: () => void;
}

export const TeacherAssignmentDetailsPage: React.FC<TeacherAssignmentDetailsPageProps> = ({
  assignment: initialAssignment,
  onBack,
}) => {
  const [assignment, setAssignment] = useState<Assignment>(initialAssignment);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeGradingSubmission, setActiveGradingSubmission] = useState<Submission | null>(null);
  const [isQuestionImageModalOpen, setIsQuestionImageModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [activeQuestionPageIndex, setActiveQuestionPageIndex] = useState<number>(0);

  const questionPages = (assignment.questionImageUrls && assignment.questionImageUrls.length > 0)
    ? assignment.questionImageUrls
    : (assignment.questionImageUrl ? [assignment.questionImageUrl] : []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subs, members] = await Promise.all([
        submissionService.getAssignmentSubmissions(assignment.id),
        classService.getClassStudents(assignment.classId),
      ]);
      setSubmissions(subs);
      setEnrolledStudents(members);
    } catch (err) {
      console.error('Error fetching assignment submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignment.id, assignment.classId]);

  const handleGraded = (updated: Submission) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const checkedCount = submissions.filter((s) => s.status === 'checked').length;
  const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
  const totalEnrolled = enrolledStudents.length;

  const filteredSubmissions = filterStatus === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filterStatus);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </button>

      {/* Assignment Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <SemesterBadge semester={assignment.semester} />
              <span className="text-xs font-bold text-slate-700">{assignment.subject}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Assignment
            </Button>
            <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              Maximum: {assignment.maxMarks} Marks
            </span>
          </div>
        </div>

        {/* Notebook Question Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Notebook Assignment Question
          </span>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {assignment.description}
          </p>
        </div>

        {/* Attached Question Image */}
        {assignment.questionImageUrl && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Question Image / Attached Diagram</span>
              </span>
              <div className="flex items-center gap-2">
                {questionPages.length > 1 && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {questionPages.length} Pages
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsQuestionImageModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Enlarge</span>
                </button>
              </div>
            </div>

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

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img
                src={questionPages[activeQuestionPageIndex] || assignment.questionImageUrl}
                alt="Question Diagram"
                className="w-full max-h-[350px] object-contain cursor-pointer hover:opacity-95"
                onClick={() => setIsQuestionImageModalOpen(true)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Due Date: {formatDate(assignment.dueDate)}</span>
          </div>
          <div>•</div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{totalEnrolled} Students Enrolled</span>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Received</div>
          <div className="text-xl font-black text-blue-600 mt-0.5">{submissions.length}</div>
          <p className="text-[10px] text-slate-400">Total Submissions</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">To Evaluate</div>
          <div className="text-xl font-black text-amber-600 mt-0.5">{submittedCount}</div>
          <p className="text-[10px] text-slate-400">Pending Review</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Checked</div>
          <div className="text-xl font-black text-emerald-600 mt-0.5">{checkedCount}</div>
          <p className="text-[10px] text-slate-400">Graded with marks</p>
        </Card>
      </div>

      {/* Submissions List Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Student Submissions
            </h2>
            <p className="text-xs text-slate-500">
              Review notebook pages and enter marks
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setFilterStatus('submitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'submitted'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Needs Grading ({submittedCount})
            </button>
            <button
              onClick={() => setFilterStatus('checked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'checked'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Checked ({checkedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading student submissions..." />
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            title="No submissions found"
            description={
              submissions.length === 0
                ? 'No students have submitted this assignment yet. Submissions will appear as students submit their assignments.'
                : 'No submissions match your selected filter.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                maxMarks={assignment.maxMarks}
                onGradeClick={(targetSub) => setActiveGradingSubmission(targetSub)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Grading Modal */}
      {activeGradingSubmission && (
        <GradeSubmissionModal
          isOpen={Boolean(activeGradingSubmission)}
          onClose={() => setActiveGradingSubmission(null)}
          submission={activeGradingSubmission}
          submissions={filteredSubmissions}
          onNavigate={(targetSub) => setActiveGradingSubmission(targetSub)}
          maxMarks={assignment.maxMarks}
          subjectName={assignment.subject}
          onGraded={handleGraded}
        />
      )}

      {/* Edit Assignment Modal */}
      {isEditModalOpen && (
        <CreateAssignmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingAssignment={assignment}
          onAssignmentCreated={(updatedAsg) => {
            setAssignment(updatedAsg);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Question Image Modal */}
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
                alt="Question Diagram Full"
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

