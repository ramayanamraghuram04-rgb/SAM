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
import { StaffUser, StudentUser, Subject, TeachingAssignment, Assignment, Submission, ClassItem } from '../../types';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [studentList, setStudentList] = useState<StudentUser[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ensure default subjects and classes are seeded
      await academicService.seedDefaultSubjects();
      await academicService.seedDefaultClasses();

      const [staff, students, subjects, ta, asgs, subs, cls] = await Promise.all([
        authService.getAllStaff(),
        authService.getAllStudents(),
        academicService.getAllSubjects(),
        academicService.getAllTeachingAssignments(),
        assignmentService.getAllAssignments(),
        submissionService.getAllSubmissions(),
        academicService.getAllClasses(),
      ]);

      setStaffList(staff);
      setStudentList(students);
      setSubjectList(subjects);
      setTeachingAssignments(ta);
      setAssignments(asgs);
      setSubmissions(subs);
      setClassList(cls);
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

  const activeAssignments = assignments.filter((a) => a.status === 'active').length;
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
              <span>{DEPARTMENT_FULL} Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome Admin
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete administrative authority over Staff, Students, Classes, Subjects, and Notebook Verification workflow.
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
              onClick={() => onNavigateTab('classes')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              Manage Classes
            </Button>
          </div>
        </div>
      </div>

      {/* Six Exact Statistics Cards Required by Step 10 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Students */}
        <Card hoverable onClick={() => onNavigateTab('students')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Students</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{studentList.length}</span>
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Total Enrolled</p>
          </div>
        </Card>

        {/* 2. Total Staff */}
        <Card hoverable onClick={() => onNavigateTab('staff')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Staff</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{staffList.length}</span>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Active Teachers</p>
          </div>
        </Card>

        {/* 3. Total Classes */}
        <Card hoverable onClick={() => onNavigateTab('classes')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Classes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{classList.length}</span>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Academic Classes</p>
          </div>
        </Card>

        {/* 4. Total Subjects */}
        <Card hoverable onClick={() => onNavigateTab('subjects')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subjects</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{subjectList.length}</span>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Curricular</p>
          </div>
        </Card>

        {/* 5. Active Assignments */}
        <Card hoverable onClick={() => onNavigateTab('assignments')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assignments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{activeAssignments}</span>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Active Tasks</p>
          </div>
        </Card>

        {/* 6. Pending Submissions */}
        <Card hoverable onClick={() => onNavigateTab('submissions')} className="p-4 cursor-pointer border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{pendingSubmissions}</span>
            <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Pending Grading</p>
          </div>
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
