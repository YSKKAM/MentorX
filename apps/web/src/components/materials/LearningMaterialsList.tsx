'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LearningMaterial } from '../../types';
import { api } from '../../lib/api';
import Button from '../ui/Button';
import UploadMaterialModal from './UploadMaterialModal';
import ViewMaterialModal from './ViewMaterialModal';
import GenerateQuestionsModal from './GenerateQuestionsModal';
import QuestionReviewModal from './QuestionReviewModal';

interface LearningMaterialsListProps {
  classroomId: string;
  isTeacher: boolean;
}

export default function LearningMaterialsList({ classroomId, isTeacher }: LearningMaterialsListProps) {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);
  const [generatingForMaterial, setGeneratingForMaterial] = useState<LearningMaterial | null>(null);
  const [reviewingMaterial, setReviewingMaterial] = useState<LearningMaterial | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await api.get(`/learning-materials/classroom/${classroomId}`);
      setMaterials(data || []);
    } catch (err) {
      console.error('Failed to load learning materials:', err);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Auto-refresh if any material is actively processing
  useEffect(() => {
    const hasActiveProcessing = materials.some((m) =>
      ['Processing', 'Uploading', 'Extracting Content', 'Identifying Topics'].includes(m.processing_status)
    );

    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchMaterials();
    }, 3000);

    return () => clearInterval(interval);
  }, [materials, fetchMaterials]);

  const handleDelete = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this learning material and its generated questions?')) return;
    try {
      await api.delete(`/learning-materials/${materialId}`);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to delete material:', err);
      alert('Failed to delete material');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ Ready
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
            ✕ Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-400"></span>
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
            Learning Materials
          </h3>
          <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mt-0.5">
            Upload, organize and transform learning resources into assessments.
          </p>
        </div>

        {isTeacher && (
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="primary"
            className="font-black bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 px-5 py-2.5 rounded-xl border border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            + Upload Material
          </Button>
        )}
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 p-12 text-center bg-black/5 dark:bg-black/20">
          <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
            📚
          </div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">Your learning library is empty.</h4>
          <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Upload a PDF or DOCX to start creating learning content and assessments.
          </p>
          {isTeacher && (
            <div className="mt-5">
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="primary"
                className="font-black px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
              >
                + Upload Material
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => {
            const isReady = mat.processing_status === 'Ready';
            const isFailed = mat.processing_status === 'Failed';
            const hasQuestions = (mat.question_count || 0) > 0;

            return (
              <div
                key={mat.id}
                className="rounded-3xl border-2 border-slate-900/10 dark:border-white/10 bg-white dark:bg-black/40 p-6 hover:border-indigo-500/40 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon + Title + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {mat.file_name.endsWith('.pdf') ? '📄' : '📝'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-900 dark:text-white truncate" title={mat.title}>
                          {mat.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-gray-400 mt-0.5">
                          <span className="uppercase">{mat.file_name.split('.').pop()}</span>
                          <span>•</span>
                          <span>{formatFileSize(mat.file_size)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(mat.processing_status)}
                      {isTeacher && (
                        <button
                          onClick={() => handleDelete(mat.id)}
                          className="text-gray-400 hover:text-rose-400 p-1 transition-colors"
                          title="Delete Material"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Processing / Error Feedback */}
                  {isFailed && mat.error_message && (
                    <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-xs font-bold text-rose-400">
                      {mat.error_message}
                    </div>
                  )}

                  {!isReady && !isFailed && (
                    <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-300 flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border border-amber-400 border-t-transparent"></span>
                      <span>Processing content and identifying topics...</span>
                    </div>
                  )}

                  {/* Metrics Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                      🎯 {mat.topic_count || 0} Topics Identified
                    </span>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
                      ❓ {mat.question_count || 0} Questions Generated
                    </span>
                    {(mat.approved_question_count || 0) > 0 && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                        ✓ {mat.approved_question_count} Approved
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button
                    onClick={async () => {
                      try {
                        const detailed = await api.get(`/learning-materials/${mat.id}`);
                        setViewingMaterial(detailed);
                      } catch {
                        setViewingMaterial(mat);
                      }
                    }}
                    variant="secondary"
                    className="flex-1 text-xs font-black py-2 rounded-xl"
                  >
                    View Material
                  </Button>

                  {isTeacher && isReady && (
                    <Button
                      onClick={async () => {
                        try {
                          const detailed = await api.get(`/learning-materials/${mat.id}`);
                          setGeneratingForMaterial(detailed);
                        } catch {
                          setGeneratingForMaterial(mat);
                        }
                      }}
                      variant="primary"
                      className="flex-1 text-xs font-black py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    >
                      ⚡ Generate Questions
                    </Button>
                  )}

                  {hasQuestions && (
                    <Button
                      onClick={() => setReviewingMaterial(mat)}
                      variant="ghost"
                      className="text-xs font-black text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/30"
                    >
                      Review ({mat.question_count})
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadMaterialModal
          classroomId={classroomId}
          onClose={() => setShowUploadModal(false)}
          onUploaded={() => fetchMaterials()}
        />
      )}

      {viewingMaterial && (
        <ViewMaterialModal
          material={viewingMaterial}
          onClose={() => setViewingMaterial(null)}
          onOpenGenerate={(mat) => setGeneratingForMaterial(mat)}
        />
      )}

      {generatingForMaterial && (
        <GenerateQuestionsModal
          material={generatingForMaterial}
          onClose={() => setGeneratingForMaterial(null)}
          onGenerated={(materialId) => {
            fetchMaterials();
            const mat = materials.find((m) => m.id === materialId) || generatingForMaterial;
            setReviewingMaterial(mat);
          }}
        />
      )}

      {reviewingMaterial && (
        <QuestionReviewModal
          material={reviewingMaterial}
          onClose={() => setReviewingMaterial(null)}
          onQuizCreated={() => fetchMaterials()}
        />
      )}
    </div>
  );
}
