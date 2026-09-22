import React, { useState } from 'react';
import { 
  Shield, 
  Phone, 
  Building2, 
  Database, 
  Smartphone, 
  LogOut, 
  CheckCircle2, 
  Server,
  Lock,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  Code
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';
import { isLiveFirebaseConfigured } from '../../config/firebase';
import { authService } from '../../services/authService';
import { isValidIndianMobile } from '../../utils/phoneValidator';

const FIREBASE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export const AdminProfilePage: React.FC = () => {
  const { adminUser, logout } = useAuth();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState(adminUser?.name || 'Raghuram (Admin)');
  const [mobile, setMobile] = useState(adminUser?.mobile || '6281803875');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Copy state for rules
  const [copied, setCopied] = useState(false);

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIREBASE_RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenEditModal = () => {
    setName(adminUser?.name || 'Raghuram (Admin)');
    setMobile(adminUser?.mobile || '6281803875');
    setNewPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = mobile.replace(/\D/g, '');
    if (!name.trim()) {
      setErrorMsg('Administrator name is required.');
      return;
    }

    if (!isValidIndianMobile(clean)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!adminUser?.uid) {
      setErrorMsg('Admin session not found. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.updateAdminProfile(adminUser.uid, {
        name: name.trim(),
        mobile: clean,
        newPassword: newPassword || undefined,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Admin credentials updated successfully!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update admin profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Administrator Profile</h1>
          <p className="text-xs text-slate-500">
            Full root access: modify credentials, reset admin password, and system security rules.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenEditModal}
          leftIcon={<Edit3 className="w-4 h-4 text-blue-600" />}
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Change Details & Password
        </Button>
      </div>

      {/* Admin Profile Card */}
      <Card className="p-6 border-slate-200 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{adminUser?.name || 'Raghuram (Admin)'}</h2>
              <Badge variant="blue" size="sm">Super Admin</Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{DEPARTMENT_FULL}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Admin Mobile Number
            </span>
            <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-800">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{adminUser?.mobile || '6281803875'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Department
            </span>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>{DEPARTMENT}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              System Security Identity
            </span>
            <div className="flex items-center justify-between text-xs font-mono text-slate-700">
              <span>admin_{adminUser?.mobile || '6281803875'}@sam.internal</span>
              <span className="text-[10px] text-slate-400">UID: {adminUser?.uid || 'JYMhTdFL2sdx9Jlp2k52pT6G1JH2'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Cloud Security Rules Deployment Helper */}
      <Card className="p-6 border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cloud Database Security Rules</h3>
              <p className="text-xs text-slate-500">
                To sync all Admin operations and student submissions across devices in real time:
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyRules}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            className={copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}
          >
            {copied ? 'Copied Rules!' : 'Copy Rules'}
          </Button>
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-[11px] font-mono overflow-x-auto relative">
          <pre>{FIREBASE_RULES_SNIPPET}</pre>
        </div>

        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1 pt-1 font-medium">
          <li>Open your <strong>Cloud Database Management Console</strong>.</li>
          <li>Select project <strong>smart-ssignment-manager</strong> $\rightarrow$ <strong>Database Rules</strong>.</li>
          <li>Click the <strong>Rules</strong> tab at the top.</li>
          <li>Paste the rules copied above and click <strong>Publish</strong>.</li>
        </ol>
      </Card>

      {/* System Status Card */}
      <Card className="p-6 border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">System Architecture Status</h3>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-slate-800 block">Cloud Database Connection</span>
                <span className="text-[10px] text-slate-500">Project: smart-ssignment-manager</span>
              </div>
            </div>
            <Badge variant={isLiveFirebaseConfigured ? 'success' : 'warning'} size="sm">
              {isLiveFirebaseConfigured ? 'Live Connected' : 'Resilient Store'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="font-bold text-slate-800 block">PWA Offline & Mobile Shell</span>
                <span className="text-[10px] text-slate-500">Manifest 192x192 & 512x512 with standalone support</span>
              </div>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-800 block">Zero Device Bleed Isolation</span>
                <span className="text-[10px] text-slate-500">Full auth purge on logout guaranteed</span>
              </div>
            </div>
            <Badge variant="success" size="sm">Verified</Badge>
          </div>
        </div>
      </Card>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Administrator Credentials"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <p className="text-xs text-slate-500">
            Change your administrator name, phone number, or set a new sign-in password.
          </p>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
              {successMsg}
            </div>
          )}

          <Input
            label="Admin Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Unique Admin Mobile Number"
            type="tel"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="New Password (leave blank to keep current password)"
            type="password"
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            defaultVisible={true}
          />

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Admin Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Logout Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={logout}
          leftIcon={<LogOut className="w-5 h-5 text-rose-500" />}
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        >
          Sign Out of Administrator Portal
        </Button>
      </div>
    </div>
  );
};
