import React, { useState } from 'react';
import { Search, UserCheck, Send, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ClassItem, StudentUser } from '../../types';
import { inviteService } from '../../services/inviteService';
import { useAuth } from '../../context/AuthContext';

interface InviteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem;
  onInvitationSent?: () => void;
}

export const InviteStudentModal: React.FC<InviteStudentModalProps> = ({
  isOpen,
  onClose,
  classItem,
  onInvitationSent,
}) => {
  const { user } = useAuth();
  const [pinQuery, setPinQuery] = useState<string>('');
  const [searchedStudent, setSearchedStudent] = useState<StudentUser | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSearchedStudent(null);
    setHasSearched(false);

    if (!pinQuery.trim()) {
      setError('Please enter a student PIN to search.');
      return;
    }

    setIsSearching(true);
    try {
      const student = await inviteService.searchStudentByPIN(pinQuery.trim());
      setSearchedStudent(student);
      setHasSearched(true);
      if (!student) {
        setError('No student found with this PIN in CSE department. Make sure the student has registered.');
      }
    } catch {
      setError('Error looking up student PIN. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = async () => {
    if (!searchedStudent || !user) return;
    setError('');
    setSuccessMessage('');
    setIsSending(true);

    try {
      const res = await inviteService.sendInvitation({
        classItem,
        student: searchedStudent,
        teacherId: user.uid,
        teacherName: user.name,
      });

      if (!res.success) {
        setError(res.error || 'Failed to send invitation.');
      } else {
        setSuccessMessage(`Invitation sent to ${searchedStudent.name} (${searchedStudent.pin})!`);
        if (onInvitationSent) onInvitationSent();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setPinQuery('');
    setSearchedStudent(null);
    setHasSearched(false);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Invite Student"
      subtitle={`Class: ${classItem.semester} Semester — ${classItem.subject}`}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* PIN Search form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g. 24170-CM-001"
              value={pinQuery}
              onChange={(e) => setPinQuery(e.target.value.toUpperCase())}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button type="submit" variant="secondary" size="md" isLoading={isSearching}>
            Search
          </Button>
        </form>

        <p className="text-[11px] text-slate-400">
          Enter the student's college PIN. The student must have created their SAM account once.
        </p>

        {/* Searched Student Card */}
        {searchedStudent && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{searchedStudent.name}</h4>
                <p className="text-xs text-blue-700 font-mono font-semibold">{searchedStudent.pin}</p>
                <p className="text-[10px] text-slate-500 font-medium">Department: {searchedStudent.department}</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={handleSendInvite}
              isLoading={isSending}
              disabled={Boolean(successMessage)}
            >
              Send Invite
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
