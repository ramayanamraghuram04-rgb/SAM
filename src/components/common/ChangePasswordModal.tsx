import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  X,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { evaluatePasswordStrength, validatePasswordChange } from '../../utils/passwordValidator';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForcedFirstLogin?: boolean;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isForcedFirstLogin = false,
  onSuccess,
}) => {
  const { user, refreshUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Individual visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    if (isForcedFirstLogin) {
      // If forced, canceling signs out safely
      logout();
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side pre-validation
    const clientValidation = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!clientValidation.isValid) {
      setErrorMsg(clientValidation.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update password. Please check your credentials.');
      } else {
        setSuccessMsg('Password updated successfully.');
        await refreshUser().catch(() => {});
        if (onSuccess) onSuccess();

        setTimeout(() => {
          resetForm();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isForcedFirstLogin ? 'Update Initial Password' : 'Change Password'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Security / First login banner */}
        {isForcedFirstLogin ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-amber-950">First-Time Sign In Requirement</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Your account was created with a temporary initial password. For your privacy and security, please set a new personal password before accessing the system.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 pb-1">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <span>
              Secure your account by updating your Firebase Authentication password.
            </span>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                disabled={submitting || !!successMsg}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                title={showCurrent ? 'Hide password' : 'Show password'}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                New Password <span className="text-rose-500">*</span>
              </label>
              {newPassword.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  strength.score === 'strong'
                    ? 'bg-emerald-100 text-emerald-800'
                    : strength.score === 'medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {strength.label} Password
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                disabled={submitting || !!successMsg}
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-400"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                title={showNew ? 'Hide password' : 'Show password'}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Policy Guidelines & Live Feedback */}
            <div className="mt-2 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'
                }`} />
                <span className={newPassword.length >= 6 ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  At least 6 characters long
                </span>
              </div>
              {currentPassword && newPassword && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    newPassword !== currentPassword ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  <span className={newPassword !== currentPassword ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'}>
                    {newPassword !== currentPassword
                      ? 'Different from current password'
                      : 'Must be different from current password'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                disabled={submitting || !!successMsg}
                className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 outline-none hover:border-slate-400
                  ${
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : confirmPassword.length > 0 && confirmPassword === newPassword
                      ? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                title={showConfirm ? 'Hide password' : 'Show password'}
                aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p className={`mt-1 text-[11px] font-medium ${
                confirmPassword === newPassword ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {confirmPassword === newPassword
                  ? '✓ Confirmation password matches'
                  : '✕ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={submitting}
              leftIcon={isForcedFirstLogin ? <LogOut className="w-4 h-4 text-slate-500" /> : undefined}
            >
              {isForcedFirstLogin ? 'Sign Out Instead' : 'Cancel'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting || !!successMsg}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
            >
              {submitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
