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
    visibleTestCases: [] as any[],
    hiddenTestCases: [] as any[],
    hints: [] as any[]
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
      
      addToast('Assignment generated successfully!', 'success');
    } catch (error) {
      console.error(error);
      addToast('Failed to generate assignment with AI', 'error');
    } finally {
      setIsGenerating(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 py-8">
      <div className="w-full max-w-4xl max-h-full overflow-y-auto rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Assignment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-8 rounded-xl bg-purple-900/20 border border-purple-500/30 p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate with AI
          </h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="E.g., Create a Java OOP question about Bank Accounts..."
              className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            />
            <Button onClick={generateWithAI} disabled={isGenerating} variant="primary" className="bg-purple-600 hover:bg-purple-700">
              {isGenerating ? 'Generating...' : 'Auto-Generate'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                <select 
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Marks</label>
                <input
                  type="number"
                  value={formData.marks}
                  onChange={(e) => setFormData({...formData, marks: parseInt(e.target.value)})}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Description / Problem Statement (Markdown)</label>
              <label className="cursor-pointer text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Insert Image
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result;
                        if (base64) {
                          setFormData(prev => ({
                            ...prev,
                            description: prev.description + `\n\n![${file.name}](${base64})\n`
                          }));
                          addToast('Image inserted into description!', 'success');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={12}
                placeholder="Write your problem statement here..."
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
                required
              />
              <div className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-gray-200 overflow-y-auto max-h-[280px] prose prose-invert prose-sm">
                {formData.description ? (
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic mt-4">Preview will appear here...</p>
                )}
              </div>
            </div>
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
