import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Phone, 
  Layers, 
  LogOut, 
  ShieldCheck, 
  Calendar,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassItem } from '../../types';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

export const TeacherProfilePage: React.FC = () => {
  const { user, teacherUser, logout } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    if (user?.uid) {
      classService.getTeacherClasses(user.uid).then(setClasses);
    }
  }, [user?.uid]);

  // Group classes by semester
  const semestersTaught = Array.from(new Set(classes.map((c) => c.semester)));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Profile</h1>
        <p className="text-xs text-slate-500">Your registered teacher account and assigned classes</p>
      </div>

      {/* Main Profile Card */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/20">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                CSE Faculty
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {teacherUser?.mobile}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Department</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{DEPARTMENT_FULL} ({DEPARTMENT})</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Registered Mobile</span>
            <span className="font-bold text-slate-800 mt-0.5 block">+91 {teacherUser?.mobile}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Account Type</span>
            <span className="font-bold text-slate-800 mt-0.5 block">Permanent Faculty Account</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Member Since</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {formatDate(user?.createdAt || new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* Assigned Teaching Schedule */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Assigned Subjects & Semesters ({classes.length})
          </h3>

          {classes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No classes assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <SemesterBadge semester={cls.semester} />
                    <span className="text-sm font-bold text-slate-900">{cls.subject}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {cls.studentCount || 0} Students
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-slate-100">
          <Button
            variant="danger"
            size="md"
            fullWidth
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={logout}
          >
            Sign Out from SAM
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-2">
            Signing out will completely clear your session from this device.
          </p>
        </div>
      </Card>
    </div>
  );
};
