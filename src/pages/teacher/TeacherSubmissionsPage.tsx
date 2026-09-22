import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  Calendar, 
  Camera, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  FileText,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Submission, Assignment } from '../../types';
import { submissionService } from '../../services/submissionService';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, SubmissionStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { GradeSubmissionModal } from '../../components/teacher/GradeSubmissionModal';
import { formatDateTime } from '../../utils/dateUtils';

export const TeacherSubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');

  // Active evaluation modal state
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

  const loadData = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [asgList, subList] = await Promise.all([
        assignmentService.getTeacherAssignments(user.uid),
        submissionService.getStaffSubmissions(user.uid),
      ]);
      setAssignments(asgList);
      setSubmissions(subList);
    } catch (err) {
      console.error('Error loading teacher submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const handleGraded = (updated: Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (activeSubmission?.id === updated.id) {
      setActiveSubmission(updated);
    }
  };

  // Extract unique subjects from authorized assignments
  const availableSubjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)));

  // Filtered and searched list
  const filteredSubmissions = submissions
    .filter((sub) => {
      // Find matching assignment for class / subject metadata
      const asg = assignments.find((a) => a.id === sub.assignmentId);

      // Search by Student Name or PIN
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sub.studentName?.toLowerCase().includes(query);
        const matchesPIN = sub.studentPIN?.toLowerCase().includes(query);
        const matchesTitle = sub.assignmentTitle?.toLowerCase().includes(query);
        if (!matchesName && !matchesPIN && !matchesTitle) return false;
      }

      // Filter by Assignment
      if (selectedAssignmentId !== 'all' && sub.assignmentId !== selectedAssignmentId) {
        return false;
      }

      // Filter by Class / Semester
      if (selectedSemester !== 'all') {
        const sem = asg?.semester || (sub.classId?.includes(selectedSemester) ? selectedSemester : null);
        if (sem !== selectedSemester) return false;
      }

      // Filter by Subject
      if (selectedSubject !== 'all') {
        const subj = asg?.subject;
        if (subj !== selectedSubject) return false;
      }

      // Filter by Status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'pending') {
          if (sub.status !== 'submitted' && sub.status !== 'under_review') return false;
        } else if (selectedStatus === 'checked') {
          if (sub.status !== 'checked') return false;
        } else if (selectedStatus === 'returned') {
          if (sub.status !== 'returned') return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const pendingCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;
  const checkedCount = submissions.filter((s) => s.status === 'checked').length;
  const returnedCount = submissions.filter((s) => s.status === 'returned').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Submissions</h1>
          <p className="text-xs text-slate-500">
            Review student notebook pages, verify security codes manually, award marks, and provide feedback.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Pending: {pendingCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Graded: {checkedCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Returned: {returnedCount}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, PIN, or assignment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('checked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === 'checked'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Graded ({checkedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('returned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === 'returned'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Returned ({returnedCount})
            </button>
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Assignment Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Assignment:</span>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none max-w-[180px] truncate"
            >
              <option value="all">All Assignments</option>
              {assignments.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  {asg.title}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Class:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">All Classes</option>
              <option value="1st">1st Sem</option>
              <option value="3rd">3rd Sem</option>
              <option value="4th">4th Sem</option>
              <option value="5th">5th Sem</option>
            </select>
          </div>

          {/* Date Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-semibold text-slate-500">Date:</span>
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <LoadingSpinner message="Loading submissions..." />
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          description={
            submissions.length === 0
              ? "You don't have any student submissions yet. Once students capture their notebook pages, they will appear here."
              : 'No submissions match your current filter and search criteria.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const asg = assignments.find((a) => a.id === sub.assignmentId);
            const pageCount = sub.imageUrls?.length || 1;
            const isEvaluated = sub.status === 'checked';
            const isReturned = sub.status === 'returned';

            return (
              <div
                key={sub.id}
                onClick={() => setActiveSubmission(sub)}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{sub.studentName}</span>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sub.studentPIN}
                    </span>
                    {asg?.semester && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {asg.semester} Sem
                      </span>
                    )}
                    {sub.verificationCode && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        Code: {sub.verificationCode}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{sub.assignmentTitle}</span>
                    <span>•</span>
                    <span>{asg?.subject || 'Assignment'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      {pageCount} Page{pageCount > 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>{formatDateTime(sub.submittedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <SubmissionStatusBadge status={sub.status} />
                    {isEvaluated && sub.marks !== null && (
                      <span className="block text-xs font-black text-emerald-700 mt-1">
                        {sub.marks} / {asg?.maxMarks || 10} Marks
                      </span>
                    )}
                    {isReturned && (
                      <span className="block text-[11px] font-bold text-rose-600 mt-1">
                        Returned
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant={isEvaluated ? 'outline' : 'primary'}
                    size="sm"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubmission(sub);
                    }}
                  >
                    {isEvaluated ? 'Review' : 'Evaluate'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grade Submission Modal */}
      {activeSubmission && (
        <GradeSubmissionModal
          isOpen={Boolean(activeSubmission)}
          onClose={() => setActiveSubmission(null)}
          submission={activeSubmission}
          maxMarks={assignments.find((a) => a.id === activeSubmission.assignmentId)?.maxMarks || 10}
          onGraded={handleGraded}
        />
      )}
    </div>
  );
};
