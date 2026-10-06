import React from 'react';
import { 
  ArrowRight, 
  UserCheck, 
  FileText, 
  UploadCloud, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { AdminSticker } from '../../components/illustrations/AdminSticker';
import { TeacherSticker } from '../../components/illustrations/TeacherSticker';
import { StudentSticker } from '../../components/illustrations/StudentSticker';
import { SamLogo } from '../../components/brand/SamLogo';

interface LandingPageProps {
  onGoToLogin: (role: 'admin' | 'staff' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* 2. TOP HEADER - Clean, Minimal Brand Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center">
          {/* SAM Logo, Name, Subtitle */}
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <SamLogo size="md" className="shadow-sm shadow-blue-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#0F172A]">SAM</span>
              </div>
              <p className="text-[11px] font-semibold text-[#64748B] tracking-wide uppercase">
                SMART ASSIGNMENT MANAGER
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12 sm:space-y-16">
        
        {/* 3. HERO SECTION - Clean, Balanced, No Huge Empty Spaces */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-4">
          
          {/* Small Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2563EB] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple • Smart • Organized</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] sm:leading-[1.15]">
            <span className="text-[#2563EB]">One Place.</span>{' '}
            <span className="text-[#0F172A]">Every Assignment.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed font-normal">
            A simple and smart platform to create, submit, review, and manage assignments — all in one place.
          </p>
        </section>

        {/* 4. CHOOSE YOUR PORTAL SECTION */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Choose your portal
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Select the portal that matches your role.
            </p>
          </div>

          {/* Three Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            
            {/* 1. ADMIN PORTAL CARD */}
            <div 
              onClick={() => onGoToLogin('admin')}
              className="group bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Sticker Illustration */}
                <div className="mb-4 flex justify-center py-2">
                  <AdminSticker className="w-24 h-24" />
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    Admin Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    Manage staff, students, subjects and academic settings.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToLogin('admin');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-[#0F172A] group-hover:text-white group-hover:border-[#0F172A] transition-colors duration-150"
                >
                  <span>Open Admin Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* 2. STAFF / TEACHER PORTAL CARD */}
            <div 
              onClick={() => onGoToLogin('staff')}
              className="group bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Sticker Illustration */}
                <div className="mb-4 flex justify-center py-2">
                  <TeacherSticker className="w-24 h-24" />
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    Staff / Teacher Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    Create assignments, review student submissions and manage evaluations.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToLogin('staff');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xs transition-colors duration-150"
                >
                  <span>Open Staff Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* 3. STUDENT PORTAL CARD */}
            <div 
              onClick={() => onGoToLogin('student')}
              className="group bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Sticker Illustration */}
                <div className="mb-4 flex justify-center py-2">
                  <StudentSticker className="w-24 h-24" />
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-[#0F172A]">
                    Student Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    View assignments, submit your work and check marks and feedback.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToLogin('student');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#4F46E5] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-xs transition-colors duration-150"
                >
                  <span>Open Student Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 6. HOW SAM WORKS SECTION (Clean Horizontal Timeline on Desktop, Vertical on Mobile) */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              How SAM Works
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              A streamlined, 4-step collaborative academic workflow.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Desktop Horizontal Timeline */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 relative">
              {/* Timeline Connector Line */}
              <div className="absolute top-5 left-8 right-8 h-0.5 bg-[#E2E8F0] z-0" />

              {/* Step 01 */}
              <div className="relative z-10 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-[#94A3B8] tracking-wider">01</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Admin Setup</h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Admin manages students, staff and subjects.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="relative z-10 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-[#94A3B8] tracking-wider">02</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Create Assignment</h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Staff creates and publishes assignments.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="relative z-10 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-[#94A3B8] tracking-wider">03</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Student Submission</h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Students complete their work and submit it through the existing workflow.
                  </p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="relative z-10 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-[#94A3B8] tracking-wider">04</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Review & Evaluate</h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    Staff reviews submissions and provides marks and feedback.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Vertical Timeline */}
            <div className="md:hidden space-y-3">
              {/* Step 01 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F172A]">Admin Setup</h4>
                    <span className="text-[11px] font-black text-[#94A3B8]">01</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    Admin manages students, staff and subjects.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F172A]">Create Assignment</h4>
                    <span className="text-[11px] font-black text-[#94A3B8]">02</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    Staff creates and publishes assignments.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <UploadCloud className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F172A]">Student Submission</h4>
                    <span className="text-[11px] font-black text-[#94A3B8]">03</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    Students complete their work and submit it through the existing workflow.
                  </p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4.5 flex items-start gap-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F172A]">Review & Evaluate</h4>
                    <span className="text-[11px] font-black text-[#94A3B8]">04</span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                    Staff reviews submissions and provides marks and feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 10. FOOTER - Minimal, Professional, No Department Restriction */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#64748B]">
        <p className="max-w-6xl mx-auto px-4">
          © 2026 SAM — Smart Assignment Manager • Modern Academic Workflow System
        </p>
      </footer>

    </div>
  );
};
