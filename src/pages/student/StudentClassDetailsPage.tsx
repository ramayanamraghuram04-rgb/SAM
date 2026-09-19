import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { ClassMember, Assignment, Submission } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { AssignmentCard } from '../../components/student/AssignmentCard';
import { SubmitAssignmentModal } from '../../components/student/SubmitAssignmentModal';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

interface StudentClassDetailsPageProps {
  classMember: ClassMember;
  onBack: () => void;
  onSelectAssignment: (assignment: Assignment) => void;
}

export const StudentClassDetailsPage: React.FC<StudentClassDetailsPageProps> = ({
  classMember,
  onBack,
  onSelectAssignment,
}) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedAsgForSubmit, setSelectedAsgForSubmit] = useState<{
    assignment: Assignment;
    submission?: Submission | null;
  } | null>(null);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [asgList, subList] = await Promise.all([
        assignmentService.getClassAssignments(classMember.classId),
        submissionService.getStudentSubmissions(user.uid),
      ]);
      setAssignments(asgList);
      setSubmissions(subList);
    } catch (err) {
      console.error('Error fetching class details for student:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classMember.classId, user?.uid]);

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

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Classes</span>
      </button>

      {/* Class Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SemesterBadge semester={classMember.semester} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                {DEPARTMENT}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {classMember.subject}
            </h1>
            <p className="text-xs text-slate-500">Joined on {formatDate(classMember.joinedAt)}</p>
          </div>
        </div>
      </div>

      {/* Assignments in this class */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Class Assignments ({assignments.length})
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading assignments..." />
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No assignments in this class yet"
            description="Your teacher hasn't published any assignments for this subject yet. When new questions are posted, they will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => {
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
      </div>

      {/* Submit Assignment Modal */}
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
