import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Lock, 
  Filter,
  UserCheck,
  Edit3,
  Trash2
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { authService } from '../../services/authService';
import { StudentUser, Semester } from '../../types';
import { DEPARTMENT } from '../../config/constants';
import { normalizePIN, isValidStudentPIN } from '../../utils/pinValidator';

export const AdminStudentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editSemester, setEditSemester] = useState<Semester>('3rd');
  const [editPassword, setEditPassword] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [semester, setSemester] = useState<Semester>('3rd');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await authService.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normalized = normalizePIN(pin);
    if (!name.trim()) {
      setFormError('Student name is required.');
      return;
    }

    if (!isValidStudentPIN(normalized)) {
      setFormError('Invalid PIN format. Must be a valid diploma PIN like 24170-CM-001.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.createStudentAccount({
        name: name.trim(),
        pin: normalized,
        password,
        semester,
      });

      if (res.error) {
        setFormError(res.error);
      } else {
        setName('');
        setPin('');
        setPassword('');
        setIsModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create student account.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (student: StudentUser) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditPin(student.pin);
    setEditSemester(student.semester || '3rd');
    setEditPassword('');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);

    const normPin = normalizePIN(editPin);
    if (!editName.trim()) {
      setEditError('Student name is required.');
      return;
    }
    if (!isValidStudentPIN(normPin)) {
      setEditError('Valid PIN format required (e.g. 24170-CM-001).');
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError('Password must be at least 6 characters if resetting.');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await authService.updateStudentAccount(editingStudent.uid, {
        name: editName.trim(),
        pin: normPin,
        semester: editSemester,
        password: editPassword || undefined,
      });

      if (res.error) {
        setEditError(res.error);
      } else {
        setIsEditModalOpen(false);
        setEditingStudent(null);
        await loadData();
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update student account.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (student: StudentUser) => {
    const newStatus = student.status === 'disabled' ? 'active' : 'disabled';
    const confirmMsg = student.status === 'disabled' 
      ? `Re-enable student ${student.name} (${student.pin})?` 
      : `Disable student ${student.name} (${student.pin})? They will not be able to log in or submit assignments.`;

    if (window.confirm(confirmMsg)) {
      await authService.toggleUserStatus(student.uid, newStatus);
      await loadData();
    }
  };

  const handleDeleteStudent = async (student: StudentUser) => {
    const confirmMsg = `Are you sure you want to permanently DELETE student "${student.name}" (${student.pin})?\n\nThis will remove their profile and all assignment records.`;
    if (window.confirm(confirmMsg)) {
      await authService.deleteStudentAccount(student.uid);
      await loadData();
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSem = selectedSemester === 'all' || s.semester === selectedSemester;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.pin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSem && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading Student Roster..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500">
            Admin full control: Create, Change/Edit, Disable, and Delete student accounts with automatic semester enrollment.
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
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          Add New Student
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', '1st', '3rd', '4th', '5th'].map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSemester === sem
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sem === 'all' ? 'All Semesters' : `${sem} Sem`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">College PIN</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No students found matching your search. Click "Add New Student" to enroll one.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{student.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">UID: {student.uid.slice(0, 10)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700">
                      {student.pin}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="blue" size="sm">
                        {student.semester || '3rd'} Semester
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.status === 'disabled' ? (
                        <Badge variant="danger" size="sm">Disabled</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Change / Edit */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(student)}
                          className="text-xs px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:border-blue-300"
                          title="Edit Student Details & Password"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Change
                        </Button>

                        {/* Disable / Enable Toggle */}
                        <Button
                          variant={student.status === 'disabled' ? 'outline' : 'danger'}
                          size="sm"
                          onClick={() => handleToggleStatus(student)}
                          className="text-xs px-2.5 py-1"
                          title={student.status === 'disabled' ? 'Re-enable student' : 'Disable student'}
                        >
                          {student.status === 'disabled' ? 'Enable' : 'Disable'}
                        </Button>

                        {/* Delete Student */}
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Permanently Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Student Modal */}
      {editingStudent && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Student: ${editingStudent.name}`}
        >
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <p className="text-xs text-slate-500">
              Update student roster info, reassign semester, or reset password.
            </p>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {editError}
              </div>
            )}

            <Input
              label="Student Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Diploma College PIN"
              value={editPin}
              onChange={(e) => setEditPin(e.target.value.toUpperCase())}
              leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Semester
              </label>
              <select
                value={editSemester}
                onChange={(e) => setEditSemester(e.target.value as Semester)}
                className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="1st">1st Semester (1st Year)</option>
                <option value="3rd">3rd Semester (2nd Year)</option>
                <option value="4th">4th Semester (2nd Year)</option>
                <option value="5th">5th Semester (3rd Year)</option>
              </select>
            </div>

            <Input
              label="Reset Password (leave blank to keep unchanged)"
              type="password"
              placeholder="Enter new password if resetting"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              defaultVisible={true}
            />

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={editSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Student"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <p className="text-xs text-slate-500">
            Students log in using their official College PIN and password. They are automatically enrolled into all subjects for their semester.
          </p>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Student Full Name"
            placeholder="e.g. Aditya Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Diploma College PIN"
            placeholder="e.g. 24170-CM-001"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Enrolled Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="1st">1st Semester (1st Year)</option>
              <option value="3rd">3rd Semester (2nd Year)</option>
              <option value="4th">4th Semester (2nd Year)</option>
              <option value="5th">5th Semester (3rd Year)</option>
            </select>
          </div>

          <Input
            label="Initial Account Password"
            type="password"
            placeholder="Default password for student"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            defaultVisible={true}
            required
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
