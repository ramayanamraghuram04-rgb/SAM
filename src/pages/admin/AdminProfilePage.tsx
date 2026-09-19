import React from 'react';
import { 
  Shield, 
  Phone, 
  Building2, 
  Database, 
  Smartphone, 
  LogOut, 
  CheckCircle2, 
  Server
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';
import { isLiveFirebaseConfigured } from '../../config/firebase';

export const AdminProfilePage: React.FC = () => {
  const { adminUser, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Administrator Profile</h1>
        <p className="text-xs text-slate-500">
          Account details and system configuration parameters.
        </p>
      </div>

      {/* Admin Profile Card */}
      <Card className="p-6 border-slate-200 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{adminUser?.name || 'System Administrator'}</h2>
              <Badge variant="blue" size="sm">Admin</Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{DEPARTMENT_FULL}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Admin Mobile
            </span>
            <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-800">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{adminUser?.mobile || '9876543210'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Department
            </span>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{DEPARTMENT}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* System Status Card */}
      <Card className="p-6 border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">System Architecture Status</h3>
        
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-slate-800 block">Cloud Firestore Connection</span>
                <span className="text-[10px] text-slate-500">Firebase project: smart-ssignment-manager</span>
              </div>
            </div>
            <Badge variant={isLiveFirebaseConfigured ? 'success' : 'warning'} size="sm">
              {isLiveFirebaseConfigured ? 'Live Connected' : 'Mock Mode'}
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
                <span className="font-bold text-slate-800 block">Assignment Storage</span>
                <span className="text-[10px] text-slate-500">Zero Firebase Storage cost • Student Google Drive links</span>
              </div>
            </div>
            <Badge variant="success" size="sm">Active</Badge>
          </div>
        </div>
      </Card>

      {/* Sign Out Card */}
      <Card className="p-6 border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Sign Out</h3>
          <p className="text-xs text-slate-500">Safely terminate admin session and clear device cache</p>
        </div>
        <Button
          variant="danger"
          size="md"
          onClick={logout}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Logout Admin
        </Button>
      </Card>
    </div>
  );
};
