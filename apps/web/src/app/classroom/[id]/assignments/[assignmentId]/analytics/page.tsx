'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../../lib/api';
import Button from '../../../../../../components/ui/Button';
import PlagiarismReportModal, { PlagiarismPairResult } from '../../../../../../components/assignment/PlagiarismReportModal';

export default function AssignmentAnalytics() {
  const params = useParams();
  const router = useRouter();
  
  const [assignment, setAssignment] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const [isPlagiarismModalOpen, setIsPlagiarismModalOpen] = useState(false);
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismPairResult[]>([]);
  const [isPlagiarismLoading, setIsPlagiarismLoading] = useState(false);

  const handleRunPlagiarismCheck = async () => {
    setIsPlagiarismModalOpen(true);
    setIsPlagiarismLoading(true);
    try {
      const id = params.assignmentId as string;
      const res = await api.post(`/plagiarism/assignment/${id}`, {});
      setPlagiarismResults(res.results || []);
    } catch (err) {
      console.error('Failed to run plagiarism check:', err);
    } finally {
      setIsPlagiarismLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = params.assignmentId as string;
        const [assignData, analyticsData] = await Promise.all([
          api.get(`/assignments/${id}`),
          api.get(`/assignments/${id}/analytics`)
        ]);
        
        setAssignment(assignData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.assignmentId) fetchData();
  }, [params.assignmentId]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#0a0a0f]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div></div>;
  }

  if (!assignment || !analytics) {
    return <div className="p-8 text-white">Error loading analytics.</div>;
  }

  const submissions = analytics.submissions || [];
  const totalSubmissions = submissions.length;
  const passedSubmissions = submissions.filter((s: any) => s.status === 'Passed').length;
  const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;
  
  // Aggregate common gaps
  const gapCounts: Record<string, number> = {};
  (analytics.recommendations || []).forEach((rec: any) => {
    if (rec.concept_gap && rec.concept_gap !== 'None') {
      gapCounts[rec.concept_gap] = (gapCounts[rec.concept_gap] || 0) + 1;
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
        <button onClick={() => router.back()} className="group mb-6 flex items-center text-sm font-medium text-gray-400 hover:text-white">
          <svg className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Classroom
        </button>

        <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/80 p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{assignment.title} - Analytics</h1>
            <p className="text-gray-400">Deep dive into student performance and AI-identified learning gaps.</p>
          </div>
          <Button variant="primary" onClick={handleRunPlagiarismCheck} className="bg-rose-600 hover:bg-rose-700 font-extrabold shrink-0">
            🛡️ Run Plagiarism Check
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 flex flex-col justify-center items-center">
            <div className="text-4xl font-bold text-white mb-2">{totalSubmissions}</div>
            <div className="text-gray-400 uppercase tracking-wide text-sm font-semibold">Total Submissions</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 flex flex-col justify-center items-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">{passRate}%</div>
            <div className="text-gray-400 uppercase tracking-wide text-sm font-semibold">Pass Rate</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6 flex flex-col justify-center items-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{assignment.marks}</div>
            <div className="text-gray-400 uppercase tracking-wide text-sm font-semibold">Total Marks</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Most Common Learning Gaps (AI Identified)</h3>
            {Object.keys(gapCounts).length === 0 ? (
              <p className="text-gray-400">No major concept gaps identified yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).map(([gap, count]) => (
                  <div key={gap} className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-white font-medium">{gap}</span>
                    <span className="text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-sm">{count} Students</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6">
            <h3 className="text-xl font-bold text-white mb-4">AI Recommendations for Teacher</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {analytics.recommendations && analytics.recommendations.length > 0 ? (
                analytics.recommendations.map((rec: any) => (
                  <div key={rec.id} className="p-4 rounded-xl border border-blue-500/20 bg-blue-900/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm text-blue-300 font-semibold">{rec.student_name}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{rec.recommendation_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">Waiting for AI to generate recommendations based on submissions...</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12121a]/80 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Student Submissions Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-xs uppercase text-gray-300">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Exec Time</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4 rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white">{sub.student_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${sub.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-400' : sub.status === 'Needs Review' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{sub.score} / {assignment.marks}</td>
                    <td className="px-6 py-4">{sub.execution_time_ms} ms</td>
                    <td className="px-6 py-4">{new Date(sub.submitted_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedCode(sub.source_code)}
                        className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1 rounded transition-colors"
                      >
                        View Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {selectedCode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Student Submission</h2>
              <button onClick={() => setSelectedCode(null)} className="text-gray-400 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-white/5">
                {selectedCode}
              </pre>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <Button onClick={() => setSelectedCode(null)} variant="secondary">Close</Button>
            </div>
          </div>
        </div>
      )}

      <PlagiarismReportModal
        isOpen={isPlagiarismModalOpen}
        onClose={() => setIsPlagiarismModalOpen(false)}
        results={plagiarismResults}
        isLoading={isPlagiarismLoading}
      />
    </div>
  );
}
