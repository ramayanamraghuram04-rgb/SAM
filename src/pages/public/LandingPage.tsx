import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
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
  onSelectRole: (role: 'teacher' | 'student') => void;
  onGoToLogin: (role: 'teacher' | 'student') => void;
  onGoToRegister: (role: 'teacher' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToRegister,
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
              onClick={() => onGoToLogin('student')}
            >
              Student Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGoToLogin('teacher')}
            >
              Teacher Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Exclusive for {DEPARTMENT_FULL} (1st, 3rd, 4th, 5th Sem)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-tight">
          Effortless Assignment Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">CSE Diploma</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Write assignments in physical notebooks, upload photos to Google Drive, and submit sharing links. Teachers grade and publish feedback in real-time.
        </p>

        {/* Portals Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto pt-4 text-left">
          {/* Teacher Portal Box */}
          <Card hoverable className="p-6 sm:p-7 border-blue-200 bg-white relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Teacher Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              Manage classes across 1st, 3rd, 4th, and 5th semesters. Invite students by college PIN, create notebook assignments, and grade submissions.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => onGoToLogin('teacher')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Teacher Sign In
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onGoToRegister('teacher')}
              >
                Register
              </Button>
            </div>
          </Card>

          {/* Student Portal Box */}
          <Card hoverable className="p-6 sm:p-7 border-indigo-200 bg-white relative overflow-hidden group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Student Portal</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              Login with your college PIN. Accept teacher invitations, submit your Google Drive notebook links, and view your verified marks and feedback.
            </p>

            <div className="flex items-center gap-2 pt-2">
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
              <Button
                variant="outline"
                size="md"
                onClick={() => onGoToRegister('student')}
              >
                Register
              </Button>
            </div>
          </Card>
        </div>

        {/* Feature badges */}
        <div className="pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">No Email Needed</h5>
              <p className="text-[10px] text-slate-500">Teacher Mobile & Student PIN</p>
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
              <h5 className="text-xs font-bold text-slate-800">Instant Grading</h5>
              <p className="text-[10px] text-slate-500">Marks out of 10 & Feedback</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-200/60">
            <Smartphone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800">PWA Installable</h5>
              <p className="text-[10px] text-slate-500">Android, desktop & tablet</p>
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
