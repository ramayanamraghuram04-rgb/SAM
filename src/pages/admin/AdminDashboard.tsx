import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  FileText, 
  CheckCircle, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { authService } from '../../services/authService';
import { academicService } from '../../services/academicService';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { StaffUser, StudentUser, Subject, TeachingAssignment, Assignment, Submission } from '../../types';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [studentList, setStudentList] = useState<StudentUser[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ensure default subjects are seeded if fresh project
      await academicService.seedDefaultSubjects();

      const [staff, students, subjects, ta, asgs, subs] = await Promise.all([
        authService.getAllStaff(),
        authService.getAllStudents(),
        academicService.getAllSubjects(),
        academicService.getAllTeachingAssignments(),
        assignmentService.getAllAssignments(),
        submissionService.getAllSubmissions(),
      ]);

      setStaffList(staff);
      setStudentList(students);
      setSubjectList(subjects);
      setTeachingAssignments(ta);
      setAssignments(asgs);
      setSubmissions(subs);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Admin Dashboard..." />;
  }

  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;
  const gradedSubmissions = submissions.filter((s) => s.status === 'checked').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{DEPARTMENT_FULL} Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              SAM College Administration
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Full control over Staff, Students, Semesters, Subjects and Notebook Assignment workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('staff')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500 shadow-md text-xs"
            >
              Add Staff
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('students')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-500 shadow-md text-xs"
            >
              Add Student
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('teaching')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              Assign Teaching
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card hoverable onClick={() => onNavigateTab('staff')} className="p-5 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Staff</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{staffList.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">Faculty</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active teachers & mentors</p>
        </Card>

        <Card hoverable onClick={() => onNavigateTab('students')} className="p-5 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{studentList.length}</span>
            <span className="text-xs text-indigo-600 font-semibold">Enrolled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across 1st, 3rd, 4th, 5th Sem</p>
        </Card>

        <Card hoverable onClick={() => onNavigateTab('teaching')} className="p-5 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Teaching Classes</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{teachingAssignments.length}</span>
            <span className="text-xs text-purple-600 font-semibold">Assigned</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{subjectList.length} total subjects</p>
        </Card>

        <Card hoverable onClick={() => onNavigateTab('overview')} className="p-5 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submissions</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{submissions.length}</span>
            <span className="text-xs text-amber-600 font-semibold">{pendingSubmissions} Pending</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{gradedSubmissions} graded with marks</p>
        </Card>
      </div>

      {/* Quick Access Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Teaching Assignment Overview */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Subject Assignments</h3>
              <p className="text-xs text-slate-500">Active Staff $\rightarrow$ Semester + Subject mappings</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('teaching')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs text-blue-600"
            >
              View All
            </Button>
          </div>

          {teachingAssignments.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-3">No teaching assignments created yet.</p>
              <Button size="sm" variant="primary" onClick={() => onNavigateTab('teaching')}>
                Assign Staff to Subject
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {teachingAssignments.slice(0, 5).map((ta) => (
                <div
                  key={ta.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{ta.staffName}</span>
                      <Badge variant="blue" size="sm">{ta.semester} Sem</Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{ta.subjectName}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{ta.staffMobile}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Semester & Subject Breakdown */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Structure</h3>
              <p className="text-xs text-slate-500">{DEPARTMENT} Curricular Subjects by Semester</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('subjects')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs text-indigo-600"
            >
              Manage Subjects
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(['1st', '3rd', '4th', '5th'] as const).map((sem) => {
              const count = subjectList.filter((s) => s.semester === sem).length;
              const studentCount = studentList.filter((s) => s.semester === sem).length;
              return (
                <div
                  key={sem}
                  onClick={() => onNavigateTab('subjects')}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{sem} Semester</span>
                    <Badge variant="gray" size="sm">{studentCount} Students</Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">{count} Subjects</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
