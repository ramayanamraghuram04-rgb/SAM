import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { submissionService } from '../../services/submissionService';
import { Submission } from '../../types';
import { NotebookImageViewer } from '../../components/common/NotebookImageViewer';
import { formatDateTime } from '../../utils/dateUtils';
import { DEPARTMENT } from '../../config/constants';

export const AdminSubmissionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const allSubs = await submissionService.getAllSubmissions();
      setSubmissions(allSubs);
    } catch (err) {
      console.error('Error loading submissions for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'pending' && (s.status === 'submitted' || s.status === 'under_review')) ||
      s.status === statusFilter;
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentPIN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.verificationCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner message="Loading System Submissions..." />;
  }

  const openSubmissionModal = (sub: Submission) => {
    setViewingSubmission(sub);
  };

  const hasImages = Boolean(viewingSubmission?.imageUrls && viewingSubmission.imageUrls.length > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Submissions</h1>
          <p className="text-xs text-slate-500">
            Monitor and audit all student notebook submissions, verification codes, and evaluation grades in {DEPARTMENT}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="md">
            {submissions.length} Total Submissions
          </Badge>
        </div>
      </div>

      {/* Search and Status Filters */}
      <Card className="p-4 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, PIN, verification code, or assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'checked', label: 'Graded' },
            { id: 'returned', label: 'Resubmission' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === item.id ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Submissions Table / Cards */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No submissions found matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">Student notebook captures will appear here.</p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isCamera = Boolean(sub.imageUrls && sub.imageUrls.length > 0);

            return (
              <Card
                key={sub.id}
                className="p-5 border-slate-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => openSubmissionModal(sub)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {sub.studentName}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sub.studentPIN}
                      </span>
                      {sub.verificationCode && (
                        <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          Code: {sub.verificationCode}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                      {sub.assignmentTitle}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Submitted: {formatDateTime(sub.submittedAt)}</span>
                      <span>•</span>
                      <span>{isCamera ? `${sub.imageUrls?.length || 1} Pages Captured` : 'Legacy Drive Link'}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {sub.status === 'checked' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {sub.marks ?? 0} Marks Awarded
                      </span>
                    ) : sub.status === 'returned' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                        <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                        Needs Resubmission
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Grading
                      </span>
                    )}

                    <span className="text-xs text-blue-600 font-bold hover:underline">
                      View Notebook &rarr;
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* INSPECT SUBMISSION MODAL */}
      <Modal
        isOpen={Boolean(viewingSubmission)}
        onClose={() => setViewingSubmission(null)}
        title="Inspect Student Submission"
        subtitle={viewingSubmission ? `${viewingSubmission.studentName} (${viewingSubmission.studentPIN})` : ''}
        maxWidth="lg"
      >
        {viewingSubmission && (
          <div className="space-y-4">
            {/* Prominent Verification Code Details */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/60 to-slate-50 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase bg-blue-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  Verification Security
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Submitted: {formatDateTime(viewingSubmission.submittedAt)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Student</span>
                  <strong className="text-slate-900">{viewingSubmission.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">PIN</span>
                  <strong className="font-mono text-slate-900">{viewingSubmission.studentPIN}</strong>
                </div>
                <div>
                  <span className="text-blue-600 block text-[10px] font-bold uppercase">SAM Verification Code</span>
                  {viewingSubmission.verificationCode ? (
                    <strong className="font-mono text-base font-black text-blue-700 tracking-wider">
                      {viewingSubmission.verificationCode}
                    </strong>
                  ) : (
                    <span className="text-slate-400 italic">Not recorded (legacy)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notebook Image Viewer */}
            {hasImages ? (
              <NotebookImageViewer
                imageUrls={viewingSubmission.imageUrls!}
                verificationCode={viewingSubmission.verificationCode}
                studentName={viewingSubmission.studentName}
                studentPIN={viewingSubmission.studentPIN}
              />
            ) : viewingSubmission.driveLink ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  onClick={() => window.open(viewingSubmission.driveLink, '_blank')}
                >
                  Open in Google Drive
                </Button>
                <p className="text-xs text-slate-400 mt-2">Legacy submission photo folder</p>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No attached image files found.
              </div>
            )}

            {/* Marks and Feedback */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Grading Status:</span>
                <strong className="text-slate-900">
                  {viewingSubmission.status === 'checked' 
                    ? `${viewingSubmission.marks ?? 0} Marks Awarded`
                    : viewingSubmission.status === 'returned'
                    ? 'Resubmission Requested'
                    : 'Pending Teacher Evaluation'}
                </strong>
              </div>
              {viewingSubmission.teacherFeedback && (
                <div className="text-right max-w-xs">
                  <span className="text-slate-500 block">Faculty Note:</span>
                  <span className="text-slate-800 italic">"{viewingSubmission.teacherFeedback}"</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setViewingSubmission(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
