import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  GraduationCap,
  Layers,
  Phone,
  Lock,
  PlusCircle,
  X
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { authService } from '../../services/authService';
import { academicService } from '../../services/academicService';
import { StaffUser, Subject, Semester, TeachingAssignment } from '../../types';
import { DEPARTMENT } from '../../config/constants';
import { isValidIndianMobile } from '../../utils/phoneValidator';

export const AdminStaffPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAssignments, setSelectedAssignments] = useState<
    Array<{ semester: Semester; subjectId: string; subjectName: string }>
  >([]);

  // Teaching picker temporary row
  const [selectedSem, setSelectedSem] = useState<Semester>('3rd');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [staff, allSubjects, allTa] = await Promise.all([
        authService.getAllStaff(),
        academicService.getAllSubjects(),
        academicService.getAllTeachingAssignments(),
      ]);
      setStaffList(staff);
      setSubjects(allSubjects);
      setTeachingAssignments(allTa);

      // Set default subject for picker if available
      const semSubjs = allSubjects.filter((s) => s.semester === '3rd');
      if (semSubjs.length > 0) {
        setSelectedSubjectId(semSubjs[0].id);
      }
    } catch (err) {
      console.error('Error loading staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSemesterChange = (sem: Semester) => {
    setSelectedSem(sem);
    const semSubjs = subjects.filter((s) => s.semester === sem);
    if (semSubjs.length > 0) {
      setSelectedSubjectId(semSubjs[0].id);
    } else {
      setSelectedSubjectId('');
    }
  };

  const handleAddTeachingRow = () => {
    if (!selectedSubjectId) return;
    const subj = subjects.find((s) => s.id === selectedSubjectId);
    if (!subj) return;

    // Check duplicate
    const exists = selectedAssignments.some(
      (a) => a.semester === selectedSem && a.subjectId === selectedSubjectId
    );
    if (exists) {
      setFormError('This subject has already been added to the teaching list.');
      return;
    }

    setSelectedAssignments([
      ...selectedAssignments,
      { semester: selectedSem, subjectId: subj.id, subjectName: subj.name },
    ]);
    setFormError(null);
  };

  const handleRemoveTeachingRow = (index: number) => {
    setSelectedAssignments(selectedAssignments.filter((_, i) => i !== index));
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const clean = mobile.replace(/\D/g, '');
    if (!name.trim()) {
      setFormError('Staff name is required.');
      return;
    }

    if (!isValidIndianMobile(clean)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.createStaffAccount({
        name: name.trim(),
        mobile: clean,
        password,
        teachingAssignments: selectedAssignments,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        // Reset and close
        setName('');
        setMobile('');
        setPassword('');
        setSelectedAssignments([]);
        setIsModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    const newStatus = staff.status === 'disabled' ? 'active' : 'disabled';
    const confirmMsg = staff.status === 'disabled' 
      ? `Re-enable ${staff.name}'s account?` 
      : `Disable ${staff.name}'s account? They will not be able to log in.`;

    if (window.confirm(confirmMsg)) {
      await authService.toggleUserStatus(staff.uid, newStatus);
      await loadData();
    }
  };

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mobile.includes(searchQuery)
  );

  if (loading) {
    return <LoadingSpinner message="Loading Staff Directory..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Faculty & Staff</h1>
          <p className="text-xs text-slate-500">
            Create staff accounts, assign subjects across semesters, and manage account statuses.
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
          Add New Staff
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <Card className="p-4 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by faculty name or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto">
          <span>Total Staff: <strong>{staffList.length}</strong></span>
          <span>•</span>
          <span className="text-emerald-600 font-medium">Active: {staffList.filter(s => s.status !== 'disabled').length}</span>
          <span>•</span>
          <span className="text-rose-600 font-medium">Disabled: {staffList.filter(s => s.status === 'disabled').length}</span>
        </div>
      </Card>

      {/* Staff Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Teaching Subjects</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No faculty found matching your query.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const staffAssignments = teachingAssignments.filter((t) => t.staffId === staff.uid);
                  return (
                    <tr key={staff.uid} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {staff.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{staff.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Department of {staff.department || DEPARTMENT}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {staff.mobile}
                      </td>
                      <td className="py-3.5 px-4">
                        {staffAssignments.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No subjects assigned yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {staffAssignments.map((ta) => (
                              <span
                                key={ta.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200"
                              >
                                <span className="font-bold">{ta.semester}:</span> {ta.subjectName}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {staff.status === 'disabled' ? (
                          <Badge variant="danger" size="sm">Disabled</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={staff.status === 'disabled' ? 'outline' : 'danger'}
                          size="sm"
                          onClick={() => handleToggleStatus(staff)}
                          className="text-xs"
                        >
                          {staff.status === 'disabled' ? 'Enable' : 'Disable'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Faculty / Staff Account"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <p className="text-xs text-slate-500">
            Staff will use their Mobile Number and Password to log in. You can also assign the subjects they teach across multiple semesters right here.
          </p>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Staff Full Name"
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Mobile Number (10 Digits)"
            type="tel"
            placeholder="e.g. 9876543210"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Account Password"
            type="password"
            placeholder="Initial password for staff"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            defaultVisible={true}
            required
          />

          {/* Teaching Assignment Section */}
          <div className="pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Teaching Subjects Assignment
            </label>
            <p className="text-[11px] text-slate-500 mb-3">
              A staff member can teach multiple subjects across 1st, 3rd, 4th, and 5th semesters.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Semester</label>
                  <select
                    value={selectedSem}
                    onChange={(e) => handleSemesterChange(e.target.value as Semester)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    <option value="1st">1st Semester</option>
                    <option value="3rd">3rd Semester</option>
                    <option value="4th">4th Semester</option>
                    <option value="5th">5th Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                  >
                    {subjects
                      .filter((s) => s.semester === selectedSem)
                      .map((subj) => (
                        <option key={subj.id} value={subj.id}>
                          {subj.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleAddTeachingRow}
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                + Add Subject to Teaching List
              </Button>
            </div>

            {/* List of added teaching subjects */}
            {selectedAssignments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">Assigned Subjects:</span>
                {selectedAssignments.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900"
                  >
                    <span>
                      <strong>{a.semester} Sem:</strong> {a.subjectName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeachingRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
