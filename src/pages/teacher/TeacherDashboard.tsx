import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Users, 
  FileText, 
  Award, 
  ArrowRight,
  BookOpen,
  Bell,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
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
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';
import { openChangePasswordDialog } from '../../components/layout/AppLayout';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';

interface TeacherDashboardProps {
  onNavigateTab: (tab: string) => void;
  onSelectClass: (cls: ClassItem) => void;
  onSelectAssignment: (assignment: Assignment) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onNavigateTab,
  onSelectClass,
  onSelectAssignment,
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

        <div className="self-start sm:self-center shrink-0 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Camera className="w-4 h-4 text-blue-200" />}
            onClick={() => handleOpenCreateAssignment('camera')}
            className="border-white/30 text-white hover:bg-white/10 text-xs shadow-xs"
          >
            Camera Scan
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="w-4 h-4 text-blue-200" />}
            onClick={() => handleOpenCreateAssignment('upload')}
            className="border-white/30 text-white hover:bg-white/10 text-xs shadow-xs"
          >
            Upload Question
          </Button>

          <button
            type="button"
            id="teacher-dashboard-change-password-btn"
            onClick={openChangePasswordDialog}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-xs transition-all active:scale-[0.98] cursor-pointer border border-white/20"
            title="Change your login password"
          >
            <KeyRound className="w-3.5 h-3.5" />
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

      {/* Sections Directory: Highlighting left-side navigation for inside elements */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Left Navigation Directory</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Portal Sections
            </h2>
            <p className="text-xs text-slate-500">
              Need to create assignments, upload files, manage subjects, or grade notebooks? Go to these sections placed on the left side:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: My Classes */}
          <div 
            onClick={() => onNavigateTab('classes')}
            className="group p-5 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/40 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {classes.length} {classes.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                My Classes
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Create new subject classes across semesters, inspect enrolled student rosters, and invite students via college PIN.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
              <span>Go to My Classes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Assignments */}
          <div 
            onClick={() => onNavigateTab('assignments')}
            className="group p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {assignments.length} {assignments.length === 1 ? 'Assignment' : 'Assignments'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Assignments
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Create questions with live Camera Scan or question file uploads, configure 10 max marks, and manage drafts and published questions.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              <span>Go to Assignments</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Submissions */}
          <div 
            onClick={() => onNavigateTab('submissions')}
            className="group p-5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/40 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingSubmissions} to review
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Submissions
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Review photos of student handwritten notebook answers, evaluate questions, and award verified marks out of 10.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-amber-600 group-hover:text-amber-700">
              <span>Go to Submissions</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Clean Quick Overview: Classes & Assignments Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classes Snapshot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Teaching Classes Overview</h3>
            </div>
            <button
              onClick={() => onNavigateTab('classes')}
              className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in My Classes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {classes.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              No classes created yet. Go to <button onClick={() => onNavigateTab('classes')} className="text-blue-600 font-bold underline">My Classes</button> on the left side to add your first subject.
            </p>
          ) : (
            <div className="space-y-2">
              {classes.slice(0, 3).map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => onSelectClass(cls)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <SemesterBadge semester={cls.semester} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {cls.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {cls.studentCount || 0} Students • {cls.assignmentCount || 0} Assignments
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Snapshot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Assignments Overview</h3>
            </div>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in Assignments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {assignments.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              No assignments published yet. Go to <button onClick={() => onNavigateTab('assignments')} className="text-emerald-600 font-bold underline">Assignments</button> on the left side to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.slice(0, 3).map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => onSelectAssignment(asg)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SemesterBadge semester={asg.semester} />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {asg.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {asg.subject} • Max {asg.maxMarks} Marks
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Quick Launch Hub: Camera Section & Upload Option */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Assignment Creation & Upload
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Create or Upload Assignment</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose how you want to provide question materials for students to write in their notebooks
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
              {classes.length} Authorized {classes.length === 1 ? 'Class' : 'Classes'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Camera Capture Section */}
          <div 
            onClick={() => handleOpenCreateAssignment('camera')}
            className="p-4 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/80 cursor-pointer shadow-xs transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 mb-1">Camera Capture</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Snap question paper, textbook page, handwritten notes directly with camera.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Upload File Option */}
          <div 
            onClick={() => handleOpenCreateAssignment('upload')}
            className="p-4 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 cursor-pointer shadow-xs transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-950 mb-1">Upload Question File</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select or drag-and-drop JPG, PNG, or WEBP question diagram/document.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Standard Creation Form */}
          <div 
            onClick={() => handleOpenCreateAssignment('standard')}
            className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer shadow-xs transition-all"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Standard Assignment</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Type questions directly, define due dates, max marks (default 10), and instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
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
