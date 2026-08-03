import React, { useState } from 'react';
import { api } from '../../lib/api';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import ReactMarkdown from 'react-markdown';

interface CreateAssignmentModalProps {
  classroomId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAssignmentModal({ classroomId, onClose, onCreated }: CreateAssignmentModalProps) {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'java',
    difficulty: 'Medium',
    marks: 10,
    timeLimitMinutes: 60,
    dueDate: '',
    conceptsCovered: [] as string[],
    visibleTestCases: [] as { input: string; expectedOutput: string }[],
    hiddenTestCases: [] as { input: string; expectedOutput: string }[],
    hints: [] as { level: number; text: string }[]
  });

  const [aiTopic, setAiTopic] = useState('');

  const generateWithAI = async () => {
    if (!aiTopic) {
      addToast('Please enter a topic to generate an assignment.', 'error');
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await api.post('/assignments/generate', {
        topic: aiTopic,
        marks: formData.marks,
        difficulty: formData.difficulty,
        language: formData.language
      });
      
      setFormData(prev => ({
        ...prev,
        title: result.title || prev.title,
        description: result.description || prev.description,
        conceptsCovered: result.conceptsCovered || prev.conceptsCovered,
        visibleTestCases: result.visibleTestCases || prev.visibleTestCases,
        hiddenTestCases: result.hiddenTestCases || prev.hiddenTestCases,
        hints: result.hints || prev.hints
      }));
      
      addToast('Assignment and realistic test cases generated!', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to generate assignment with AI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const addVisibleTestCase = () => {
    setFormData(prev => ({
      ...prev,
      visibleTestCases: [...prev.visibleTestCases, { input: '', expectedOutput: '' }]
    }));
  };

  const removeVisibleTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      visibleTestCases: prev.visibleTestCases.filter((_, i) => i !== index)
    }));
  };

  const updateVisibleTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    setFormData(prev => {
      const updated = [...prev.visibleTestCases];
      updated[index][field] = value;
      return { ...prev, visibleTestCases: updated };
    });
  };

  const addHiddenTestCase = () => {
    setFormData(prev => ({
      ...prev,
      hiddenTestCases: [...prev.hiddenTestCases, { input: '', expectedOutput: '' }]
    }));
  };

  const removeHiddenTestCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hiddenTestCases: prev.hiddenTestCases.filter((_, i) => i !== index)
    }));
  };

  const updateHiddenTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    setFormData(prev => {
      const updated = [...prev.hiddenTestCases];
      updated[index][field] = value;
      return { ...prev, hiddenTestCases: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await api.post(`/assignments/classroom/${classroomId}`, formData);
      addToast('Assignment created successfully!', 'success');
      onCreated();
    } catch (error) {
      console.error(error);
      addToast('Failed to create assignment', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 py-6">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#12121a] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Create Assignment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Auto-generator Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 p-5 shadow-lg">
          <h3 className="text-sm font-extrabold text-purple-300 mb-3 flex items-center gap-2">
            ✨ Auto-Generate Full Question & Real Test Cases
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="E.g. Fibonacci Series in Java, String Palindrome, Factorial..."
              className="flex-1 rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none font-medium"
            />
            <Button onClick={generateWithAI} disabled={isGenerating} variant="primary" className="bg-purple-600 hover:bg-purple-700 font-bold whitespace-nowrap">
              {isGenerating ? 'Generating...' : '⚡ Generate Question'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Fibonacci Series Generator"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Language</label>
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none capitalize"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Difficulty</label>
                <select 
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Marks</label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value)})}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-300 uppercase">Problem Statement (Markdown)</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={8}
                placeholder="Write your problem statement here..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none font-mono text-xs leading-relaxed"
                required
              />
              <div className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-200 overflow-y-auto max-h-[220px] prose prose-invert prose-xs">
                {formData.description ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic mt-4">Preview will appear here...</p>
                )}
              </div>
            </div>
          </div>

          {/* Test Cases Editor Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">🧪 Visible Test Cases (Students Can View)</h4>
              <button
                type="button"
                onClick={addVisibleTestCase}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
              >
                + Add Test Case
              </button>
            </div>

            {formData.visibleTestCases.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No visible test cases added yet. Click Auto-Generate or + Add Test Case.</p>
            ) : (
              <div className="space-y-2">
                {formData.visibleTestCases.map((tc, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400">INPUT (STDIN)</div>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => updateVisibleTestCase(idx, 'input', e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400">EXPECTED OUTPUT (STDOUT)</div>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) => updateVisibleTestCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g. 0 1 1 2 3"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVisibleTestCase(idx)}
                      className="text-red-400 hover:text-red-300 p-2 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden Test Cases Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">🔒 Hidden Test Cases (Edge Cases)</h4>
              <button
                type="button"
                onClick={addHiddenTestCase}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20"
              >
                + Add Hidden Case
              </button>
            </div>

            {formData.hiddenTestCases.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No hidden test cases added yet.</p>
            ) : (
              <div className="space-y-2">
                {formData.hiddenTestCases.map((tc, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400">HIDDEN INPUT</div>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => updateHiddenTestCase(idx, 'input', e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400">EXPECTED OUTPUT</div>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) => updateHiddenTestCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g. 0 1 1 2 3 5 8 13 21 34"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHiddenTestCase(idx)}
                      className="text-red-400 hover:text-red-300 p-2 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
            <Button onClick={onClose} variant="secondary" type="button">Cancel</Button>
            <Button type="submit" disabled={isSaving} variant="primary">
              {isSaving ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
