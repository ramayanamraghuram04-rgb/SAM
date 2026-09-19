import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Shield, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  FolderCheck,
  Award
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

interface LandingPageProps {
  onGoToLogin: (role: 'admin' | 'staff' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">SAM</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                  {DEPARTMENT}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Smart Assignment Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToLogin('admin')}
              leftIcon={<Shield className="w-3.5 h-3.5" />}
            >
              Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToLogin('staff')}
            >
              Staff
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGoToLogin('student')}
            >
              Student
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Exclusive for {DEPARTMENT_FULL} (1st, 3rd, 4th, 5th Sem)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-tight">
          Smart Assignment Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">CSE Department</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Admin manages Staff, Students & Subjects. Staff sets assignments and grades. Students complete notebook assignments and submit Google Drive sharing links.
        </p>

        {/* 3 Portal Cards: Admin, Staff, Student */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-4 text-left">
          {/* Admin Portal Box */}
          <Card hoverable className="p-6 sm:p-7 border-slate-200 bg-white relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-slate-800" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Admin Portal</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                Add and manage Staff and Students. Configure Semesters, Subjects and Staff Teaching Assignments.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => onGoToLogin('admin')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="hover:bg-slate-900 hover:text-white"
              >
                Admin Sign In
              </Button>
            </div>
          </Card>

          {/* Staff Portal Box */}
          <Card hoverable className="p-6 sm:p-7 border-blue-200 bg-white relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Staff / Teacher Portal</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                Login with Mobile Number. View assigned subjects, publish notebook assignments, review Google Drive submissions and award marks /10.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => onGoToLogin('staff')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Staff Sign In
              </Button>
            </div>
          </Card>

          {/* Student Portal Box */}
          <Card hoverable className="p-6 sm:p-7 border-indigo-200 bg-white relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Student Portal</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                Login with Diploma PIN. Access your semester subjects, submit notebook photos via Google Drive links, and view verified marks & feedback.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => onGoToLogin('student')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
              >
                Student Sign In
              </Button>
            </div>
          </Card>
        </div>

        {/* Notice: No Public Registration */}
        <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-xl mx-auto">
          🔒 <strong>Official Portal Notice:</strong> Staff and Student accounts are issued exclusively by the College Admin. Public registration is not permitted.
        </div>

        {/* Feature badges */}
        <div className="pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">Direct Credentials</h5>
              <p className="text-[10px] text-slate-500">Mobile Number & College PIN</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <FolderCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">Google Drive Links</h5>
              <p className="text-[10px] text-slate-500">Notebook photos stored safely</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">Evaluation / 10</h5>
              <p className="text-[10px] text-slate-500">Fast marks & written feedback</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <Smartphone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">PWA Mobile Ready</h5>
              <p className="text-[10px] text-slate-500">Installable on all devices</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>© 2026 SAM — Smart Assignment Manager • Diploma Final-Year Project • {DEPARTMENT_FULL}</p>
      </footer>
    </div>
  );
};
