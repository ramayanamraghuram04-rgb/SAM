import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Layers, 
  GraduationCap, 
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { academicService } from '../../services/academicService';
import { Subject, Semester, TeachingAssignment } from '../../types';
import { DEPARTMENT, SUPPORTED_SEMESTERS } from '../../config/constants';

export const AdminSubjectsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState<Semester>('3rd');

  const loadData = async () => {
    setLoading(true);
    try {
      await academicService.seedDefaultSubjects();
      const [allSubjs, allTa] = await Promise.all([
        academicService.getAllSubjects(),
        academicService.getAllTeachingAssignments(),
      ]);
      setSubjects(allSubjs);
      setTeachingAssignments(allTa);
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Subject name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await academicService.createSubject({
        name: name.trim(),
        semester,
        code: code.trim() || undefined,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setName('');
        setCode('');
        setIsModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subj: Subject) => {
    if (window.confirm(`Are you sure you want to delete "${subj.name}" (${subj.semester} Semester)?`)) {
      await academicService.deleteSubject(subj.id);
      await loadData();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Academic Subjects..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Curricular Subjects</h1>
          <p className="text-xs text-slate-500">
            Official subjects for {DEPARTMENT} across 1st, 3rd, 4th, and 5th semesters. Students automatically access all subjects in their semester.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          Add New Subject
        </Button>
      </div>

      {/* Subjects grouped by Semester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SUPPORTED_SEMESTERS.map((semInfo) => {
          const semSubjs = subjects.filter((s) => s.semester === semInfo.id);
          return (
            <Card key={semInfo.id} className="p-6 border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {semInfo.id}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{semInfo.label}</h2>
                    <span className="text-[10px] text-slate-400 font-medium">{semInfo.year} • {DEPARTMENT}</span>
                  </div>
                </div>
                <Badge variant="blue" size="sm">{semSubjs.length} Subjects</Badge>
              </div>

              {semSubjs.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No subjects listed for {semInfo.label}. Click 'Add New Subject' to register.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {semSubjs.map((subj) => {
                    const assignedStaff = teachingAssignments.filter(
                      (ta) => ta.semester === subj.semester && (ta.subjectId === subj.id || ta.subjectName === subj.name)
                    );
                    return (
                      <div
                        key={subj.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{subj.name}</span>
                            {subj.code && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                                {subj.code}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px]">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {assignedStaff.length === 0 ? (
                              <span className="text-amber-600 font-medium italic">No faculty assigned</span>
                            ) : (
                              <span className="text-slate-600 font-medium">
                                {assignedStaff.map((t) => t.staffName).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(subj)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Curricular Subject"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white font-medium text-slate-800"
            >
              <option value="1st">1st Semester</option>
              <option value="3rd">3rd Semester</option>
              <option value="4th">4th Semester</option>
              <option value="5th">5th Semester</option>
            </select>
          </div>

          <Input
            label="Subject Name"
            placeholder="e.g. C Programming, Web Technology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Subject Code (Optional)"
            placeholder="e.g. CS-301, 17CS-302"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
