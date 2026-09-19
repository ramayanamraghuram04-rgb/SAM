import React, { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Assignment, ClassItem } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { classService } from '../../services/classService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';
import { formatDate } from '../../utils/dateUtils';

interface TeacherAssignmentsPageProps {
  onSelectAssignment: (assignment: Assignment) => void;
}

export const TeacherAssignmentsPage: React.FC<TeacherAssignmentsPageProps> = ({
  onSelectAssignment,
}) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [asgList, clsList] = await Promise.all([
        assignmentService.getTeacherAssignments(user.uid),
        classService.getTeacherClasses(user.uid),
      ]);
      setAssignments(asgList);
      setClasses(clsList);
    } catch (err) {
      console.error('Error fetching teacher assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const filtered = filterClassId === 'all'
    ? assignments
    : assignments.filter((a) => a.classId === filterClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignment Questions</h1>
          <p className="text-xs text-slate-500">
            Publish notebook questions and inspect student Google Drive submissions
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={classes.length === 0}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Assignment
        </Button>
      </div>

      {/* Class filter if teacher has multiple classes */}
      {classes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterClassId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterClassId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Classes ({assignments.length})
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setFilterClassId(cls.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterClassId === cls.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cls.semester} Sem — {cls.subject}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading assignments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description={
            classes.length === 0
              ? 'You need to create a class before you can post assignments.'
              : "You haven't posted any assignments yet. Click below to publish your first notebook question."
          }
          actionLabel={classes.length > 0 ? 'Create Assignment' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((asg) => (
            <Card
              key={asg.id}
              hoverable
              className="p-5 space-y-3 cursor-pointer"
              onClick={() => onSelectAssignment(asg)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SemesterBadge semester={asg.semester} />
                    <span className="text-xs font-bold text-slate-700">{asg.subject}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{asg.title}</h3>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {asg.maxMarks} Marks
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                {asg.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due: {formatDate(asg.dueDate)}</span>
                </div>
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  View Submissions <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classes={classes}
        onAssignmentCreated={(newAsg) => {
          setAssignments((prev) => [newAsg, ...prev]);
        }}
      />
    </div>
  );
};
