import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  GraduationCap, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { Assignment, Submission, Semester } from '../../types';
import { formatDate } from '../../utils/dateUtils';

export const AdminOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAsgs, allSubs] = await Promise.all([
        assignmentService.getAllAssignments(),
        submissionService.getAllSubmissions(),
      ]);
      setAssignments(allAsgs);
      setSubmissions(allSubs);
    } catch (err) {
      console.error('Error loading overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading System Overview..." />;
  }

  const filteredAssignments = assignments.filter((a) => {
    const matchesSem = selectedSemester === 'all' || a.semester === selectedSemester;
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSem && matchesSearch;
  });

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = 
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentPIN.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Academic Overview</h1>
          <p className="text-xs text-slate-500">
            Monitor all posted notebook assignments and student Google Drive submissions.
          </p>
        </div>

        {/* Overview Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'assignments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assignments ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submissions ({submissions.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {activeTab === 'assignments' && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedSemester === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Semesters
            </button>
            {(['1st', '3rd', '4th', '5th'] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  selectedSemester === sem ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {sem} Sem
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Assignments View */}
      {activeTab === 'assignments' && (
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Assignment Title</th>
                  <th className="py-3.5 px-4">Subject & Semester</th>
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-center">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No assignments found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((asg) => {
                    const asgSubs = submissions.filter((s) => s.assignmentId === asg.id);
                    const graded = asgSubs.filter((s) => s.status === 'checked').length;
                    return (
                      <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{asg.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">{asg.description}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="blue" size="sm">{asg.semester} Sem</Badge>
                            <span className="font-medium text-slate-700">{asg.subject}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {asg.teacherName || 'Faculty'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {formatDate(asg.dueDate)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {asgSubs.length} ({graded} graded)
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Submissions View */}
      {activeTab === 'submissions' && (
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Assignment</th>
                  <th className="py-3.5 px-4">Google Drive Link</th>
                  <th className="py-3.5 px-4">Status & Marks</th>
                  <th className="py-3.5 px-4">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{sub.studentName}</span>
                        <span className="text-[10px] font-mono text-indigo-700 font-semibold">{sub.studentPIN}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {sub.assignmentTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={sub.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-[11px]"
                        >
                          <span>Open Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        {sub.status === 'checked' ? (
                          <div className="space-y-0.5">
                            <Badge variant="success" size="sm">Graded</Badge>
                            <span className="block font-black text-emerald-700 text-xs">
                              {sub.marks} / 10
                            </span>
                          </div>
                        ) : (
                          <Badge variant="warning" size="sm">Pending Review</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate text-[11px]">
                        {sub.teacherFeedback || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
