import React from 'react';
import { Calendar, Award, ExternalLink, ArrowRight, Clock } from 'lucide-react';
import { Assignment, Submission } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SemesterBadge, SubmissionStatusBadge } from '../common/Badge';
import { formatDate, getDaysRemaining } from '../../utils/dateUtils';

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: Submission | null;
  onSubmitClick: (assignment: Assignment, existingSubmission?: Submission | null) => void;
  onViewClick?: (assignment: Assignment) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  submission,
  onSubmitClick,
  onViewClick,
}) => {
  const status = submission?.status || 'not_submitted';
  const deadline = getDaysRemaining(assignment.dueDate);

  return (
    <Card hoverable className="space-y-3.5">
      {/* Header: Class, Semester, Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SemesterBadge semester={assignment.semester} />
            <span className="text-xs font-bold text-slate-700">{assignment.subject}</span>
          </div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            {assignment.title}
          </h3>
        </div>

        <SubmissionStatusBadge status={status} />
      </div>

      {/* Description preview */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
        {assignment.description}
      </p>

      {/* Checked Marks Banner */}
      {status === 'checked' && submission && submission.marks !== null && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Marks: {submission.marks} / {assignment.maxMarks}</span>
          </div>
          {submission.teacherFeedback && (
            <div className="text-xs text-emerald-700 italic truncate max-w-[200px]">
              "{submission.teacherFeedback}"
            </div>
          )}
        </div>
      )}

      {/* Resubmission Banner if Returned */}
      {status === 'returned' && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-900">
            Resubmission Requested by Teacher:
          </div>
          <p className="italic">{submission?.teacherFeedback || 'Please review and re-upload your notebook work.'}</p>
        </div>
      )}

      {/* Footer / Deadlines & Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Due {formatDate(assignment.dueDate)}</span>
          </div>
          {status === 'not_submitted' && deadline.text && (
            <span
              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                deadline.isOverdue
                  ? 'bg-rose-100 text-rose-700'
                  : deadline.isUrgent
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Clock className="w-3 h-3" />
              {deadline.text}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onViewClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewClick(assignment)}
            >
              Details
            </Button>
          )}

          <Button
            variant={status === 'not_submitted' || status === 'returned' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSubmitClick(assignment, submission)}
          >
            {status === 'not_submitted'
              ? 'Submit Assignment'
              : status === 'returned'
              ? 'Resubmit'
              : 'View / Edit Link'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
