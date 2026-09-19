import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  BookOpen,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassItem, Assignment, Submission, Semester } from '../../types';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateClassModal } from '../../components/teacher/CreateClassModal';
import { InviteStudentModal } from '../../components/teacher/InviteStudentModal';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';
import { SUPPORTED_SEMESTERS, DEPARTMENT } from '../../config/constants';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSemester, setSelectedSemester] = useState<Semester>('3rd');

  // Modals
  const [isCreateClassOpen, setIsCreateClassOpen] = useState<boolean>(false);
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [selectedClassForInvite, setSelectedClassForInvite] = useState<ClassItem | null>(null);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState<boolean>(false);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const teacherClasses = await classService.getTeacherClasses(user.uid);
      setClasses(teacherClasses);

      const teacherAssignments = await assignmentService.getTeacherAssignments(user.uid);
      setAssignments(teacherAssignments);
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const handleClassCreated = (newClass: ClassItem) => {
    setClasses((prev) => [newClass, ...prev]);
    setSelectedSemester(newClass.semester);
  };

  const handleAssignmentCreated = (newAsg: Assignment) => {
    setAssignments((prev) => [newAsg, ...prev]);
  };

  const openInviteModal = (cls: ClassItem) => {
    setSelectedClassForInvite(cls);
    setIsInviteOpen(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your faculty dashboard..." />;
  }

  // Filter classes by selected semester
  const semesterClasses = classes.filter((c) => c.semester === selectedSemester);
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            Faculty Portal • {DEPARTMENT} Department
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Hello, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-lg">
            Manage your teaching subjects, invite students by college PIN, and grade physical notebook assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateClassOpen(true)}
            className="bg-white text-blue-700 hover:bg-blue-50 shadow-xs"
          >
            Create Class
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setIsCreateAssignmentOpen(true)}
            disabled={classes.length === 0}
            className="bg-blue-900/60 hover:bg-blue-900 border border-white/20 text-white"
          >
            New Assignment
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">My Classes</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{classes.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Across 4 semesters</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Enrolled Students</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified PIN memberships</p>
        </Card>

        <Card padding="sm" className="bg-white col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Assignments</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{assignments.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active notebook questions</p>
        </Card>
      </div>

      {/* Semester Tabs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Assigned Semesters & Classes
            </h2>
            <p className="text-xs text-slate-500">
              Select a semester to view your classes and subjects
            </p>
          </div>

          {/* Semester Selector Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 overflow-x-auto">
            {SUPPORTED_SEMESTERS.map((sem) => {
              const isActive = selectedSemester === sem.id;
              const countInSem = classes.filter((c) => c.semester === sem.id).length;
              return (
                <button
                  key={sem.id}
                  onClick={() => setSelectedSemester(sem.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{sem.label}</span>
                  {countInSem > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {countInSem}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subjects under selected semester */}
        {semesterClasses.length === 0 ? (
          <EmptyState
            title={`No classes in ${selectedSemester} Semester yet`}
            description={`You haven't assigned any subjects to yourself in ${selectedSemester} Semester. Click below to add a class.`}
            actionLabel={`Add ${selectedSemester} Sem Class`}
            onAction={() => setIsCreateClassOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {semesterClasses.map((cls) => (
              <Card key={cls.id} hoverable className="p-5 space-y-3.5 border-slate-200/90">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <SemesterBadge semester={cls.semester} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {cls.department}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{cls.subject}</h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{cls.studentCount || 0} Students enrolled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{cls.assignmentCount || 0} Assignments</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => openInviteModal(cls)}
                  >
                    Invite Student
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => onSelectClass(cls)}
                  >
                    View Class
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assignments Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Recent Assignments
          </h2>
          {assignments.length > 0 && (
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {assignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic p-4 bg-white rounded-2xl border border-slate-200/80 text-center">
            No assignments created yet. Click "New Assignment" above to create your first notebook assignment.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignments.slice(0, 4).map((asg) => (
              <Card
                key={asg.id}
                hoverable
                padding="sm"
                className="cursor-pointer"
                onClick={() => onSelectAssignment(asg)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <SemesterBadge semester={asg.semester} />
                    <span className="text-xs font-semibold text-slate-600">{asg.subject}</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600">{asg.maxMarks} Marks</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{asg.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{asg.description}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onClassCreated={handleClassCreated}
      />

      {selectedClassForInvite && (
        <InviteStudentModal
          isOpen={isInviteOpen}
          onClose={() => {
            setIsInviteOpen(false);
            setSelectedClassForInvite(null);
          }}
          classItem={selectedClassForInvite}
          onInvitationSent={loadData}
        />
      )}

      <CreateAssignmentModal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        classes={classes}
        onAssignmentCreated={handleAssignmentCreated}
      />
    </div>
  );
};
