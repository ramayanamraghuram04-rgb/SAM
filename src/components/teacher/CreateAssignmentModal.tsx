import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ClassItem, Assignment } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_MAX_MARKS } from '../../config/constants';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  defaultClassId?: string;
  onAssignmentCreated: (assignment: Assignment) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classes,
  defaultClassId,
  onAssignmentCreated,
}) => {
  const { user } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || (classes[0]?.id || ''));
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Default due date = 7 days from today
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [maxMarks, setMaxMarks] = useState<number>(DEFAULT_MAX_MARKS);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    const targetClass = classes.find((c) => c.id === (defaultClassId || selectedClassId));
    if (!targetClass) {
      setError('Please select a valid class.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter an assignment title.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter the assignment question or description.');
      return;
    }

    if (!dueDate) {
      setError('Please choose a due date.');
      return;
    }

    if (maxMarks <= 0 || maxMarks > 100) {
      setError('Maximum marks must be between 1 and 100.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await assignmentService.createAssignment({
        classItem: targetClass,
        teacherId: user.uid,
        teacherName: user.name,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        maxMarks,
      });

      if (res.error || !res.assignment) {
        setError(res.error || 'Failed to publish assignment.');
      } else {
        onAssignmentCreated(res.assignment);
        setTitle('');
        setDescription('');
        onClose();
      }
    } catch {
      setError('Something went wrong while publishing assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Assignment"
      subtitle="Publish a notebook assignment question for your class"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Target Class Selector */}
        {!defaultClassId && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Class / Subject
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.semester} Sem — {cls.subject}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignment Title */}
        <Input
          label="Assignment Title"
          placeholder="e.g. Unit 1 Assignment: Loops & Arrays"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Notebook Question / Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Assignment Question / Notebook Instructions
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write the questions here (e.g. Write a C program to find the largest number among three numbers. Draw flowchart and write complete code in your physical assignment notebook)."
            className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Students will write the answer in their notebooks, upload photos to Google Drive, and submit the sharing link.
          </p>
        </div>

        {/* Due Date and Max Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label="Maximum Marks"
            type="number"
            min={1}
            max={100}
            value={maxMarks}
            onChange={(e) => setMaxMarks(Number(e.target.value))}
            helperText="Default standard is 10 marks"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Publish Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
