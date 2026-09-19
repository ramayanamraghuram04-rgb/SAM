import React, { useState } from 'react';
import { Award, CheckCircle2, Clock, FileText, TrendingUp, Filter } from 'lucide-react';
import { Card } from '../common/Card';
import { Assignment, Submission } from '../../types';

interface PerformanceSummaryProps {
  assignments: Assignment[];
  submissions: Submission[];
}

export const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  assignments,
  submissions,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Extract distinct subjects
  const subjects = Array.from(new Set(assignments.map((a) => a.subject)));

  // Filter based on subject
  const filteredAssignments = selectedSubject === 'all'
    ? assignments
    : assignments.filter((a) => a.subject === selectedSubject);

  const filteredAssignmentIds = new Set(filteredAssignments.map((a) => a.id));
  const filteredSubmissions = submissions.filter((s) => filteredAssignmentIds.has(s.assignmentId));

  const totalAssignments = filteredAssignments.length;
  const submittedCount = filteredSubmissions.length;
  const checkedSubmissions = filteredSubmissions.filter((s) => s.status === 'checked' && s.marks !== null);
  const checkedCount = checkedSubmissions.length;
  const pendingCount = Math.max(0, totalAssignments - submittedCount);

  // Total Marks & Average
  const totalMarksObtained = checkedSubmissions.reduce((acc, curr) => acc + (curr.marks || 0), 0);
  const totalMaxMarks = checkedSubmissions.reduce((acc, curr) => {
    const asg = filteredAssignments.find((a) => a.id === curr.assignmentId);
    return acc + (asg?.maxMarks || 10);
  }, 0);

  const averagePercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Subject Filter Bar */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/80">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Filter by Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Subjects ({assignments.length} assignments)</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAssignments}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Assigned Tasks</p>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Submitted</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{submittedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Uploaded on Drive</p>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Checked</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{checkedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Graded with Marks</p>
        </Card>

        <Card padding="sm" className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">To Complete</p>
        </Card>
      </div>

      {/* Marks & Average Card */}
      <Card className="bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Academic Score Summary</h4>
              <p className="text-xs text-slate-500">Evaluated assignments performance</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-blue-600">{averagePercentage}%</div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Overall Marks: {totalMarksObtained} / {totalMaxMarks}</span>
            <span>{averagePercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, averagePercentage))}%` }}
            />
          </div>
        </div>

        {checkedCount === 0 && (
          <p className="text-xs text-slate-400 italic text-center pt-2">
            No assignments evaluated yet. Marks will appear as your teacher reviews your notebook submissions.
          </p>
        )}
      </Card>
    </div>
  );
};
