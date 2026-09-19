import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  FileText, 
  Award, 
  Clock, 
  ArrowRight, 
  Mail, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Submission, ClassMember, Invitation } from '../../types';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { inviteService } from '../../services/inviteService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge, SubmissionStatusBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { InvitationCard } from '../../components/student/InvitationCard';
import { AssignmentCard } from '../../components/student/AssignmentCard';
import { SubmitAssignmentModal } from '../../components/student/SubmitAssignmentModal';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

interface StudentDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectAssignment: (assignment: Assignment) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateTab,
  onSelectAssignment,
}) => {
  const { user, studentUser } = useAuth();
  const [classes, setClasses] = useState<ClassMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Submit Modal
  const [selectedAsgForSubmit, setSelectedAsgForSubmit] = useState<{
    assignment: Assignment;
    submission?: Submission | null;
  } | null>(null);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [enrolled, asgs, subs, invs] = await Promise.all([
        classService.getStudentClasses(user.uid),
        assignmentService.getStudentAssignments(user.uid),
        submissionService.getStudentSubmissions(user.uid),
        inviteService.getStudentInvitations(user.uid),
      ]);
      setClasses(enrolled);
      setAssignments(asgs);
      setSubmissions(subs);
      setInvitations(invs);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  if (loading) {
    return <LoadingSpinner message="Loading student dashboard..." />;
  }

  const checkedCount = submissions.filter((s) => s.status === 'checked').length;
  const pendingCount = Math.max(0, assignments.length - submissions.length);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/20">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
            <span>Student Portal</span>
            <span>•</span>
            <span className="font-mono bg-indigo-800/80 px-2 py-0.5 rounded text-white border border-indigo-400/30">
              PIN: {studentUser?.pin}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 max-w-lg">
            Complete your notebook questions, upload photos to Google Drive, and submit links for evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {invitations.length > 0 && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={() => onNavigateTab('classes')}
              className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-xs animate-bounce"
            >
              {invitations.length} Class Invite{invitations.length > 1 ? 's' : ''}
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateTab('assignments')}
            className="bg-indigo-900/60 hover:bg-indigo-900 border border-white/20 text-white"
          >
            My Assignments
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Classes</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{classes.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">CSE Subjects</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">To Submit</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Pending notebooks</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Submitted</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{submissions.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Uploaded on Drive</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Checked</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{checkedCount}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Evaluated with Marks</p>
        </Card>
      </div>

      {/* Class Invitations Section (if any) */}
      {invitations.length > 0 && (
        <div className="space-y-3 bg-blue-50/70 p-5 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900">
                Pending Class Invitations ({invitations.length})
              </h2>
            </div>
            <span className="text-xs text-blue-700 font-semibold">Action Required</span>
          </div>
          <p className="text-xs text-slate-600">
            A teacher searched your PIN and sent you an invitation. You must accept to enroll and access assignments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {invitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onResponded={loadData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Classes Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            My Enrolled Classes ({classes.length})
          </h2>
          <button
            onClick={() => onNavigateTab('classes')}
            className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {classes.length === 0 ? (
          <EmptyState
            title="Not enrolled in any classes yet"
            description="Give your PIN to your teacher. Once your teacher sends an invitation, it will appear above for you to accept."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {classes.map((cls) => (
              <Card key={cls.id} hoverable padding="sm" className="space-y-2">
                <div className="flex items-center gap-2">
                  <SemesterBadge semester={cls.semester} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{DEPARTMENT}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{cls.subject}</h4>
                <p className="text-[11px] text-slate-500">Teacher: Faculty Member</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notebook Assignments */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Assignments to Submit
          </h2>
          {assignments.length > 0 && (
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View All Assignments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-5 bg-white rounded-2xl border border-slate-200/80 text-center">
            No assignments assigned yet. Once your teachers publish questions in your enrolled classes, they will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.slice(0, 4).map((asg) => {
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
