'use client';

import React, { useState } from 'react';
import { LearningMaterial } from '../../types';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface GenerateQuestionsModalProps {
  material: LearningMaterial;
  onClose: () => void;
  onGenerated: (materialId: string) => void;
}

export default function GenerateQuestionsModal({ material, onClose, onGenerated }: GenerateQuestionsModalProps) {
  const allTopicNames = (material.topics || []).map((t) => t.name);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(allTopicNames);
  const [questionType, setQuestionType] = useState<string>('mixed');
  const [difficulty, setDifficulty] = useState<string>('Mixed');
  const [count, setCount] = useState<number>(10);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSelectAllTopics = () => {
    if (selectedTopics.length === allTopicNames.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(allTopicNames);
    }
  };

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic for question generation.');
      return;
    }
    if (count < 1 || count > 25) {
      setError('Please choose between 1 and 25 questions.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await api.post(`/learning-materials/${material.id}/generate-questions`, {
        topics: selectedTopics,
        questionType,
        difficulty,
        count,
        includeExplanations,
      });

      onGenerated(material.id);
      onClose();
    } catch (err: any) {
      console.error('Question generation failed:', err);
      setError(err?.message || 'Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] text-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">Generate Questions</h2>
              <p className="text-xs font-bold text-gray-400">Configure parameters for assessment creation</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isGenerating} className="text-gray-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Material Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              Source Material
            </label>
            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-indigo-300 flex items-center gap-2">
              <span>📄</span>
              <span className="truncate">{material.title} ({material.file_name})</span>
            </div>
          </div>

          {/* Topics selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                Target Topics ({selectedTopics.length}/{allTopicNames.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllTopics}
                className="text-xs font-bold text-indigo-400 hover:underline"
              >
                {selectedTopics.length === allTopicNames.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 rounded-xl border border-white/10 bg-black/20">
              {allTopicNames.length > 0 ? (
                allTopicNames.map((topic) => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <label
                      key={topic}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs font-bold ${
                        isChecked
                          ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                          : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTopic(topic)}
                        className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="truncate">{topic}</span>
                    </label>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-2 text-xs text-gray-400">
                  Document content will be evaluated as a whole.
                </div>
              )}
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'mixed', label: 'Mixed' },
                { id: 'mcq', label: 'MCQ' },
                { id: 'multiple_correct', label: 'Multi-Correct' },
                { id: 'true_false', label: 'True / False' },
                { id: 'short_answer', label: 'Short Answer' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQuestionType(item.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                    questionType === item.id
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'border-white/10 bg-black/30 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Mixed', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center ${
                      difficulty === diff
                        ? 'border-purple-500 bg-purple-600 text-white shadow-md shadow-purple-500/30'
                        : 'border-white/10 bg-black/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm font-black text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Include Explanations */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/20 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExplanations}
              onChange={(e) => setIncludeExplanations(e.target.checked)}
              className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <div>
              <div className="text-xs font-black text-white uppercase">Include Explanations</div>
              <div className="text-[11px] text-gray-400">Generate detailed answers and rationale grounded in document</div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isGenerating} className="text-gray-400 hover:text-white">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || selectedTopics.length === 0}
            className="font-black bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Generating Questions...
              </span>
            ) : (
              '⚡ Generate Questions'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
