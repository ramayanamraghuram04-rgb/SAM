import React, { useState } from 'react';
import { Phone, Lock, GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT } from '../../config/constants';

interface TeacherLoginPageProps {
  onSuccess: () => void;
  onSwitchToStudent: () => void;
  onSwitchToAdmin?: () => void;
  onBackToHome: () => void;
}

export const TeacherLoginPage: React.FC<TeacherLoginPageProps> = ({
  onSuccess,
  onSwitchToStudent,
  onSwitchToAdmin,
  onBackToHome,
}) => {
  const { setUserManually } = useAuth();
  const [mobile, setMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = mobile.replace(/\D/g, '');
    if (!clean || clean.length !== 10) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginStaff(clean, password);
      if (res.error || !res.user) {
        setError(res.error || 'Failed to sign in.');
      } else {
        setUserManually(res.user);
        onSuccess();
      }
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Back Button */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SAM Home</span>
        </button>

        <Card className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Staff / Teacher Sign In
            </h2>
            <p className="text-xs text-slate-500">
              Department of <span className="font-bold text-blue-600">{DEPARTMENT}</span> • Single Staff Account Access
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile Number */}
            <div>
              <Input
                label="Registered Mobile Number"
                type="tel"
                placeholder="10-digit mobile (e.g. 9876543210)"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                defaultVisible={true}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              Sign In to Staff Dashboard
            </Button>
          </form>

          {/* Notice: No Public Registration */}
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-center text-[11px] text-blue-700">
            Staff accounts are provisioned exclusively by the College Administrator.
          </div>

          {/* Switch links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            {onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="hover:text-slate-900 font-medium"
              >
                ← Admin Login
              </button>
            )}
            <button
              type="button"
              onClick={onSwitchToStudent}
              className="hover:text-indigo-600 font-medium ml-auto"
            >
              Student Login →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
