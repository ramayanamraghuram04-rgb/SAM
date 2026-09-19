import React, { useState } from 'react';
import { CreditCard, Lock, BookOpen, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT } from '../../config/constants';

interface StudentLoginPageProps {
  onSuccess: () => void;
  onGoToRegister: () => void;
  onSwitchToTeacher: () => void;
  onBackToHome: () => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({
  onSuccess,
  onGoToRegister,
  onSwitchToTeacher,
  onBackToHome,
}) => {
  const { setUserManually } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Please enter your college student PIN.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginStudent(pin.trim(), password);
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 flex items-center justify-center p-4">
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
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/25">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Student Sign In
            </h2>
            <p className="text-xs text-slate-500">
              Department of <span className="font-bold text-indigo-600">{DEPARTMENT}</span> • Login with your PIN
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student PIN */}
            <div>
              <Input
                label="Student College PIN"
                placeholder="e.g. 24170-CM-001"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                leftIcon={<CreditCard className="w-4 h-4" />}
                helperText="No email needed. Your PIN is your permanent college identity."
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
              className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            >
              Sign In to Student Portal
            </Button>
          </form>

          {/* Registration link */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              New Student?{' '}
              <button
                type="button"
                onClick={onGoToRegister}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Register Student Account
              </button>
            </p>

            <button
              type="button"
              onClick={onSwitchToTeacher}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 block mx-auto"
            >
              Are you a faculty member? Click here for Teacher Login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
