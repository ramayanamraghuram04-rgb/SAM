import React from 'react';
import { 
  Shield, 
  ArrowRight, 
  UserCheck, 
  FileText, 
  UploadCloud, 
  CheckCircle2,
  Sparkles,
  Layers,
  FileCheck2,
  Send,
  Star,
  Palette,
  Check
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AdminSticker } from '../../components/illustrations/AdminSticker';
import { TeacherSticker } from '../../components/illustrations/TeacherSticker';
import { StudentSticker } from '../../components/illustrations/StudentSticker';
import { useBranding } from '../../context/BrandingContext';
import { SamLogo, SamLogoMinimalist, SamLogoEducational } from '../../components/brand/SamLogo';

interface LandingPageProps {
  onGoToLogin: (role: 'admin' | 'staff' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const { selectedLogo, setLogoOption, openLogoModal, hasChosenLogo } = useBranding();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      
      {/* 2. TOP HEADER - Compact, Professional, Fixed Height (14/16) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          
          {/* Left: SAM Logo, Name, Subtitle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLogoModal}
              className="group cursor-pointer shrink-0 focus:outline-hidden"
              title="Click to customize SAM Logo"
            >
              <SamLogo
                option={selectedLogo}
                size="md"
                className="group-hover:scale-105 shadow-sm shadow-blue-500/20 transition-transform"
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#0F172A]">SAM</span>
              </div>
              <p className="text-[11px] font-semibold text-[#64748B] tracking-wide uppercase">
                SMART ASSIGNMENT MANAGER
              </p>
            </div>
          </div>

          {/* Right: Role Navigation Buttons & Logo Customizer */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openLogoModal}
              leftIcon={<Palette className="w-3.5 h-3.5 text-[#2563EB]" />}
              className="text-xs font-semibold px-2.5 sm:px-3 border-blue-200 text-[#2563EB] bg-blue-50/50 hover:bg-blue-100"
              title="Choose your SAM logo"
            >
              Logo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToLogin('admin')}
              leftIcon={<Shield className="w-3.5 h-3.5 text-[#64748B]" />}
              className="text-xs font-semibold px-2.5 sm:px-3 border-[#E2E8F0] hover:bg-slate-50 hover:text-[#0F172A]"
            >
              Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGoToLogin('staff')}
              className="text-xs font-semibold px-2.5 sm:px-3 border-[#E2E8F0] hover:bg-slate-50 hover:text-[#0F172A]"
            >
              Staff
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onGoToLogin('student')}
              className="text-xs font-semibold px-3 sm:px-3.5 bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs"
            >
              Student
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12 sm:space-y-16">
        
        {/* 1. CHOOSE YOUR SAM LOGO SELECTION INTERFACE (Shown until user selects or via header) */}
        {!hasChosenLogo && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-100 shadow-lg shadow-blue-500/5 max-w-3xl mx-auto space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-[#2563EB] tracking-wider uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                Custom Branding Experience
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Choose your SAM logo
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto">
                Select your preferred identity below. SAM will save your choice and use this logo across your interface and header.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option 1 */}
              <div
                onClick={() => setLogoOption('option1')}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedLogo === 'option1'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">
                      OPTION 1
                    </span>
                    {selectedLogo === 'option1' && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="h-24 flex items-center justify-center bg-slate-50 rounded-lg">
                    <SamLogoMinimalist size="xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Professional Minimalist</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Clean geometric monogram with document layers and checkmark accent.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogoOption('option1');
                  }}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    selectedLogo === 'option1'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedLogo === 'option1' ? 'Selected Option 1' : 'Select Option 1'}
                </button>
              </div>

              {/* Option 2 */}
              <div
                onClick={() => setLogoOption('option2')}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedLogo === 'option2'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase">
                      OPTION 2
                    </span>
                    {selectedLogo === 'option2' && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div className="h-24 flex items-center justify-center bg-slate-50 rounded-lg">
                    <SamLogoEducational size="xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modern Educational</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Academic crest fusing open book wings, mortarboard crown, and verified check.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLogoOption('option2');
                  }}
                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    selectedLogo === 'option2'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {selectedLogo === 'option2' ? 'Selected Option 2' : 'Select Option 2'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 3. HERO SECTION - Clean, Balanced, No Huge Empty Spaces, No Excessive Gradients */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2 sm:pt-4">
          
          {/* Small Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2563EB] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple • Smart • Organized</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15] sm:leading-[1.15]">
            Assignment Management, <span className="text-[#2563EB]">Simplified.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed font-normal">
            Create assignments, submit work, review submissions and manage academic progress — all in one place.
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

        {/* 7. SIMPLE INFORMATION STRIP (No Fake Numerical Statistics) */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 max-w-5xl mx-auto shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0]">
            
            <div className="pt-2 sm:pt-0 sm:px-3 space-y-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-[#0F172A] mb-1">
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">Manage</p>
              <p className="text-xs text-[#64748B]">Students & Staff</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-3 space-y-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] mb-1">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">Create</p>
              <p className="text-xs text-[#64748B]">Assignments</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-3 space-y-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] mb-1">
                <Send className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">Submit</p>
              <p className="text-xs text-[#64748B]">Student Work</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-3 space-y-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] mb-1">
                <Star className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-[#0F172A] tracking-wide uppercase">Evaluate</p>
              <p className="text-xs text-[#64748B]">Marks & Feedback</p>
            </div>

          </div>
        </section>

      </main>

      {/* 10. FOOTER - Minimal, Professional, No Department Restriction */}
      <footer className="py-6 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 SAM — Smart Assignment Manager • Modern Academic Workflow System
          </p>
          <button
            type="button"
            onClick={openLogoModal}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Change Logo Style</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
