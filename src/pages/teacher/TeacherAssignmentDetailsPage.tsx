import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Users,
  Edit3
} from 'lucide-react';
import { Assignment, Submission, ClassMember } from '../../types';
import { submissionService } from '../../services/submissionService';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge, SubmissionStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { GradeSubmissionModal } from '../../components/teacher/GradeSubmissionModal';
import { SubmissionCard } from '../../components/teacher/SubmissionCard';
import { formatDate } from '../../utils/dateUtils';

interface TeacherAssignmentDetailsPageProps {
  assignment: Assignment;
  onBack: () => void;
}

export const TeacherAssignmentDetailsPage: React.FC<TeacherAssignmentDetailsPageProps> = ({
  assignment,
  onBack,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeGradingSubmission, setActiveGradingSubmission] = useState<Submission | null>(null);

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
              Open Google Drive links to check physical notebook photos and enter marks
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
                ? 'No students have submitted this assignment yet. Submissions will appear as students upload their Google Drive links.'
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
          maxMarks={assignment.maxMarks}
          onGraded={handleGraded}
        />
      )}
    </div>
  );
};
