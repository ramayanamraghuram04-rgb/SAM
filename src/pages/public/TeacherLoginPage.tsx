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
  onGoToRegister: () => void;
  onSwitchToStudent: () => void;
  onBackToHome: () => void;
}

export const TeacherLoginPage: React.FC<TeacherLoginPageProps> = ({
  onSuccess,
  onGoToRegister,
  onSwitchToStudent,
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

    if (!mobile.trim()) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginTeacher(mobile.trim(), password);
      if (res.error || !res.user) {
        setError(res.error || 'Failed to sign in.');
      } else {
        setUserManually(res.user);
        onSuccess();
      }
    } catch {
      setError('Something went wrong. Please check your network and try again.');
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
          <span>Back to Home</span>
        </button>

        <Card className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Teacher Sign In
            </h2>
            <p className="text-xs text-slate-500">
              Department of <span className="font-bold text-blue-600">{DEPARTMENT}</span> • Single Dashboard Access
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
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number (e.g. 9876543210)"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="No email required. Log in using your mobile number."
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
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
            >
              Sign In to Teacher Dashboard
            </Button>
          </form>

          {/* Registration link */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              New Teacher?{' '}
              <button
                type="button"
                onClick={onGoToRegister}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Register Teacher Account
              </button>
            </p>

            <button
              type="button"
              onClick={onSwitchToStudent}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 block mx-auto"
            >
              Are you a student? Click here for Student Login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
