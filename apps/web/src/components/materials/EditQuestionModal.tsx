'use client';

import React, { useState } from 'react';
import { GeneratedQuestion } from '../../types';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface EditQuestionModalProps {
  question: GeneratedQuestion;
  onClose: () => void;
  onSaved: (updatedQuestion: GeneratedQuestion) => void;
}

export default function EditQuestionModal({ question, onClose, onSaved }: EditQuestionModalProps) {
  const [questionText, setQuestionText] = useState(question.question_text);
  const [questionType, setQuestionType] = useState(question.question_type);
  const [options, setOptions] = useState<string[]>(
    Array.isArray(question.options) ? question.options : []
  );
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [topicName, setTopicName] = useState(question.topic_name || '');
  const [difficulty, setDifficulty] = useState(question.difficulty || 'Medium');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    const nextLetter = String.fromCharCode(65 + options.length);
    setOptions([...options, `${nextLetter}. Option`]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!questionText.trim()) {
      setError('Question text is required.');
      return;
    }

    if ((questionType === 'mcq' || questionType === 'multiple_correct') && options.length < 2) {
      setError('Please provide at least 2 options.');
      return;
    }

    if (!correctAnswer.trim()) {
      setError('Correct answer is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await api.patch(`/learning-materials/questions/${question.id}`, {
        questionText,
        questionType,
        options,
        correctAnswer,
        explanation,
        topicName,
        difficulty,
      });

      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.message || 'Failed to update question.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] text-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <h2 className="text-xl font-black uppercase text-white tracking-tight">Edit Question</h2>
              <p className="text-xs text-gray-400">Modify question content, choices, or explanation</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              Question Statement
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Options (for MCQ & Multiple Correct) */}
          {(questionType === 'mcq' || questionType === 'multiple_correct') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Answer Options
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-indigo-400 hover:underline"
                >
                  + Add Option
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-gray-500 hover:text-rose-400 px-2 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              Correct Answer
            </label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g. A, or True, or exact phrase"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-[#00FF66] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              Explanation & Rationale
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Topic & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e: any) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-white">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="font-black bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
