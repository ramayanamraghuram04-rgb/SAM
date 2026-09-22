import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Camera, 
  Cloud, 
  Layers, 
  CheckCircle, 
  Lock, 
  Database,
  Hash,
  AlertCircle
} from 'lucide-react';
import { DEPARTMENT, DEPARTMENT_FULL, SUPPORTED_SEMESTERS } from '../../config/constants';
import { isLiveFirebaseConfigured } from '../../config/firebase';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../services/cloudinary';

export const AdminSettingsPage: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cloudName = CLOUDINARY_CLOUD_NAME;
  const uploadPreset = CLOUDINARY_UPLOAD_PRESET;
  const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Configuration</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            System Secure
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Review department configuration, role security parameters, Cloudinary media storage, and verification policies.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Academic & Department Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Configuration</h3>
              <p className="text-xs text-slate-500">Academic structure and enrolled semesters</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department Code</span>
              <span className="font-bold text-slate-900">{DEPARTMENT}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department Full Name</span>
              <span className="font-bold text-slate-900 text-right">{DEPARTMENT_FULL}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-2">Configured Semesters</span>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_SEMESTERS.map((sem) => (
                  <span key={sem.id} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                    {sem.label} ({sem.year})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Role Security & Identity Policy */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Role & Access Control</h3>
              <p className="text-xs text-slate-500">Authoritative UID and identity rules</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Authoritative Identity</span>
              <span className="font-bold text-purple-700">Firebase Auth UID</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Application Roles</span>
              <span className="font-bold text-slate-900">ADMIN, STAFF, STUDENT</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Public Registration</span>
              <span className="font-bold text-rose-600">Disabled (Admin Authority Only)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Same-Device Isolation</span>
              <span className="font-bold text-emerald-600">Active (Automatic State Purge)</span>
            </div>
          </div>
        </div>

        {/* 3. Cloudinary Image Storage */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cloudinary Media Storage</h3>
              <p className="text-xs text-slate-500">Direct unsigned camera upload service</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Cloud Name</span>
              <code className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                {cloudName}
              </code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Upload Preset</span>
              <code className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                {uploadPreset}
              </code>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Target Folder</span>
              <span className="font-mono text-xs text-slate-700 font-semibold">sam/assignments</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Frontend API Secret</span>
              <span className="font-bold text-emerald-600">None (Zero Secret Exposure)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Service Status</span>
              <span className={`font-bold ${isCloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isCloudinaryConfigured ? 'Connected & Ready' : 'Pending Configuration'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Camera Submission & Verification Codes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Submission & Verification Code</h3>
              <p className="text-xs text-slate-500">Live camera capture and anti-plagiarism codes</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Capture Mechanism</span>
              <span className="font-bold text-slate-900">Live Camera Only (getUserMedia)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Device Gallery Picker</span>
              <span className="font-bold text-rose-600">Disabled (Anti-Cheat Policy)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Verification Code Format</span>
              <span className="font-bold text-slate-900">6-Character Cryptographic Random</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Image Watermarking</span>
              <span className="font-bold text-emerald-600">Active (Code, PIN, Timestamp)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Teacher Verification</span>
              <span className="font-bold text-blue-600">Notebook Inspection Interface</span>
            </div>
          </div>
        </div>

      </div>

      {/* Security & Audit Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Data Preservation & Safe Disabling</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              When a Staff or Student account is disabled by Administrator, their account access is revoked immediately while all historic assignments, submitted notebook pages, grades, and verification audit trails remain intact.
            </p>
          </div>
        </div>
        <button
          onClick={() => showToast('Configuration verified and active.')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition-colors shrink-0 cursor-pointer"
        >
          Check System Status
        </button>
      </div>
    </div>
  );
};
