import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  GraduationCap, 
  BookOpen, 
  Search,
  CheckCircle,
  Phone
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { academicService } from '../../services/academicService';
import { authService } from '../../services/authService';
import { StaffUser, Subject, TeachingAssignment, Semester } from '../../types';
import { DEPARTMENT } from '../../config/constants';

export const AdminTeachingAssignmentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<Semester>('3rd');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ta, staff, allSubjs] = await Promise.all([
        academicService.getAllTeachingAssignments(),
        authService.getAllStaff(),
        academicService.getAllSubjects(),
      ]);
      setTeachingAssignments(ta);
      setStaffList(staff);
      setSubjects(allSubjs);

      if (staff.length > 0) {
        setSelectedStaffId(staff[0].uid);
      }
      const initialSubjs = allSubjs.filter((s) => s.semester === '3rd');
      if (initialSubjs.length > 0) {
        setSelectedSubjectId(initialSubjs[0].id);
      }
    } catch (err) {
      console.error('Error loading teaching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSemesterChange = (sem: Semester) => {
    setSelectedSemester(sem);
    const semSubjs = subjects.filter((s) => s.semester === sem);
    if (semSubjs.length > 0) {
      setSelectedSubjectId(semSubjs[0].id);
    } else {
      setSelectedSubjectId('');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const staff = staffList.find((s) => s.uid === selectedStaffId);
    if (!staff) {
      setFormError('Please select a valid staff member.');
      return;
    }

    const subj = subjects.find((s) => s.id === selectedSubjectId);
    if (!subj) {
      setFormError('Please select a subject for this semester.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await academicService.assignStaffToSubject({
        staffId: staff.uid,
        staffName: staff.name,
        staffMobile: staff.mobile,
        semester: selectedSemester,
        subjectId: subj.id,
        subjectName: subj.name,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setIsModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign teaching subject.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (ta: TeachingAssignment) => {
    if (window.confirm(`Unassign ${ta.staffName} from ${ta.semester} Semester "${ta.subjectName}"?`)) {
      await academicService.deleteTeachingAssignment(ta.id);
      await loadData();
    }
  };

  const filteredAssignments = teachingAssignments.filter((ta) =>
    ta.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ta.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ta.semester.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Loading Teaching Assignments..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Teaching Assignments</h1>
          <p className="text-xs text-slate-500">
            Map faculty to Semester + Subject classes. Staff members automatically see these classes upon login.
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
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
        >
          Assign Faculty to Subject
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border-slate-200 flex items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by faculty, subject, or semester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total Class Offerings: <strong>{teachingAssignments.length}</strong>
        </span>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Semester</th>
                <th className="py-3.5 px-4">Curricular Subject</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No teaching assignments found.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((ta) => (
                  <tr key={ta.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{ta.staffName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{ta.staffMobile}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="blue" size="sm">{ta.semester} Semester</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {ta.subjectName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {DEPARTMENT}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(ta)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Unassign"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Unassign
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Faculty to Subject"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Faculty Member
            </label>
            {staffList.length === 0 ? (
              <p className="text-xs text-amber-600">No staff members found. Add staff first.</p>
            ) : (
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white font-medium text-slate-800"
              >
                {staffList.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.name} ({s.mobile})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value as Semester)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white font-medium text-slate-800"
            >
              <option value="1st">1st Semester</option>
              <option value="3rd">3rd Semester</option>
              <option value="4th">4th Semester</option>
              <option value="5th">5th Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white font-medium text-slate-800"
            >
              {subjects
                .filter((s) => s.semester === selectedSemester)
                .map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name}
                  </option>
                ))}
            </select>
          </div>

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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
