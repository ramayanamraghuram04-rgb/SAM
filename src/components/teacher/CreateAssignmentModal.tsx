import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ClassItem, Assignment, TeachingAssignment } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { academicService } from '../../services/academicService';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_MAX_MARKS } from '../../config/constants';
import { formatDate } from '../../utils/dateUtils';
import { BookOpen, Layers, Calendar, CheckCircle2, AlertCircle, FileText, Send, Save } from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes?: ClassItem[];
  defaultClassId?: string;
  editingAssignment?: Assignment | null;
  onAssignmentCreated: (assignment: Assignment) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classes: propClasses = [],
  defaultClassId,
  editingAssignment = null,
  onAssignmentCreated,
}) => {
  const { user } = useAuth();

  // Teaching Assignments state
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [authorizedClasses, setAuthorizedClasses] = useState<TeachingAssignment[]>([]);
  const [selectedTeachingAssignmentId, setSelectedTeachingAssignmentId] = useState<string>('');

  // Form fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');

  // Default due date = 7 days from today
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [maxMarks, setMaxMarks] = useState<number>(DEFAULT_MAX_MARKS);

  // Status & Confirmation
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState<boolean>(false);

  // Load Staff teaching assignments when modal opens
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadTeachingRelationships();
    }
  }, [isOpen, user?.uid, editingAssignment]);

  const loadTeachingRelationships = async () => {
    if (!user?.uid) return;
    try {
      const tas = await academicService.getStaffTeachingAssignments(user.uid);
      setTeachingAssignments(tas);

      // Extract unique authorized subjects
      const subjs = Array.from(
        new Set(tas.map((t) => t.subjectName || t.subjectId).filter(Boolean))
      );
      setAvailableSubjects(subjs);

      if (editingAssignment) {
        // Pre-fill form from existing assignment
        setTitle(editingAssignment.title || '');
        setDescription(editingAssignment.description || '');
        setInstructions(editingAssignment.instructions || '');
        setDueDate(editingAssignment.dueDate || defaultDueDate);
        setMaxMarks(editingAssignment.maxMarks || DEFAULT_MAX_MARKS);
        setSelectedSubject(editingAssignment.subject || subjs[0] || '');

        const matchingClasses = tas.filter(
          (t) => (t.subjectName || t.subjectId) === editingAssignment.subject
        );
        setAuthorizedClasses(matchingClasses);
        const matchTa = matchingClasses.find((t) => t.semester === editingAssignment.semester);
        setSelectedTeachingAssignmentId(matchTa ? matchTa.id : (matchingClasses[0]?.id || ''));
      } else {
        // New assignment defaults
        const initialSubj = subjs[0] || '';
        setSelectedSubject(initialSubj);

        const classesForSubj = tas.filter(
          (t) => (t.subjectName || t.subjectId) === initialSubj
        );
        setAuthorizedClasses(classesForSubj);
        setSelectedTeachingAssignmentId(classesForSubj[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to load teaching assignments for staff:', err);
    }
  };

  // When staff changes subject, update authorized classes list
  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    const classesForSubj = teachingAssignments.filter(
      (t) => (t.subjectName || t.subjectId) === newSubject
    );
    setAuthorizedClasses(classesForSubj);
    setSelectedTeachingAssignmentId(classesForSubj[0]?.id || '');
  };

  const validateForm = (): boolean => {
    setError('');
    if (!title.trim()) {
      setError('Please enter an assignment title.');
      return false;
    }
    if (!description.trim()) {
      setError('Please enter the assignment question or description.');
      return false;
    }
    if (!selectedSubject) {
      setError('Please select an authorized subject.');
      return false;
    }
    if (!selectedTeachingAssignmentId && authorizedClasses.length === 0) {
      setError('No authorized classes available for this subject.');
      return false;
    }
    if (!dueDate) {
      setError('Please select a valid due date.');
      return false;
    }
    if (maxMarks <= 0 || maxMarks > 100) {
      setError('Maximum marks must be between 1 and 100.');
      return false;
    }
    return true;
  };

  const getTargetClassItem = (): ClassItem | null => {
    const selectedTa = authorizedClasses.find((t) => t.id === selectedTeachingAssignmentId) || authorizedClasses[0];
    if (!selectedTa) return null;

    const classId = `cls_${selectedTa.semester}_${selectedTa.subjectId}_${user?.uid}`.replace(/[^a-zA-Z0-9_]/g, '_');
    return {
      id: classId,
      teacherId: user?.uid || '',
      teacherName: user?.name || 'Faculty',
      department: 'CSE',
      semester: selectedTa.semester,
      subject: selectedTa.subjectName,
      status: 'active',
      createdAt: selectedTa.createdAt || new Date().toISOString(),
    };
  };

  // Save as Draft handler
  const handleSaveDraft = async () => {
    if (!user) return;
    if (!validateForm()) return;

    const targetClass = getTargetClassItem();
    if (!targetClass) {
      setError('Could not resolve authorized target class.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingAssignment) {
        const res = await assignmentService.updateAssignment(
          editingAssignment.id,
          user.uid,
          {
            title: title.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            dueDate,
            maxMarks,
            status: 'draft',
            published: false,
          }
        );
        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to save draft.');
        } else {
          onAssignmentCreated(res.assignment);
          onClose();
        }
      } else {
        const res = await assignmentService.createAssignment({
          classItem: targetClass,
          teacherId: user.uid,
          teacherName: user.name,
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'draft',
          published: false,
        });

        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to save draft.');
        } else {
          onAssignmentCreated(res.assignment);
          resetForm();
          onClose();
        }
      }
    } catch {
      setError('Network error while saving draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Publish Confirmation Dialog
  const handleOpenPublishConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowPublishConfirm(true);
    }
  };

  // Confirmed Publish Execution
  const handleExecutePublish = async () => {
    if (!user) return;
    const targetClass = getTargetClassItem();
    if (!targetClass) {
      setError('Could not resolve authorized target class.');
      setShowPublishConfirm(false);
      return;
    }

    setIsLoading(true);
    setShowPublishConfirm(false);

    try {
      if (editingAssignment) {
        const res = await assignmentService.updateAssignment(
          editingAssignment.id,
          user.uid,
          {
            title: title.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            dueDate,
            maxMarks,
            status: 'published',
            published: true,
          }
        );
        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to publish assignment.');
        } else {
          onAssignmentCreated(res.assignment);
          onClose();
        }
      } else {
        const res = await assignmentService.createAssignment({
          classItem: targetClass,
          teacherId: user.uid,
          teacherName: user.name,
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          dueDate,
          maxMarks,
          status: 'published',
          published: true,
        });

        if (res.error || !res.assignment) {
          setError(res.error || 'Failed to publish assignment.');
        } else {
          onAssignmentCreated(res.assignment);
          resetForm();
          onClose();
        }
      }
    } catch {
      setError('Network error while publishing assignment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setInstructions('');
    setError('');
    setShowPublishConfirm(false);
  };

  const selectedClassInfo = authorizedClasses.find((t) => t.id === selectedTeachingAssignmentId) || authorizedClasses[0];

  return (
    <>
      <Modal
        isOpen={isOpen && !showPublishConfirm}
        onClose={onClose}
        title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        subtitle="Configure and publish notebook questions for authorized classes"
        maxWidth="lg"
      >
        <form onSubmit={handleOpenPublishConfirm} className="space-y-4">
          {error && (
            <div className="p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject & Class Selection (Authorized Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subject Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Subject *</span>
              </label>
              {availableSubjects.length === 0 ? (
                <div className="p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                  No subjects assigned by Admin.
                </div>
              ) : (
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {availableSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Class / Semester Dropdown (Filtered to Selected Subject) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Target Class / Semester *</span>
              </label>
              {authorizedClasses.length === 0 ? (
                <div className="p-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                  No classes authorized for this subject.
                </div>
              ) : (
                <select
                  value={selectedTeachingAssignmentId}
                  onChange={(e) => setSelectedTeachingAssignmentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {authorizedClasses.map((ta) => (
                    <option key={ta.id} value={ta.id}>
                      {ta.semester} Semester (CSE)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Assignment Title */}
          <Input
            label="Assignment Title *"
            placeholder="e.g. Assignment 1: Functions & Pointers in C"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Question / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Assignment Question / Description *</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the questions clearly (e.g. 1. Write a program to find the factorial of a number using recursion. 2. Write algorithm and draw flowchart in your assignment notebook)."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notebook Submission Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Write verification code prominently at the top of each page. Ensure all handwriting is legible before submitting."
              className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Due Date & Max Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Due Date *"
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

          {/* Actions: Cancel, Save Draft, Publish Assignment */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveDraft}
                disabled={isLoading}
              >
                Save Draft
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                disabled={isLoading || availableSubjects.length === 0}
              >
                Publish Assignment
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Publishing */}
      {showPublishConfirm && (
        <Modal
          isOpen={showPublishConfirm}
          onClose={() => setShowPublishConfirm(false)}
          title="Publish Assignment Confirmation"
          subtitle="Please confirm the details before publishing to students"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
              <p className="font-bold text-sm text-blue-950">
                Publish this assignment to the selected class?
              </p>
              <p className="text-blue-800">
                Enrolled students in the target class will immediately be notified and can begin writing and capturing notebook pages.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Subject:</span>
                <span className="font-bold text-slate-900">{selectedSubject}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Class:</span>
                <span className="font-bold text-blue-700">{selectedClassInfo?.semester || 'Target'} Semester (CSE)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment Title:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[200px]">{title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Due Date:</span>
                <span className="font-bold text-slate-900">{formatDate(dueDate)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-slate-500">Maximum Marks:</span>
                <span className="font-bold text-slate-900">{maxMarks} Marks</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPublishConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleExecutePublish}
                isLoading={isLoading}
              >
                Confirm & Publish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
