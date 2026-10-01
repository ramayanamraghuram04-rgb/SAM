import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  GraduationCap, 
  Layers, 
  CheckCircle2, 
  Clock,
  Eye,
  Award,
  Send,
  Lock,
  Archive,
  Trash2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { authService } from '../../services/authService';
import { academicService } from '../../services/academicService';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Submission, Semester, StaffUser } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

export const AdminAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgList, subList, staff] = await Promise.all([
        assignmentService.getAllAssignments(),
        submissionService.getAllSubmissions(),
        authService.getAllStaff(),
      ]);
      setAssignments(asgList);
      setSubmissions(subList);
      setStaffList(staff);
    } catch (err) {
      console.error('Error loading assignments for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublishAssignment = async (asg: Assignment) => {
    if (!user?.uid) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await assignmentService.publishAssignment(asg.id, user.uid, true);
      if (res.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === asg.id ? res.assignment! : a)));
        setSelectedAssignment(res.assignment);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to publish assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAssignment = async (asg: Assignment) => {
    if (!user?.uid) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await assignmentService.closeAssignment(asg.id, user.uid, true);
      if (res.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === asg.id ? res.assignment! : a)));
        setSelectedAssignment(res.assignment);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to close assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveAssignment = async (asg: Assignment) => {
    if (!user?.uid) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await assignmentService.archiveAssignment(asg.id, user.uid, true);
      if (res.assignment) {
        setAssignments((prev) => prev.map((a) => (a.id === asg.id ? res.assignment! : a)));
        setSelectedAssignment(res.assignment);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to archive assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssignment = async (asg: Assignment) => {
    if (!user?.uid) return;
    const confirmMsg = `Are you sure you want to delete assignment "${asg.title}"?\n\nNote: If students have already submitted notebook photos, it will safely be ARCHIVED instead of permanently deleted.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await assignmentService.deleteAssignment(asg.id, user.uid, true);
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== asg.id));
        setSelectedAssignment(null);
      } else if (res.error) {
        // If archived due to existing submissions
        setActionError(res.error);
        await loadData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSem = selectedSemester === 'all' || a.semester === selectedSemester;
    const matchesStaff = selectedStaff === 'all' || a.staffId === selectedStaff || a.teacherId === selectedStaff;

    const isDraft = a.status === 'draft' || a.published === false;
    const isPublished = (a.status === 'published' || a.status === 'active') && a.published !== false;
    const isClosed = a.status === 'closed';
    const isArchived = a.status === 'archived';

    let matchesStatus = true;
    if (selectedStatus === 'draft') matchesStatus = isDraft;
    else if (selectedStatus === 'published') matchesStatus = isPublished;
    else if (selectedStatus === 'closed') matchesStatus = isClosed;
    else if (selectedStatus === 'archived') matchesStatus = isArchived;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.subject.toLowerCase().includes(q) ||
      (a.teacherName || '').toLowerCase().includes(q);

    return matchesSem && matchesStaff && matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading System Assignments..." />;
  }

  const assignmentSubs = selectedAssignment 
    ? submissions.filter((s) => s.assignmentId === selectedAssignment.id)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Assignments</h1>
          <p className="text-xs text-slate-500">
            Monitor and oversee all notebook assignments created by faculty across {DEPARTMENT}.
          </p>
        </div>
        <Badge variant="blue" size="md">
          {assignments.length} Total Assignments
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments by title, subject, or faculty name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedSemester === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            {(['1st', '3rd', '4th', '5th'] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedSemester === sem ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {sem} Sem
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Staff & Status */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Faculty:</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">All Faculty</option>
              {staffList.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
            <p className="text-sm font-bold text-slate-700">
              {assignments.length === 0 ? "No assignments found" : "No assignments match the selected filters"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {assignments.length === 0 ? "No assignments have been created in the system yet." : "Assignments published by staff will appear here."}
            </p>
          </div>
        ) : (
          filteredAssignments.map((asg) => {
            const subs = submissions.filter((s) => s.assignmentId === asg.id);
            const graded = subs.filter((s) => s.status === 'checked').length;
            const pending = subs.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;
            const isDraft = asg.status === 'draft' || asg.published === false;
            const isClosed = asg.status === 'closed';

            return (
              <Card 
                key={asg.id} 
                className="p-5 border-slate-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setActionError(null);
                  setSelectedAssignment(asg);
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {asg.semester} Sem
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {asg.subject}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {asg.teacherName || 'Faculty'}
                      </span>
                      {isDraft ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          DRAFT
                        </span>
                      ) : isClosed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                          CLOSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          PUBLISHED
                        </span>
                      )}

                      {asg.questionImageUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <ImageIcon className="w-2.5 h-2.5" />
                          <span>Image Attached</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {asg.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed max-w-2xl">
                      {asg.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: <strong>{formatDate(asg.dueDate)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {subs.length} Submissions
                      </span>
                      {pending > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
                          {pending} Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ASSIGNMENT DETAILS & MANAGEMENT MODAL */}
      <Modal
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment?.title || 'Assignment Details'}
        subtitle={selectedAssignment ? `${selectedAssignment.semester} Semester • ${selectedAssignment.subject}` : ''}
        maxWidth="lg"
      >
        {selectedAssignment && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                <span>Faculty: <strong className="text-slate-900">{selectedAssignment.teacherName || 'Assigned Staff'}</strong></span>
                <span>Max Marks: <strong className="text-blue-700">{selectedAssignment.maxMarks} Marks</strong></span>
                <span>Due Date: <strong className="text-slate-900">{formatDate(selectedAssignment.dueDate)}</strong></span>
                <span>Status: <strong className="uppercase font-bold text-slate-900">{selectedAssignment.status}</strong></span>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Notebook Question Prompt
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedAssignment.description}
                </p>
              </div>

              {selectedAssignment.instructions && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Student Instructions
                  </span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedAssignment.instructions}
                  </p>
                </div>
              )}

              {selectedAssignment.questionImageUrl && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Question Image
                  </span>
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                    <img
                      src={selectedAssignment.questionImageUrl}
                      alt="Question"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90"
                      onClick={() => window.open(selectedAssignment.questionImageUrl, '_blank')}
                    />
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-900">Attached Question Photo / Diagram</p>
                      <p className="text-[11px] text-slate-400">Stored in Cloudinary (sam/questions)</p>
                      <a
                        href={selectedAssignment.questionImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 pt-0.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Size</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Management Controls */}
            <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700">Admin Actions:</span>
              <div className="flex flex-wrap items-center gap-2">
                {(selectedAssignment.status === 'draft' || selectedAssignment.published === false) && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    onClick={() => handlePublishAssignment(selectedAssignment)}
                    isLoading={actionLoading}
                  >
                    Publish to Class
                  </Button>
                )}

                {selectedAssignment.status !== 'closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                    onClick={() => handleCloseAssignment(selectedAssignment)}
                    disabled={actionLoading}
                  >
                    Close Assignment
                  </Button>
                )}

                {selectedAssignment.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => handleArchiveAssignment(selectedAssignment)}
                    disabled={actionLoading}
                  >
                    Archive
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                  onClick={() => handleDeleteAssignment(selectedAssignment)}
                  disabled={actionLoading}
                  className="hover:bg-rose-50 hover:text-rose-700"
                >
                  Delete / Archive
                </Button>
              </div>
            </div>

            {/* Submissions Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Student Submissions ({assignmentSubs.length})
              </h4>
              {assignmentSubs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No students have submitted this assignment yet.
                </div>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {assignmentSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{sub.studentName}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>{sub.studentPIN}</span>
                          {sub.verificationCode && (
                            <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              Code: {sub.verificationCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.status === 'checked' ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {sub.marks}/{selectedAssignment.maxMarks} Marks
                          </span>
                        ) : sub.status === 'returned' ? (
                          <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            Returned
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Pending Review
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedAssignment(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
