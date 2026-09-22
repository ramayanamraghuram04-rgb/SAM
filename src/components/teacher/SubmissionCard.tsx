import { ExternalLink, Edit3, Award, MessageSquare, Camera } from 'lucide-react';
import { Submission } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SubmissionStatusBadge } from '../common/Badge';
import { formatDateTime } from '../../utils/dateUtils';

interface SubmissionCardProps {
  submission: Submission;
  maxMarks?: number;
  onGradeClick: (submission: Submission) => void;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  maxMarks = 10,
  onGradeClick,
}) => {
  return (
    <Card hoverable padding="sm" className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">{submission.studentName}</h4>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {submission.studentPIN}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Submitted: {formatDateTime(submission.submittedAt)}
          </p>
        </div>

        <SubmissionStatusBadge status={submission.status} />
      </div>

      {/* Marks display if checked */}
      {submission.status === 'checked' && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Marks: {submission.marks} / {maxMarks}</span>
          </div>
          {submission.teacherFeedback && (
            <div className="text-xs text-emerald-700 italic truncate max-w-[200px]">
              "{submission.teacherFeedback}"
            </div>
          )}
        </div>
      )}

      {/* Student comment preview */}
      {submission.comment && (
        <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="italic line-clamp-1">{submission.comment}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        {submission.imageUrls && submission.imageUrls.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>{submission.imageUrls.length} Page{submission.imageUrls.length > 1 ? 's' : ''}</span>
          </span>
        ) : submission.driveLink ? (
          <a
            href={submission.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Legacy Drive
          </a>
        ) : (
          <span className="text-xs text-slate-400">Notebook Submission</span>
        )}

        <Button
          variant={submission.status === 'checked' ? 'outline' : 'primary'}
          size="sm"
          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          onClick={() => onGradeClick(submission)}
        >
          {submission.status === 'checked' ? 'Edit Marks' : 'Evaluate'}
        </Button>
      </div>
    </Card>
  );
};
