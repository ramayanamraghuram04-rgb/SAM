import React, { useState } from 'react';
import { ArrowLeft, Lock, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { SamLogo } from '../../components/brand/SamLogo';
import { isValidIndianMobile } from '../../utils/phoneValidator';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onSwitchToStaff: () => void;
  onSwitchToStudent: () => void;
  onBackToHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onSwitchToStaff,
  onSwitchToStudent,
  onBackToHome,
}) => {
  const { setUserManually } = useAuth();
  const { selectedLogo } = useBranding();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = mobile.replace(/\D/g, '');
    if (!isValidIndianMobile(clean)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.loginAdmin(clean, password);
      if (res.error) {
        setError(res.error);
      } else if (res.user) {
        setUserManually(res.user);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Back link */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SAM Home
        </button>

        {/* Card */}
        <Card className="p-6 sm:p-8 shadow-xl border-slate-200">
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-2">
              <SamLogo option={selectedLogo} size="lg" className="shadow-md shadow-blue-500/20" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Admin Sign In</h1>
            <p className="text-xs text-slate-500">
              Department Administration & Academic Management
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Mobile Number"
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              maxLength={10}
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
              autoFocus
              required
            />

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

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white mt-2"
            >
              Sign In to Admin Portal
            </Button>
          </form>

          {/* Quick Setup Hint */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-center">
            💡 <strong>First time logging in?</strong> Use your Admin mobile number and a secure password (6+ chars). The system automatically registers the first administrator account.
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onSwitchToStaff}
              className="hover:text-blue-600 font-medium transition-colors"
            >
              Staff Login →
            </button>
            <button
              onClick={onSwitchToStudent}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Student Login →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
