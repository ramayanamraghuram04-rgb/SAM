import React, { useState, useEffect } from 'react';
import { Plus, Users, FileText, UserPlus, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ClassItem, Semester } from '../../types';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateClassModal } from '../../components/teacher/CreateClassModal';
import { InviteStudentModal } from '../../components/teacher/InviteStudentModal';
import { SUPPORTED_SEMESTERS } from '../../config/constants';

interface TeacherClassesPageProps {
  onSelectClass: (cls: ClassItem) => void;
}

export const TeacherClassesPage: React.FC<TeacherClassesPageProps> = ({ onSelectClass }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [inviteClass, setInviteClass] = useState<ClassItem | null>(null);

  const fetchClasses = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const list = await classService.getTeacherClasses(user.uid);
      setClasses(list);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user?.uid]);

  const filteredClasses = filterSemester === 'all'
    ? classes
    : classes.filter((c) => c.semester === filterSemester);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Teaching Classes</h1>
          <p className="text-xs text-slate-500">
            Manage your subjects across 1st, 3rd, 4th, and 5th semesters
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Class
        </Button>
      </div>

      {/* Semester Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterSemester('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterSemester === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Semesters ({classes.length})
        </button>
        {SUPPORTED_SEMESTERS.map((sem) => {
          const count = classes.filter((c) => c.semester === sem.id).length;
          return (
            <button
              key={sem.id}
              onClick={() => setFilterSemester(sem.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterSemester === sem.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sem.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Classes List */}
      {loading ? (
        <LoadingSpinner message="Loading your teaching classes..." />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          title="No classes found"
          description={
            filterSemester === 'all'
              ? "You haven't created any teaching classes yet. Create your first subject class to get started."
              : `No classes created under ${filterSemester} Semester yet.`
          }
          actionLabel="Create Class"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} hoverable className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <SemesterBadge semester={cls.semester} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {cls.department}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{cls.subject}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{cls.studentCount || 0} Students enrolled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{cls.assignmentCount || 0} Assignments</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  onClick={() => setInviteClass(cls)}
                >
                  Invite Student
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => onSelectClass(cls)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={(newClass) => {
          setClasses((prev) => [newClass, ...prev]);
        }}
      />

      {inviteClass && (
        <InviteStudentModal
          isOpen={Boolean(inviteClass)}
          onClose={() => setInviteClass(null)}
          classItem={inviteClass}
          onInvitationSent={fetchClasses}
        />
      )}
    </div>
  );
};
