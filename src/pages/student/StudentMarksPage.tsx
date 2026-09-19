import React, { useState, useEffect } from 'react';
import { Award, MessageSquare, Calendar, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Submission } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { Card } from '../../components/common/Card';
import { SemesterBadge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { PerformanceSummary } from '../../components/student/PerformanceSummary';
import { formatDate } from '../../utils/dateUtils';

export const StudentMarksPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'marks' | 'performance'>('marks');

  useEffect(() => {
    if (!user?.uid) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [asgs, subs] = await Promise.all([
          assignmentService.getStudentAssignments(user.uid),
          submissionService.getStudentSubmissions(user.uid),
        ]);
        setAssignments(asgs);
        setSubmissions(subs);
      } catch (err) {
        console.error('Error fetching student marks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid]);

  // Checked submissions
  const checkedList = submissions.filter(
    (s) => s.status === 'checked' && s.marks !== null
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marks & Academic Performance</h1>
          <p className="text-xs text-slate-500">
            View grades, maximum marks, and teacher evaluation comments
          </p>
        </div>

        {/* Tab switch between itemized Marks and Overall Performance */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveSubTab('marks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'marks'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Marks ({checkedList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'performance'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Performance Overview
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading marks and evaluations..." />
      ) : activeSubTab === 'performance' ? (
        <PerformanceSummary assignments={assignments} submissions={submissions} />
      ) : (
        /* Itemized marks view */
        <div className="space-y-4">
          {checkedList.length === 0 ? (
            <EmptyState
              icon={<Award className="w-8 h-8 text-amber-500" />}
              title="No marks available yet"
              description="When your teacher checks your physical notebook submissions on Google Drive, your evaluated marks and feedback will be listed here."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkedList.map((sub) => {
                const asg = assignments.find((a) => a.id === sub.assignmentId);
                const maxMarks = asg?.maxMarks || 10;
                return (
                  <Card key={sub.id} className="p-5 space-y-3.5 border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20">
                    <div className="flex items-start justify-between">
                      <div>
                        {asg && (
                          <div className="flex items-center gap-2 mb-1">
                            <SemesterBadge semester={asg.semester} />
                            <span className="text-xs font-bold text-slate-700">{asg.subject}</span>
                          </div>
                        )}
                        <h3 className="text-base font-extrabold text-slate-900">
                          {sub.assignmentTitle}
                        </h3>
                      </div>

                      {/* Marks Awarded Pill */}
                      <div className="flex items-center gap-1.5 bg-emerald-600 text-white font-extrabold text-sm px-3 py-1.5 rounded-xl shadow-xs">
                        <Award className="w-4 h-4" />
                        <span>{sub.marks} / {maxMarks}</span>
                      </div>
                    </div>

                    {/* Teacher feedback */}
                    <div className="p-3 rounded-xl bg-white border border-emerald-100 text-xs text-slate-700 space-y-1 shadow-xs">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Teacher Feedback:</span>
                      </div>
                      <p className="italic leading-relaxed">
                        {sub.teacherFeedback ? `"${sub.teacherFeedback}"` : 'Verified & Checked.'}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span>Checked on: {formatDate(sub.checkedAt || sub.submittedAt)}</span>
                      <a
                        href={sub.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Drive File</span>
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
