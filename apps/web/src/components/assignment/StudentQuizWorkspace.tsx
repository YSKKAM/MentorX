'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface StudentQuizWorkspaceProps {
  assignment: any;
  classroomId: string;
}

export default function StudentQuizWorkspace({ assignment, classroomId }: StudentQuizWorkspaceProps) {
  const questions = assignment.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    assignment.time_limit_minutes ? assignment.time_limit_minutes * 60 : null
  );

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || submissionResult) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submissionResult]);

  const handleSelectOption = (questionId: string, optionVal: string, isMulti: boolean = false) => {
    if (submissionResult) return; // Read-only after submission

    if (!isMulti) {
      setAnswers((prev) => ({ ...prev, [questionId]: optionVal }));
    } else {
      const currentVal = answers[questionId] || '';
      const selected = currentVal ? currentVal.split(', ').map(s => s.trim()) : [];
      let next: string[];
      if (selected.includes(optionVal)) {
        next = selected.filter(s => s !== optionVal);
      } else {
        next = [...selected, optionVal].sort();
      }
      setAnswers((prev) => ({ ...prev, [questionId]: next.join(', ') }));
    }
  };

  const handleSubmit = async () => {
    if (submissionResult || isSubmitting) return;

    if (!window.confirm('Are you ready to submit your quiz? You cannot edit answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/assignments/${assignment.id}/submit`, {
        answers,
      });
      setSubmissionResult(res);
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      alert(err?.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <span className="text-4xl mb-3">📝</span>
        <h3 className="text-xl font-black text-white">No questions available</h3>
        <p className="text-sm text-gray-400 mt-1">This quiz has not been populated with questions yet.</p>
        <Link href={`/classroom/${classroomId}`} className="mt-4">
          <Button variant="secondary">Back to Classroom</Button>
        </Link>
      </div>
    );
  }

  const curQ = questions[currentIdx];
  const isMulti = curQ?.question_type === 'multiple_correct';
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in p-4 sm:p-6 text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <Link
            href={`/classroom/${classroomId}`}
            className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 mb-2"
          >
            ← Back to Classroom
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">{assignment.title}</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">{assignment.description}</p>
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && !submissionResult && (
            <div className={`px-4 py-2 rounded-2xl border-2 font-mono font-black text-base flex items-center gap-2 ${
              timeLeft < 180 ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse' : 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
            }`}>
              <span>⏱</span>
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="text-[10px] font-black uppercase text-gray-400">Total Marks</div>
            <div className="text-sm font-black text-[#00FF66]">{assignment.marks} pts</div>
          </div>
        </div>
      </div>

      {/* Results Card if Submitted */}
      {submissionResult && (
        <div className="rounded-3xl border-4 border-black dark:border-white bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
            <div>
              <span className="text-3xl">🎉</span>
              <h2 className="text-2xl font-black uppercase text-white mt-1">Quiz Submitted!</h2>
              <p className="text-xs text-emerald-400 font-bold">Your score has been recorded into the classroom gradebook.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-300 uppercase">Score Obtained</div>
                <div className="text-3xl font-black text-[#00FF66]">
                  {submissionResult.score} / {assignment.marks}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-300 uppercase">Correct Answers</div>
                <div className="text-2xl font-black text-white">
                  {submissionResult.correctCount} / {submissionResult.totalQuestions}
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-black uppercase text-gray-300 mb-4 tracking-wider">Answer Review & Rationale</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {(submissionResult.results || []).map((r: any, rIdx: number) => (
              <div
                key={rIdx}
                className={`p-4 rounded-2xl border-2 ${
                  r.isCorrect
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-black mb-1">
                  <span>Question {rIdx + 1}</span>
                  <span className={r.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                    {r.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                </div>
                <p className="text-xs font-bold text-white mb-2">{r.questionText}</p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-gray-400">Your Answer: </span>
                    <span className="font-mono text-white">{r.studentAnswer || '(unanswered)'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Correct Answer: </span>
                    <span className="font-mono text-[#00FF66]">{r.correctAnswer}</span>
                  </div>
                  {r.explanation && (
                    <div className="text-[11px] text-gray-300 mt-1 bg-black/30 p-2 rounded-xl">
                      <span className="font-bold text-indigo-300">Explanation: </span>
                      {r.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Link href={`/classroom/${classroomId}`}>
              <Button variant="primary" className="font-black bg-indigo-600 hover:bg-indigo-700">
                Return to Classroom Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Main Question Card */}
      {!submissionResult && curQ && (
        <div className="rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          {/* Question Nav Pills */}
          <div className="flex items-center gap-1.5 flex-wrap mb-6 pb-4 border-b border-white/10">
            {questions.map((q: any, i: number) => {
              const isAnswered = Boolean(answers[q.id]?.trim());
              const isCurrent = currentIdx === i;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-8 w-8 rounded-xl font-black text-xs transition-all border ${
                    isCurrent
                      ? 'border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                      : isAnswered
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-black/40 text-gray-400 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Question Statement */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-purple-400 font-bold">
                {curQ.question_type.replace('_', ' ')}
              </span>
              {curQ.topic_name && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400 font-bold">{curQ.topic_name}</span>
                </>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed">
              {curQ.question_text}
            </h2>
          </div>

          {/* Options List */}
          <div className="space-y-3 mb-8">
            {curQ.question_type === 'short_answer' ? (
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                  Type your short answer below:
                </label>
                <input
                  type="text"
                  value={answers[curQ.id] || ''}
                  onChange={(e) => handleSelectOption(curQ.id, e.target.value)}
                  placeholder="Enter response..."
                  className="w-full rounded-2xl border-2 border-white/20 bg-black/40 p-4 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : Array.isArray(curQ.options) && curQ.options.length > 0 ? (
              curQ.options.map((opt: string, optIdx: number) => {
                const optLetter = opt.charAt(0);
                const currentAnswer = answers[curQ.id] || '';
                const isSelected = isMulti
                  ? currentAnswer.split(', ').includes(optLetter) || currentAnswer.split(', ').includes(opt)
                  : currentAnswer === optLetter || currentAnswer === opt;

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(curQ.id, optLetter, isMulti)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md'
                        : 'border-white/10 bg-black/30 text-gray-300 hover:border-white/20 hover:bg-black/50'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600 text-white'
                          : 'border-white/30 text-gray-400'
                      }`}
                    >
                      {isSelected ? '✓' : optLetter}
                    </div>
                    <span className="text-sm font-bold flex-1">{opt}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-gray-400">No options provided for this question.</div>
            )}
          </div>

          {/* Nav & Submit */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentIdx((prev) => Math.max(prev - 1, 0))}
              disabled={currentIdx === 0}
              className="text-xs font-bold"
            >
              ← Previous
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-bold hidden sm:inline">
                {answeredCount} of {questions.length} answered
              </span>

              {currentIdx < questions.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentIdx((prev) => Math.min(prev + 1, questions.length - 1))}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-md shadow-emerald-500/25 px-5"
                >
                  {isSubmitting ? 'Submitting...' : '🚀 Submit Quiz'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
