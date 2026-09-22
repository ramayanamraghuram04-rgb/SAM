import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Eye,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { academicService } from '../../services/academicService';
import { authService } from '../../services/authService';
import { ClassItem, Semester, StudentUser } from '../../types';
import { DEPARTMENT, SUPPORTED_SEMESTERS } from '../../config/constants';

export const AdminClassesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [semester, setSemester] = useState<Semester>('3rd');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSemester, setEditSemester] = useState<Semester>('3rd');
  const [editAcademicYear, setEditAcademicYear] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // View Students in Class Modal
  const [viewingClass, setViewingClass] = useState<ClassItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      await academicService.seedDefaultClasses();
      const [classList, studentList] = await Promise.all([
        academicService.getAllClasses(),
        authService.getAllStudents(),
      ]);
      setClasses(classList);
      setStudents(studentList);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Class name is required (e.g. 3rd Semester CSE - Batch A).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await academicService.createClass({
        name: name.trim(),
        semester,
        academicYear: academicYear.trim() || '2026-2027',
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setName('');
        setIsCreateModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create class.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (cls: ClassItem) => {
    setEditingClass(cls);
    setEditName(cls.name || `${cls.semester} Semester CSE`);
    setEditSemester(cls.semester);
    setEditAcademicYear(cls.academicYear || '2025-2026');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Class name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await academicService.updateClass(editingClass.id, {
        name: editName.trim(),
        semester: editSemester,
        academicYear: editAcademicYear.trim() || '2025-2026',
      });

      if (res.error) {
        setEditError(res.error);
      } else {
        setIsEditModalOpen(false);
        setEditingClass(null);
        await loadData();
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cls: ClassItem) => {
    const newStatus = cls.status === 'disabled' ? 'active' : 'disabled';
    const msg = cls.status === 'disabled'
      ? `Re-enable class "${cls.name || cls.semester + ' Sem'}"?`
      : `Disable class "${cls.name || cls.semester + ' Sem'}"? Students in this class will not receive new assignments.`;

    if (window.confirm(msg)) {
      await academicService.toggleClassStatus(cls.id, newStatus);
      await loadData();
    }
  };

  const handleDeleteClass = async (cls: ClassItem) => {
    if (window.confirm(`Are you sure you want to delete class "${cls.name || cls.semester + ' Sem'}"?`)) {
      await academicService.deleteClass(cls.id);
      await loadData();
    }
  };

  const filteredClasses = classes.filter((c) => {
    const matchesSem = selectedSemester === 'all' || c.semester === selectedSemester;
    const cName = c.name || `${c.semester} Semester CSE`;
    const matchesSearch = 
      cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.semester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.academicYear || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSem && matchesSearch;
  });

  const studentsInViewClass = viewingClass 
    ? students.filter((s) => s.semester === viewingClass.semester)
    : [];

  if (loading) {
    return <LoadingSpinner message="Loading Class Directory..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Class Management</h1>
          <p className="text-xs text-slate-500">
            Admin full control: Create, edit, and organize academic classes and batches for {DEPARTMENT}.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          Create New Class
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search classes by name, semester, or academic year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedSemester === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Semesters
          </button>
          {(['1st', '3rd', '4th', '5th'] as const).map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedSemester === sem ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {sem} Sem
            </button>
          ))}
        </div>
      </Card>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {filteredClasses.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No classes match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing filters or click "Create New Class".</p>
          </div>
        ) : (
          filteredClasses.map((cls) => {
            const enrolled = students.filter((s) => s.semester === cls.semester);
            const isInactive = cls.status === 'disabled';

            return (
              <Card 
                key={cls.id} 
                className={`p-5 border transition-all ${
                  isInactive ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:shadow-md hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {cls.name || `${cls.semester} Semester CSE`}
                      </span>
                      {isInactive ? (
                        <Badge variant="danger" size="sm">Disabled</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {cls.semester} Semester
                      </span>
                      <span>Department: {cls.department || DEPARTMENT}</span>
                      {cls.academicYear && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3" />
                          Batch: {cls.academicYear}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingClass(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View Students in Class"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Class Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cls)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isInactive 
                          ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                          : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                      }`}
                      title={isInactive ? 'Enable Class' : 'Disable Class'}
                    >
                      {isInactive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClass(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{enrolled.length} Enrolled Students</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingClass(cls)}
                    className="text-blue-600 hover:text-blue-700 font-bold"
                  >
                    View Roster &rarr;
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE CLASS MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Academic Class"
        subtitle={`Add a new batch or class section in ${DEPARTMENT}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Class Name *
            </label>
            <Input
              placeholder="e.g. 3rd Semester CSE - Section A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as Semester)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="1st">1st Semester</option>
                <option value="3rd">3rd Semester</option>
                <option value="4th">4th Semester</option>
                <option value="5th">5th Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year / Batch
              </label>
              <Input
                placeholder="e.g. 2025-2026"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Class Details"
        subtitle={editingClass ? (editingClass.name || `${editingClass.semester} Semester`) : ''}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateClass} className="space-y-4">
          {editError && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Class Name *
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Semester *
              </label>
              <select
                value={editSemester}
                onChange={(e) => setEditSemester(e.target.value as Semester)}
                className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="1st">1st Semester</option>
                <option value="3rd">3rd Semester</option>
                <option value="4th">4th Semester</option>
                <option value="5th">5th Semester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Academic Year / Batch
              </label>
              <Input
                value={editAcademicYear}
                onChange={(e) => setEditAcademicYear(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW STUDENTS IN CLASS ROSTER MODAL */}
      <Modal
        isOpen={Boolean(viewingClass)}
        onClose={() => setViewingClass(null)}
        title={viewingClass?.name || `${viewingClass?.semester} Semester CSE Roster`}
        subtitle={`${studentsInViewClass.length} Students automatically enrolled in ${viewingClass?.semester} Semester`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {studentsInViewClass.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No students are currently registered in this semester.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {studentsInViewClass.map((st) => (
                <div
                  key={st.uid}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{st.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">{st.pin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {st.semester} Sem
                    </span>
                    {st.status === 'disabled' ? (
                      <Badge variant="danger" size="sm">Disabled</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setViewingClass(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
