import React, { useState } from 'react';
import { Check, X, GraduationCap } from 'lucide-react';
import { Invitation } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SemesterBadge } from '../common/Badge';
import { inviteService } from '../../services/inviteService';
import { DEPARTMENT } from '../../config/constants';

interface InvitationCardProps {
  invitation: Invitation;
  onResponded: () => void;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onResponded,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleResponse = async (action: 'accept' | 'decline') => {
    setError('');
    setIsLoading(true);
    try {
      const res = await inviteService.respondToInvitation(invitation, action);
      if (!res.success) {
        setError(res.error || 'Failed to respond to invitation.');
      } else {
        onResponded();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card hoverable className="space-y-4 border-blue-200/90 bg-gradient-to-br from-white to-blue-50/30">
      {error && (
        <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <SemesterBadge semester={invitation.semester} />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {DEPARTMENT}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {invitation.subject}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Teacher: <span className="font-semibold text-slate-800">{invitation.teacherName}</span>
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/60">
        You have been invited to join this class. Accept to receive assignments, submit your notebook work, and get grades.
      </p>

      {/* Buttons: ACCEPT and DECLINE */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
          onClick={() => handleResponse('decline')}
          isLoading={isLoading}
          className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        >
          DECLINE
        </Button>

        <Button
          variant="success"
          size="sm"
          leftIcon={<Check className="w-3.5 h-3.5" />}
          onClick={() => handleResponse('accept')}
          isLoading={isLoading}
        >
          ACCEPT
        </Button>
      </div>
    </Card>
  );
};
