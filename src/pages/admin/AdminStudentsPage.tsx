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
  UserCheck
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
            Register students into their semester, manage PIN credentials, and monitor account status.
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
          Add New Student
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by student name or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Semester Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedSemester === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            {(['1st', '3rd', '4th', '5th'] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedSemester === sem
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sem} Sem ({students.filter((s) => s.semester === sem).length})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Student Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student PIN</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Semester & Branch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.uid} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-900">
                      {student.pin}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="blue" size="sm">{student.semester || '3rd'} Sem</Badge>
                        <span className="text-[10px] text-slate-500 font-medium">CSE</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.status === 'disabled' ? (
                        <Badge variant="danger" size="sm">Disabled</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Active</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={student.status === 'disabled' ? 'outline' : 'danger'}
                        size="sm"
                        onClick={() => handleToggleStatus(student)}
                        className="text-xs"
                      >
                        {student.status === 'disabled' ? 'Enable' : 'Disable'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Student Account"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <p className="text-xs text-slate-500">
            Create an official student account. The student will log in using their College PIN and Password. All subjects for their semester will be available to them automatically.
          </p>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {formError}
            </div>
          )}

          <Input
            label="Student Full Name"
            placeholder="e.g. Ravi Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="College PIN"
            placeholder="e.g. 24170-CM-001"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />}
            helperText="Permanent diploma roll/pin number"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Semester Class
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as Semester)}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 bg-white font-medium text-slate-800"
            >
              <option value="1st">1st Semester (1st Year)</option>
              <option value="3rd">3rd Semester (2nd Year)</option>
              <option value="4th">4th Semester (2nd Year)</option>
              <option value="5th">5th Semester (3rd Year)</option>
            </select>
          </div>

          <Input
            label="Student Account Password"
            type="password"
            placeholder="Initial password for student"
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Register Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
