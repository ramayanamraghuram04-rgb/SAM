import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  FileText, 
  Award, 
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassItem, Assignment, Submission } from '../../types';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DEPARTMENT } from '../../config/constants';
import { openChangePasswordDialog } from '../../components/layout/AppLayout';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectClass?: (cls: ClassItem) => void;
  onSelectAssignment?: (assignment: Assignment) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Assignment Creation State
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [initialAttachmentMode, setInitialAttachmentMode] = useState<'camera' | 'upload' | 'drive' | null>(null);

  const handleOpenCreateAssignment = (mode: 'camera' | 'upload' | 'drive' | 'standard') => {
    setInitialAttachmentMode(mode === 'standard' ? null : mode);
    setIsCreateAssignmentOpen(true);
  };

  const handleAssignmentCreated = (newAsg: Assignment) => {
    setAssignments((prev) => [newAsg, ...prev]);
  };

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [teacherClasses, teacherAssignments, teacherSubmissions] = await Promise.all([
        classService.getTeacherClasses(user.uid),
        assignmentService.getTeacherAssignments(user.uid),
        submissionService.getStaffSubmissions(user.uid),
      ]);
      setClasses(teacherClasses);
      setAssignments(teacherAssignments);
      setSubmissions(teacherSubmissions);
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  if (loading) {
    return <LoadingSpinner message="Loading your faculty dashboard..." />;
  }

  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review'
  ).length;
  const gradedSubmissions = submissions.filter((s) => s.status === 'checked').length;

  return (
    <div className="space-y-6">
      {/* Clean Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-blue-100 text-xs font-bold tracking-wider uppercase border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span>Faculty Portal • {DEPARTMENT} Department</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Hello, {user?.name || 'Faculty Member'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed">
            Here is your high-level academic summary. For specific actions like creating assignments, camera scanning, managing classes, or evaluating student notebooks, open the corresponding sections on the left side.
          </p>
        </div>

        <div className="self-start sm:self-center shrink-0 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenCreateAssignment('camera')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer border border-white/30 shadow-xs"
          >
            <Camera className="w-4 h-4 text-blue-100" />
            <span>Camera Scan</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateAssignment('upload')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer border border-white/30 shadow-xs"
          >
            <Upload className="w-4 h-4 text-blue-100" />
            <span>Upload Question</span>
          </button>

          <button
            type="button"
            id="teacher-dashboard-change-password-btn"
            onClick={openChangePasswordDialog}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer border border-white/30 shadow-xs"
            title="Change your login password"
          >
            <KeyRound className="w-4 h-4 text-blue-100" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Classes KPI */}
        <Card padding="sm" className="bg-white border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-blue-600">
              <Layers className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">My Classes</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{classes.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Teaching subjects</p>
          <button
            onClick={() => onNavigateTab('classes')}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>View Classes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </Card>

        {/* Students KPI */}
        <Card padding="sm" className="bg-white border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified PIN members</p>
          <button
            onClick={() => onNavigateTab('classes')}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <span>View Enrolled</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </Card>

        {/* Assignments KPI */}
        <Card padding="sm" className="bg-white border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Assignments</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{assignments.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active notebook questions</p>
          <button
            onClick={() => onNavigateTab('assignments')}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <span>View Assignments</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </Card>

        {/* Pending Submissions KPI */}
        <Card padding="sm" className="bg-white border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Award className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">To Grade</span>
            </div>
            {pendingSubmissions > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800">
                Pending
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingSubmissions}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {gradedSubmissions} graded so far
          </p>
          <button
            onClick={() => onNavigateTab('submissions')}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            <span>Open Grading</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </Card>
      </div>

      {/* Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentOpen}
        onClose={() => {
          setIsCreateAssignmentOpen(false);
          setInitialAttachmentMode(null);
        }}
        classes={classes}
        onAssignmentCreated={handleAssignmentCreated}
        initialAttachmentMode={initialAttachmentMode}
      />
    </div>
  );
};
