import React, { useState, useEffect } from 'react';
import { Layers, BookOpen, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassMember, Invitation, Semester } from '../../types';
import { classService } from '../../services/classService';
import { inviteService } from '../../services/inviteService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { InvitationCard } from '../../components/student/InvitationCard';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

interface StudentClassesPageProps {
  onSelectClass: (cls: ClassMember) => void;
}

export const StudentClassesPage: React.FC<StudentClassesPageProps> = ({ onSelectClass }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [classList, invList] = await Promise.all([
        classService.getStudentClasses(user.uid),
        inviteService.getStudentInvitations(user.uid),
      ]);
      setClasses(classList);
      setInvitations(invList);
    } catch (err) {
      console.error('Error fetching student classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  if (loading) {
    return <LoadingSpinner message="Loading your classes..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Classes & Subjects</h1>
        <p className="text-xs text-slate-500">
          Classes you have accepted and pending invitations from teachers
        </p>
      </div>

      {/* Pending Invitations Section (if any) */}
      {invitations.length > 0 && (
        <div className="space-y-3 bg-blue-50/60 p-5 rounded-2xl border border-blue-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900">
              Pending Invitations ({invitations.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onResponded={fetchData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Classes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Active Class Memberships ({classes.length})
        </h2>

        {classes.length === 0 ? (
          <EmptyState
            title="No active class memberships"
            description="You are not enrolled in any classes yet. When your teacher invites you by your PIN, an invitation will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id} hoverable className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SemesterBadge semester={cls.semester} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {DEPARTMENT}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900">{cls.subject}</h3>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Enrolled
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>Joined: {formatDate(cls.joinedAt)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => onSelectClass(cls)}
                  >
                    View Class
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
