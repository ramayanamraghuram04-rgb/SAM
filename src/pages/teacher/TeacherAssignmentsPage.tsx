import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Edit,
  Send,
  Lock,
  Archive,
  Camera,
  Upload
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [initialAttachmentMode, setInitialAttachmentMode] = useState<'camera' | 'upload' | 'drive' | null>(null);

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

  const handlePublishDraft = async (asg: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    const confirmMsg = `Publish assignment "${asg.title}" to ${asg.semester} Semester?\n\nEnrolled students will immediately be notified.`;
    if (window.confirm(confirmMsg)) {
      const res = await assignmentService.publishAssignment(asg.id, user.uid);
      if (res.assignment) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === asg.id ? res.assignment! : a))
        );
      }
    }
  };

  const handleEditDraft = (asg: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssignment(asg);
    setIsCreateModalOpen(true);
  };

  const filtered = assignments.filter((a) => {
    const matchesClass = filterClassId === 'all' || a.classId === filterClassId;
    const isDraft = a.status === 'draft' || a.published === false;
    const isPublished = (a.status === 'published' || a.status === 'active') && a.published !== false;
    const isClosed = a.status === 'closed' || a.status === 'archived';

    let matchesStatus = true;
    if (filterStatus === 'draft') matchesStatus = isDraft;
    else if (filterStatus === 'published') matchesStatus = isPublished;
    else if (filterStatus === 'closed') matchesStatus = isClosed;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q);

    return matchesClass && matchesStatus && matchesSearch;
  });

  const draftCount = assignments.filter((a) => a.status === 'draft' || a.published === false).length;
  const publishedCount = assignments.filter((a) => (a.status === 'published' || a.status === 'active') && a.published !== false).length;
  const closedCount = assignments.filter((a) => a.status === 'closed' || a.status === 'archived').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Assignments</h1>
          <p className="text-xs text-slate-500">
            Create, manage drafts, publish notebook questions, and evaluate student submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Camera className="w-4 h-4 text-blue-600" />}
            disabled={classes.length === 0}
            onClick={() => {
              setEditingAssignment(null);
              setInitialAttachmentMode('camera');
              setIsCreateModalOpen(true);
            }}
          >
            Camera Scan
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload className="w-4 h-4 text-indigo-600" />}
            disabled={classes.length === 0}
            onClick={() => {
              setEditingAssignment(null);
              setInitialAttachmentMode('upload');
              setIsCreateModalOpen(true);
            }}
          >
            Upload Question
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={classes.length === 0}
            onClick={() => {
              setEditingAssignment(null);
              setInitialAttachmentMode(null);
              setIsCreateModalOpen(true);
            }}
          >
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setFilterStatus('published')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === 'published'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === 'draft'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === 'closed'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>
        </div>

        {/* Class Filter pills if multiple classes */}
        {classes.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400">Filter Class:</span>
            <button
              onClick={() => setFilterClassId('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterClassId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Classes
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setFilterClassId(cls.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterClassId === cls.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls.semester} Sem — {cls.subject}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading assignments..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No assignments created yet"
          description={
            classes.length === 0
              ? 'You have no assigned classes. Please ask Administrator to assign teaching subjects.'
              : filterStatus !== 'all'
              ? `No assignments match status "${filterStatus}".`
              : "You haven't posted any assignments yet. Click below to create your first notebook question."
          }
          actionLabel={classes.length > 0 ? 'Create Assignment' : undefined}
          onAction={() => {
            setEditingAssignment(null);
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((asg) => {
            const isDraft = asg.status === 'draft' || asg.published === false;
            const isClosed = asg.status === 'closed';

            return (
              <Card
                key={asg.id}
                hoverable
                className={`p-5 space-y-3 cursor-pointer border transition-all ${
                  isDraft 
                    ? 'border-amber-300/80 bg-amber-50/20' 
                    : isClosed 
                    ? 'border-slate-200 opacity-80' 
                    : 'border-slate-200'
                }`}
                onClick={() => onSelectAssignment(asg)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SemesterBadge semester={asg.semester} />
                      <span className="text-xs font-bold text-slate-700">{asg.subject}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">{asg.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDraft ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        DRAFT
                      </span>
                    ) : isClosed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                        CLOSED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        PUBLISHED
                      </span>
                    )}

                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      {asg.maxMarks}M
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {asg.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {formatDate(asg.dueDate)}</span>
                  </div>

                  {isDraft ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleEditDraft(asg, e)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handlePublishDraft(asg, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publish</span>
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-blue-600 flex items-center gap-1">
                      View Submissions <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAssignment(null);
          setInitialAttachmentMode(null);
        }}
        classes={classes}
        editingAssignment={editingAssignment}
        initialAttachmentMode={initialAttachmentMode}
        onAssignmentCreated={(savedAsg) => {
          setAssignments((prev) => {
            const idx = prev.findIndex((a) => a.id === savedAsg.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedAsg;
              return copy;
            }
            return [savedAsg, ...prev];
          });
        }}
      />
    </div>
  );
};
