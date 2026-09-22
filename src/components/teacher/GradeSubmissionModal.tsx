import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  ShieldCheck, 
  Lock, 
  RefreshCw,
  AlertCircle,
  Sparkles,
  Scan,
  Eye
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Submission } from '../../types';
import { submissionService } from '../../services/submissionService';
import { verificationCodeService } from '../../services/verificationCodeService';
import { aiVerificationService, AICodeDetectionResult } from '../../services/aiVerificationService';
import { NotebookImageViewer } from '../common/NotebookImageViewer';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';

interface GradeSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  maxMarks?: number;
  onGraded: (updatedSubmission: Submission) => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  maxMarks = 10,
  onGraded,
}) => {
  const { user } = useAuth();
  const [marks, setMarks] = useState<number | ''>(submission.marks ?? '');
  const [feedback, setFeedback] = useState<string>(submission.teacherFeedback || submission.feedback || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Confirmation dialog states (Sections 20 & 21)
  const [showGradeConfirm, setShowGradeConfirm] = useState<boolean>(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState<boolean>(false);

  // Manual Visual Verification Acknowledgment (Section 17)
  const [hasVerifiedCodeVisually, setHasVerifiedCodeVisually] = useState<boolean>(false);

  // Per-student assignment verification code states
  const [currentVerificationCode, setCurrentVerificationCode] = useState<string>(submission.verificationCode || '');
  const [isRegeneratingCode, setIsRegeneratingCode] = useState<boolean>(false);
  const [regenerationNotice, setRegenerationNotice] = useState<string | null>(null);

  // Synchronize or load verification code
  useEffect(() => {
    if (submission.verificationCode) {
      setCurrentVerificationCode(submission.verificationCode);
    } else {
      verificationCodeService
        .getVerificationCode(submission.assignmentId, submission.studentId)
        .then((rec) => {
          if (rec?.code) {
            setCurrentVerificationCode(rec.code);
          }
        })
        .catch((err) => console.error('Error fetching verification code:', err));
    }
  }, [submission]);

  // Handle staff/admin code regeneration
  const handleRegenerateCode = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      'Regenerate verification code?\n\nAll future captures for this assignment will use the new code.'
    );
    if (!confirmed) return;

    setIsRegeneratingCode(true);
    setRegenerationNotice(null);
    try {
      const res = await verificationCodeService.regenerateVerificationCode({
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentPIN: submission.studentPIN,
        studentName: submission.studentName,
        authorizedBy: user.uid,
      });
      setCurrentVerificationCode(res.code);
      setRegenerationNotice(`New verification code ${res.code} generated successfully.`);
    } catch (err: any) {
      console.error('Failed to regenerate verification code:', err);
      alert('Failed to regenerate verification code. Please try again.');
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const hasImages = Boolean(submission.imageUrls && submission.imageUrls.length > 0);
  const isDriveLink = Boolean(submission.driveLink && submission.driveLink.includes('drive.google.com'));

  const handleOpenDrive = () => {
    if (submission.driveLink) {
      window.open(submission.driveLink, '_blank', 'noopener,noreferrer');
    }
  };

  // AI Verification State
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanStatus, setAiScanStatus] = useState<string>('');
  const [aiResult, setAiResult] = useState<AICodeDetectionResult | null>(null);
  const [showAiText, setShowAiText] = useState<boolean>(false);

  const handleRunAiScan = async () => {
    if (!submission.imageUrls || submission.imageUrls.length === 0) {
      alert('No notebook page images found in this submission.');
      return;
    }
    const targetCode = currentVerificationCode || submission.verificationCode;
    if (!targetCode) {
      alert('No verification code found for this submission.');
      return;
    }

    setIsAiScanning(true);
    setAiResult(null);
    setAiScanStatus('Initializing AI Vision Scanner...');

    try {
      const res = await aiVerificationService.verifyNotebookPages({
        images: submission.imageUrls,
        targetCode,
        onProgress: (p) => {
          setAiScanStatus(p.statusText);
        },
      });

      setAiResult(res);
      if (res.codeFound) {
        setHasVerifiedCodeVisually(true);
      }
    } catch (err: any) {
      console.error('AI Scan Error:', err);
      setAiResult({
        codeFound: false,
        confidence: 0,
        matchedPage: null,
        scannedPagesCount: 0,
        allPagesText: [],
        error: err?.message || 'AI scanner encountered an issue. Please visually inspect the notebook.',
      });
    } finally {
      setIsAiScanning(false);
      setAiScanStatus('');
    }
  };

  // Open Grade Confirmation Modal after validation
  const handleOpenGradeConfirm = () => {
    setError('');
    if (marks === '' || Number(marks) < 0 || Number(marks) > maxMarks) {
      setError(`Please enter valid marks between 0 and ${maxMarks}.`);
      return;
    }
    setShowGradeConfirm(true);
  };

  // Open Return for Correction Confirmation Modal
  const handleOpenReturnConfirm = () => {
    setError('');
    setShowReturnConfirm(true);
  };

  // Confirmed Grade Execution
  const handleExecuteGrade = async () => {
    if (!user) return;
    setIsLoading(true);
    setShowGradeConfirm(false);
    setError('');

    try {
      const res = await submissionService.gradeSubmission({
        submission,
        teacherId: user.uid,
        teacherName: user.name || (user as any).displayName || 'Faculty',
        marks: Number(marks),
        maxMarks,
        feedback: feedback.trim(),
        status: 'checked',
      });

      if (!res.success) {
        setError(res.error || 'Failed to submit grade.');
      } else {
        const nowIso = new Date().toISOString();
        onGraded({
          ...submission,
          marks: Number(marks),
          teacherFeedback: feedback.trim(),
          feedback: feedback.trim(),
          status: 'checked',
          checkedAt: nowIso,
          gradedAt: nowIso,
          gradedBy: user.uid,
          updatedAt: nowIso,
        });
        onClose();
      }
    } catch {
      setError('Something went wrong while submitting grade.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmed Return for Correction Execution
  const handleExecuteReturn = async () => {
    if (!user) return;
    setIsLoading(true);
    setShowReturnConfirm(false);
    setError('');

    try {
      const res = await submissionService.gradeSubmission({
        submission,
        teacherId: user.uid,
        teacherName: user.name || (user as any).displayName || 'Faculty',
        marks: 0,
        maxMarks,
        feedback: feedback.trim(),
        status: 'returned',
      });

      if (!res.success) {
        setError(res.error || 'Failed to return assignment.');
      } else {
        const nowIso = new Date().toISOString();
        onGraded({
          ...submission,
          marks: null,
          teacherFeedback: feedback.trim(),
          feedback: feedback.trim(),
          status: 'returned',
          returnedAt: nowIso,
          returnedBy: user.uid,
          updatedAt: nowIso,
        });
        onClose();
      }
    } catch {
      setError('Something went wrong while returning assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showGradeConfirm && !showReturnConfirm}
        onClose={onClose}
        title="Evaluate Submission"
        subtitle={`Student: ${submission.studentName} (${submission.studentPIN})`}
        maxWidth="lg"
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Student submission info box (Section 15) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Assignment
                </span>
                <h4 className="text-sm font-bold text-slate-900">{submission.assignmentTitle}</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Submitted: {formatDateTime(submission.submittedAt)}
              </span>
            </div>

            {submission.comment && (
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700">Student Note: </span>
                {submission.comment}
              </div>
            )}

            {/* PROMINENT STUDENT VERIFICATION CODE BANNER (Sections 15 & 17) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase bg-blue-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    Security Verification
                  </span>
                  {regenerationNotice && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      {regenerationNotice}
                    </span>
                  )}
                </div>

                {/* Authorized Admin/Staff Code Regeneration */}
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateCode}
                    isLoading={isRegeneratingCode}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
                    className="text-xs text-slate-600 hover:text-blue-700 hover:bg-white/80"
                    title="Regenerate code for future student captures"
                  >
                    Regenerate Code
                  </Button>
                )}
              </div>

              {/* Prominent Student / PIN / Verification Code Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-blue-100/80 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Student:
                  </span>
                  <span className="text-sm font-bold text-slate-900 line-clamp-1">
                    {submission.studentName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    PIN:
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {submission.studentPIN}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Verification Code:
                  </span>
                  {currentVerificationCode ? (
                    <span className="text-base font-mono font-black text-blue-700 tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5 select-all">
                      {currentVerificationCode}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">
                      Not recorded (legacy)
                    </span>
                  )}
                </div>
              </div>

              {/* AI Handwritten Code Inspector Card */}
              {hasImages && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          AI Handwritten Code Inspector
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full">
                            Vision OCR
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Scans notebook handwriting to check if code <strong className="font-mono text-indigo-700">{currentVerificationCode}</strong> is written on paper.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleRunAiScan}
                      isLoading={isAiScanning}
                      leftIcon={<Scan className="w-3.5 h-3.5" />}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                    >
                      {isAiScanning ? (aiScanStatus || 'Scanning...') : 'Scan Notebook with AI'}
                    </Button>
                  </div>

                  {/* Scanning active indicator */}
                  {isAiScanning && (
                    <div className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 flex items-center gap-2 text-xs font-semibold text-indigo-900 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                      <span>{aiScanStatus || 'AI vision engine inspecting notebook pages...'}</span>
                    </div>
                  )}

                  {/* AI Scan Result */}
                  {aiResult && !isAiScanning && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2.5 ${
                        aiResult.codeFound
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50/90 border-amber-300 text-amber-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {aiResult.codeFound ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-bold block text-sm">
                              {aiResult.codeFound
                                ? `Verification Code Confirmed on Page ${aiResult.matchedPage}`
                                : 'Code Not Confirmed by AI'}
                            </span>
                            <p className="text-xs mt-0.5 opacity-90">
                              {aiResult.codeFound
                                ? `Code "${currentVerificationCode}" was successfully recognized in notebook handwriting with ${aiResult.confidence}% confidence${
                                    aiResult.isFuzzyMatch ? ' (fuzzy matched)' : ''
                                  }.`
                                : `Code "${currentVerificationCode}" was not distinctly recognized in handwriting across ${aiResult.scannedPagesCount} page(s). Please inspect the notebook below to verify manually.`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            aiResult.codeFound
                              ? 'bg-emerald-200/90 text-emerald-950 border border-emerald-300'
                              : 'bg-amber-200/90 text-amber-950 border border-amber-300'
                          }`}
                        >
                          {aiResult.codeFound ? `${aiResult.confidence}% Match` : 'Visual Check'}
                        </span>
                      </div>

                      {aiResult.detectedSnippet && (
                        <div className="mt-1 pt-1.5 border-t border-emerald-200/70 font-mono text-[11px] text-emerald-800 bg-white/80 p-2 rounded-lg">
                          <span className="font-bold text-slate-600 not-font-mono">Recognized Context: </span>
                          "{aiResult.detectedSnippet}"
                        </div>
                      )}

                      {/* View full OCR text */}
                      {aiResult.allPagesText && aiResult.allPagesText.length > 0 && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAiText(!showAiText)}
                            className="text-[11px] font-semibold underline text-slate-700 hover:text-slate-900 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{showAiText ? 'Hide' : 'View'} Recognized OCR Text</span>
                          </button>

                          {showAiText && (
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-800">
                              {aiResult.allPagesText.map((p) => (
                                <div key={p.page} className="border-b border-slate-100 pb-1.5 last:border-b-0">
                                  <div className="font-bold text-indigo-700 text-[10px] uppercase">
                                    Page {p.page} (Quality: {p.confidence}%):
                                  </div>
                                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    {p.text.trim() || '[No clear text recognized on this page]'}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Instruction for teacher manual visual verification (Section 17) */}
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-100/70 p-2.5 rounded-lg border border-blue-200/60">
                <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>
                  Verify the code visible on the notebook before grading. Compare this code with the code written on the submitted notebook.
                </span>
              </div>

              {/* Manual Verification Checkbox Control */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasVerifiedCodeVisually}
                    onChange={(e) => setHasVerifiedCodeVisually(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>I have visually compared and verified the notebook verification code</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 pl-5">
                  Manual visual comparison only — does not automatically guarantee authenticity.
                </p>
              </div>
            </div>

            {/* SUBMISSION VIEWER: Reusable Notebook Image Viewer (Section 16) */}
            {/* Provides multi-page navigation (ChevronLeft, ChevronRight) and high-res inspection (Click to Zoom / Open Original, handleOpenImageFullscreen) */}
            {hasImages ? (
              <div className="pt-1">
                <NotebookImageViewer
                  imageUrls={submission.imageUrls!}
                  verificationCode={currentVerificationCode}
                  studentName={submission.studentName}
                  studentPIN={submission.studentPIN}
                  maxHeight="max-h-[55vh]"
                />
              </div>
            ) : isDriveLink ? (
              /* LEGACY GOOGLE DRIVE BUTTON FOR OLD SUBMISSIONS */
              <div className="pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  leftIcon={<ExternalLink className="w-4 h-4 text-blue-600" />}
                  onClick={handleOpenDrive}
                >
                  OPEN GOOGLE DRIVE
                </Button>
                <p className="text-[11px] text-slate-400 text-center mt-1">
                  Legacy submission: Opens student's assignment photos in Google Drive
                </p>
              </div>
            ) : (
              <div className="p-3 text-xs text-slate-500 text-center">
                No attached images found for this submission.
              </div>
            )}
          </div>

          {/* Marks Input (Section 18) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Marks Awarded (out of {maxMarks}) *
            </label>
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Input
                  type="number"
                  min={0}
                  max={maxMarks}
                  placeholder="0"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value === '' ? '' : Number(e.target.value))}
                  leftIcon={<Award className="w-4 h-4 text-blue-500" />}
                />
              </div>
              <span className="text-base font-bold text-slate-500">/ {maxMarks} Marks</span>
            </div>
          </div>

          {/* Teacher Feedback / Comments (Section 19) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Teacher Feedback / Correction Notes
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Good work. Improve the explanation in Question 3. Handwriting is neat."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action buttons (Sections 20 & 21) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenReturnConfirm}
              disabled={isLoading}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-600" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              Return for Correction
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleOpenGradeConfirm}
                disabled={isLoading}
              >
                Submit Grade
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Submitting Grade (Section 20) */}
      {showGradeConfirm && (
        <Modal
          isOpen={showGradeConfirm}
          onClose={() => setShowGradeConfirm(false)}
          title="Submit Grade Confirmation"
          subtitle="Confirm the marks and feedback before saving"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-sm">
              Submit this grade?
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{submission.studentName} ({submission.studentPIN})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{submission.assignmentTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Marks Awarded:</span>
                <span className="font-extrabold text-blue-700 text-sm">{marks} / {maxMarks} Marks</span>
              </div>
              <div className="py-1">
                <span className="font-semibold text-slate-500 block mb-0.5">Feedback:</span>
                <p className="font-medium text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">
                  {feedback || '(No feedback provided)'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGradeConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleExecuteGrade}
                isLoading={isLoading}
              >
                Submit Grade
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Returning for Correction (Section 21) */}
      {showReturnConfirm && (
        <Modal
          isOpen={showReturnConfirm}
          onClose={() => setShowReturnConfirm(false)}
          title="Return for Correction"
          subtitle="The student will be notified and can recapture and resubmit"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm">
              Return this assignment to the student for correction?
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{submission.studentName} ({submission.studentPIN})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{submission.assignmentTitle}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                What should the student correct? (Optional Instructions)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Explain what needs correction (e.g. Page 2 is blurry, please retake with clear lighting. Add explanation for question 4.)"
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReturnConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleExecuteReturn}
                isLoading={isLoading}
              >
                Return Assignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
