import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CreditCard, 
  Layers, 
  LogOut, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassMember } from '../../types';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

export const StudentProfilePage: React.FC = () => {
  const { user, studentUser, logout } = useAuth();
  const [classes, setClasses] = useState<ClassMember[]>([]);

  useEffect(() => {
    if (user?.uid) {
      classService.getStudentClasses(user.uid).then(setClasses);
    }
  }, [user?.uid]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500">Your college identity and enrolled classes</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-indigo-500/20">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                PIN: {studentUser?.pin}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {DEPARTMENT} Department
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
            <span className="text-slate-400 block font-medium">College PIN</span>
            <span className="font-bold text-slate-800 font-mono mt-0.5 block">{studentUser?.pin}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Account Role</span>
            <span className="font-bold text-slate-800 mt-0.5 block">Diploma Student Account</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-400 block font-medium">Member Since</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {formatDate(user?.createdAt || new Date().toISOString())}
            </span>
          </div>
        </div>

        {/* Enrolled Classes summary */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Enrolled Classes ({classes.length})
          </h3>

          {classes.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No classes enrolled yet.</p>
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
                  <span className="text-xs text-slate-400">
                    Joined {formatDate(cls.joinedAt)}
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
            Signing out will completely clear your session and prevent other users on this phone from seeing your assignments or marks.
          </p>
        </div>
      </Card>
    </div>
  );
};
