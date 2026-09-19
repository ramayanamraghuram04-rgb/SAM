import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SUPPORTED_SEMESTERS, SUGGESTED_SUBJECTS, DEPARTMENT } from '../../config/constants';
import { Semester, ClassItem } from '../../types';
import { classService } from '../../services/classService';
import { useAuth } from '../../context/AuthContext';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: (newClass: ClassItem) => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onClassCreated,
}) => {
  const { user } = useAuth();
  const [semester, setSemester] = useState<Semester>('3rd');
  const [subject, setSubject] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    if (!subject.trim()) {
      setError('Please enter or select a subject name.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await classService.createClass({
        teacherId: user.uid,
        teacherName: user.name,
        semester,
        subject: subject.trim(),
      });

      if (res.error || !res.classItem) {
        setError(res.error || 'Failed to create class.');
      } else {
        onClassCreated(res.classItem);
        setSubject('');
        onClose();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = SUGGESTED_SUBJECTS[semester] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Class"
      subtitle="Add a subject under your CSE teaching schedule"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Department (Fixed to CSE) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Department
          </label>
          <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
            {DEPARTMENT} — Computer Science & Engineering
          </div>
          <p className="text-[11px] text-slate-400 mt-1">This application is strictly configured for CSE.</p>
        </div>

        {/* Semester Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Semester
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_SEMESTERS.map((sem) => (
              <button
                type="button"
                key={sem.id}
                onClick={() => {
                  setSemester(sem.id);
                  setSubject('');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                  semester === sem.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Input */}
        <div>
          <Input
            label="Subject Name"
            placeholder="e.g. C Programming, Web Technology"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          {/* Subject Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2.5">
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                Suggested for {semester} Sem:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSubject(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Class
          </Button>
        </div>
      </form>
    </Modal>
  );
};
