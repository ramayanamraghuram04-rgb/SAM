import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  UserPlus, 
  Plus, 
  Users, 
  FileText, 
  Calendar, 
  CreditCard, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { ClassItem, Assignment, ClassMember } from '../../types';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { InviteStudentModal } from '../../components/teacher/InviteStudentModal';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';
import { formatDate } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

interface TeacherClassDetailsPageProps {
  classItem: ClassItem;
  onBack: () => void;
  onSelectAssignment: (assignment: Assignment) => void;
}

export const TeacherClassDetailsPage: React.FC<TeacherClassDetailsPageProps> = ({
  classItem,
  onBack,
  onSelectAssignment,
}) => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [isCreateAsgModalOpen, setIsCreateAsgModalOpen] = useState<boolean>(false);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const [asgList, studentList] = await Promise.all([
        assignmentService.getClassAssignments(classItem.id),
        classService.getClassStudents(classItem.id),
      ]);
      setAssignments(asgList);
      setStudents(studentList);
    } catch (err) {
      console.error('Error loading class details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [classItem.id]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Classes</span>
      </button>

      {/* Class Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SemesterBadge semester={classItem.semester} />
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {DEPARTMENT}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{classItem.subject}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Faculty: {classItem.teacherName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Student
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateAsgModalOpen(true)}
            >
              New Assignment
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 pb-2 text-xs font-bold transition-colors relative ${
              activeTab === 'assignments' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Assignments ({assignments.length})</span>
            {activeTab === 'assignments' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 pb-2 text-xs font-bold transition-colors relative ${
              activeTab === 'students' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Students ({students.length})</span>
            {activeTab === 'students' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSpinner message="Loading class content..." />
      ) : activeTab === 'assignments' ? (
        /* Assignments list */
        assignments.length === 0 ? (
          <EmptyState
            title="No assignments posted yet"
            description="Create questions for your students to complete in their notebook and upload via Google Drive."
            actionLabel="Create Assignment"
            onAction={() => setIsCreateAsgModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => (
              <Card
                key={asg.id}
                hoverable
                className="p-5 space-y-3 cursor-pointer"
                onClick={() => onSelectAssignment(asg)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-extrabold text-slate-900">{asg.title}</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {asg.maxMarks} Marks
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{asg.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {formatDate(asg.dueDate)}</span>
                  </div>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    Review Submissions <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Enrolled Students list */
        students.length === 0 ? (
          <EmptyState
            title="No students enrolled yet"
            description="Invite students using their college PIN (e.g. 24170-CM-001). Once they accept, they will appear here."
            actionLabel="Invite First Student"
            onAction={() => setIsInviteModalOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Enrolled Students ({students.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setIsInviteModalOpen(true)}
              >
                Invite More
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {students.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {member.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{member.studentName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {member.studentPIN}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Active Member
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Modals */}
      <InviteStudentModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        classItem={classItem}
        onInvitationSent={fetchClassData}
      />

      <CreateAssignmentModal
        isOpen={isCreateAsgModalOpen}
        onClose={() => setIsCreateAsgModalOpen(false)}
        classes={[classItem]}
        defaultClassId={classItem.id}
        onAssignmentCreated={(newAsg) => {
          setAssignments((prev) => [newAsg, ...prev]);
        }}
      />
    </div>
  );
};
