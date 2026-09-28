'use client';

import React, { useState, useEffect } from 'react';
import { GeneratedQuestion, LearningMaterial } from '../../types';
import { api } from '../../lib/api';
import Button from '../ui/Button';
import EditQuestionModal from './EditQuestionModal';

interface QuestionReviewModalProps {
  material: LearningMaterial;
  onClose: () => void;
  onQuizCreated?: () => void;
}

export default function QuestionReviewModal({ material, onClose, onQuizCreated }: QuestionReviewModalProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [showQuizConfig, setShowQuizConfig] = useState(false);
  const [quizTitle, setQuizTitle] = useState(`${material.title} — Quiz`);
  const [quizMarks, setQuizMarks] = useState(20);
  const [timeLimit, setTimeLimit] = useState(20);
  const [quizSuccessMessage, setQuizSuccessMessage] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/learning-materials/${material.id}/questions`);
      setQuestions(data || []);
      const approvedCount = (data || []).filter((q: any) => q.status === 'Approved').length;
      if (approvedCount > 0) {
        setQuizMarks(approvedCount * 2);
        setTimeLimit(Math.max(approvedCount * 2, 10));
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [material.id]);

  const handleStatusChange = async (questionId: string, status: 'Draft' | 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/learning-materials/questions/${questionId}`, { status });
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status } : q))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleApproveAll = async () => {
    try {
      for (const q of questions) {
        if (q.status !== 'Approved') {
          await api.patch(`/learning-materials/questions/${q.id}`, { status: 'Approved' });
        }
      }
      setQuestions((prev) => prev.map((q) => ({ ...q, status: 'Approved' })));
    } catch (err) {
      console.error('Failed to approve all:', err);
    }
  };

  const handleRegenerateSingle = async (questionId: string) => {
    setRegeneratingId(questionId);
    try {
      const freshQuestion = await api.post(`/learning-materials/questions/${questionId}/regenerate`, {});
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? freshQuestion : q))
      );
    } catch (err) {
      console.error('Failed to regenerate single question:', err);
      alert('Could not regenerate this question. Please try again.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/learning-materials/questions/${questionId}`);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleCreateQuiz = async () => {
    const approved = questions.filter((q) => q.status === 'Approved');
    if (approved.length === 0) {
      alert('Please approve at least one question before creating a quiz assignment.');
      return;
    }

    setIsCreatingQuiz(true);
    try {
      const res = await api.post(`/learning-materials/${material.id}/create-quiz`, {
        title: quizTitle,
        marks: quizMarks,
        timeLimitMinutes: timeLimit,
        questionIds: approved.map((q) => q.id),
      });

      setQuizSuccessMessage(`Quiz assignment "${res.assignment.title}" created successfully with ${res.questionCount} questions!`);
      if (onQuizCreated) onQuizCreated();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Failed to create quiz:', err);
      alert(err?.message || 'Failed to create quiz assignment.');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Stats calculation
  const totalCount = questions.length;
  const approvedCount = questions.filter((q) => q.status === 'Approved').length;
  const rejectedCount = questions.filter((q) => q.status === 'Rejected').length;
  const draftCount = questions.filter((q) => q.status === 'Draft').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl border-4 border-black dark:border-white bg-[#0a0c14] text-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] relative my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">Question Review</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Source: <span className="text-indigo-400 font-bold">{material.title}</span> • Review, edit, and approve questions before publishing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAll}
              disabled={questions.length === 0}
              className="text-xs font-black uppercase bg-[#00FF66] text-black px-3 py-1.5 rounded-xl border border-black hover:bg-[#33ff85] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              ✓ Approve All
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
              ✕
            </button>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2 my-4">
          <span className="text-xs font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white">
            {totalCount} Generated
          </span>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            ✓ {approvedCount} Approved
          </span>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
            ⏳ {draftCount} Draft
          </span>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400">
            ✕ {rejectedCount} Rejected
          </span>
        </div>

        {quizSuccessMessage && (
          <div className="mb-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/20 p-4 text-center text-sm font-black text-emerald-300">
            🎉 {quizSuccessMessage}
          </div>
        )}

        {/* Questions Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-sm text-gray-400">
              No questions found. Click "Generate Questions" to create a fresh assessment set.
            </div>
          ) : (
            questions.map((q, index) => {
              const isApproved = q.status === 'Approved';
              const isRejected = q.status === 'Rejected';
              const isRegenerating = regeneratingId === q.id;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border-2 transition-all p-5 ${
                    isApproved
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isRejected
                      ? 'border-rose-500/30 bg-rose-500/5 opacity-70'
                      : 'border-white/10 bg-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-black text-indigo-300">
                        Q{index + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        [{q.question_type.replace('_', ' ')}]
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : q.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-black text-white leading-relaxed mb-3">
                    {q.question_text}
                  </p>

                  {/* Options */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className="rounded-xl border border-white/5 bg-black/30 px-3 py-1.5 text-xs text-gray-300"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer & Explanation */}
                  <div className="rounded-xl bg-white/5 p-3 text-xs space-y-1 mb-3">
                    <div>
                      <span className="font-bold text-[#00FF66]">Correct Answer: </span>
                      <span className="text-white font-mono">{q.correct_answer}</span>
                    </div>
                    {q.explanation && (
                      <div className="text-gray-400 text-[11px] leading-relaxed">
                        <span className="font-bold text-gray-300">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                    <div className="text-[10px] text-indigo-400 font-bold">
                      Topic: {q.topic_name || 'General'}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(q.id, 'Approved')}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                          isApproved
                            ? 'bg-emerald-500 text-black'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(q.id, 'Rejected')}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                          isRejected
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        ✕ Reject
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs font-bold text-gray-400 hover:text-white px-2 py-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleRegenerateSingle(q.id)}
                        disabled={isRegenerating}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 flex items-center gap-1"
                      >
                        {isRegenerating ? (
                          <span className="h-3 w-3 animate-spin rounded-full border border-indigo-400 border-t-transparent"></span>
                        ) : (
                          '🔄'
                        )}
                        Regenerate
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-xs font-bold text-gray-500 hover:text-rose-400 px-2 py-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quiz Config Section */}
        {showQuizConfig && (
          <div className="mt-4 p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-950/40 space-y-3 animate-fade-in">
            <h4 className="text-xs font-black uppercase text-indigo-300 tracking-wider">
              Quiz Assignment Settings
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Assignment Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Total Marks</label>
                <input
                  type="number"
                  value={quizMarks}
                  onChange={(e) => setQuizMarks(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400">Time Limit (Mins)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 5)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            Close
          </Button>

          <div className="flex items-center gap-3">
            {!showQuizConfig ? (
              <Button
                variant="primary"
                onClick={() => setShowQuizConfig(true)}
                disabled={approvedCount === 0}
                className="font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/25 disabled:opacity-50"
              >
                🚀 Create Quiz Assignment ({approvedCount} Approved)
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreateQuiz}
                disabled={isCreatingQuiz || approvedCount === 0}
                className="font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/25"
              >
                {isCreatingQuiz ? 'Creating Quiz...' : 'Confirm & Publish to Assignments'}
              </Button>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingQuestion && (
          <EditQuestionModal
            question={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSaved={(updated) => {
              setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
              setEditingQuestion(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
