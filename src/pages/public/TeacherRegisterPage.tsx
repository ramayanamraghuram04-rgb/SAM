import React, { useState } from 'react';
import { User, Phone, Lock, GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

interface TeacherRegisterPageProps {
  onSuccess: () => void;
  onGoToLogin: () => void;
  onBackToHome: () => void;
}

export const TeacherRegisterPage: React.FC<TeacherRegisterPageProps> = ({
  onSuccess,
  onGoToLogin,
  onBackToHome,
}) => {
  const { setUserManually } = useAuth();
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.registerTeacher({
        name: name.trim(),
        mobile: mobile.trim(),
        password,
        confirmPassword,
      });

      if (res.error || !res.user) {
        setError(res.error || 'Registration failed.');
      } else {
        setUserManually(res.user);
        onSuccess();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <Card className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Teacher Registration
            </h2>
            <p className="text-xs text-slate-500">
              Create your teacher account for <span className="font-bold text-blue-600">{DEPARTMENT}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department display */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Department
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700">
                {DEPARTMENT_FULL} ({DEPARTMENT})
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <Input
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="This mobile number is your permanent login identity. No email required."
              />
            </div>

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Complete Registration
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have a teacher account?{' '}
              <button
                type="button"
                onClick={onGoToLogin}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
