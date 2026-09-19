import React, { useState, useEffect } from 'react';
import { FileText, Filter, CheckCircle2, Clock, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Submission } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { AssignmentCard } from '../../components/student/AssignmentCard';
import { SubmitAssignmentModal } from '../../components/student/SubmitAssignmentModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

interface StudentAssignmentsPageProps {
  onSelectAssignment: (assignment: Assignment) => void;
}

export const StudentAssignmentsPage: React.FC<StudentAssignmentsPageProps> = ({
  onSelectAssignment,
}) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'checked'>('all');

  const [selectedAsgForSubmit, setSelectedAsgForSubmit] = useState<{
    assignment: Assignment;
    submission?: Submission | null;
  } | null>(null);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [asgList, subList] = await Promise.all([
        assignmentService.getStudentAssignments(user.uid),
        submissionService.getStudentSubmissions(user.uid),
      ]);
      setAssignments(asgList);
      setSubmissions(subList);
    } catch (err) {
      console.error('Error fetching student assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const handleSubmitted = (newSub: Submission) => {
    setSubmissions((prev) => {
      const idx = prev.findIndex((s) => s.id === newSub.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSub;
        return copy;
      }
      return [newSub, ...prev];
    });
  };

  // Filter logic
  const filteredAssignments = assignments.filter((asg) => {
    const sub = submissions.find((s) => s.assignmentId === asg.id);
    const status = sub?.status || 'not_submitted';

    if (filterStatus === 'pending') {
      return status === 'not_submitted' || status === 'returned';
    }
    if (filterStatus === 'submitted') {
      return status === 'submitted' || status === 'under_review';
    }
    if (filterStatus === 'checked') {
      return status === 'checked';
    }
    return true;
  });

  const pendingCount = assignments.filter((a) => {
    const sub = submissions.find((s) => s.assignmentId === a.id);
    return !sub || sub.status === 'not_submitted' || sub.status === 'returned';
  }).length;

  const checkedCount = submissions.filter((s) => s.status === 'checked').length;
  const submittedCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notebook Assignments</h1>
          <p className="text-xs text-slate-500">
            Write answers in physical notebooks, upload photos to Google Drive, and submit links
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            filterStatus === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({assignments.length})
        </button>

        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            filterStatus === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          To Submit ({pendingCount})
        </button>

        <button
          onClick={() => setFilterStatus('submitted')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            filterStatus === 'submitted'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Submitted ({submittedCount})
        </button>

        <button
          onClick={() => setFilterStatus('checked')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            filterStatus === 'checked'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Checked ({checkedCount})
        </button>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <LoadingSpinner message="Loading your assignments..." />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments match filter"
          description={
            assignments.length === 0
              ? "You don't have any assignments yet. Make sure you accept teacher invitations in 'My Classes'."
              : 'No assignments found in this status category.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((asg) => {
            const sub = submissions.find((s) => s.assignmentId === asg.id);
            return (
              <AssignmentCard
                key={asg.id}
                assignment={asg}
                submission={sub}
                onSubmitClick={(targetAsg, targetSub) => {
                  setSelectedAsgForSubmit({ assignment: targetAsg, submission: targetSub });
                }}
                onViewClick={() => onSelectAssignment(asg)}
              />
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedAsgForSubmit && (
        <SubmitAssignmentModal
          isOpen={Boolean(selectedAsgForSubmit)}
          onClose={() => setSelectedAsgForSubmit(null)}
          assignment={selectedAsgForSubmit.assignment}
          existingSubmission={selectedAsgForSubmit.submission}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
};
