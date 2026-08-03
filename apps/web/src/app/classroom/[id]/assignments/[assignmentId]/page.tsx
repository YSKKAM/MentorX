"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { api } from "../../../../../lib/api";
import WebCodeEditor from "../../../../../components/assignment/WebCodeEditor";
import TestCaseResults, { TestCaseResultItem } from "../../../../../components/assignment/TestCaseResults";
import HintPanel from "../../../../../components/assignment/HintPanel";
import SubmissionConfirmModal from "../../../../../components/assignment/SubmissionConfirmModal";
import Button from "../../../../../components/ui/Button";

export default function StudentAssignmentWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id: classroomId, assignmentId } = use(params);

  const [assignment, setAssignment] = useState<any>(null);
  const [sourceCode, setSourceCode] = useState<string>("");
  const [testResults, setTestResults] = useState<TestCaseResultItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const data = await api.get(`/assignments/${assignmentId}`);
        setAssignment(data);

        // Boilerplate templates for starter code
        let starter = "";
        const lang = (data.language || "").toLowerCase();
        if (lang === "java") {
          starter = `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`;
        } else if (lang === "python") {
          starter = `# Write your Python solution here\nimport sys\n\ndef main():\n    pass\n\nif __name__ == '__main__':\n    main()\n`;
        } else {
          starter = `// Write your JavaScript solution here\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8');\n`;
        }
        setSourceCode(starter);
      } catch (err: any) {
        console.error("Failed to load assignment:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleRunTestCases = async () => {
    if (!sourceCode.trim()) return;

    setIsRunning(true);
    try {
      const res = await api.post(`/assignments/${assignmentId}/run`, {
        sourceCode,
        language: assignment.language,
      });

      if (res.results) {
        setTestResults(res.results);
      }
    } catch (err: any) {
      console.error("Failed to run test cases:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/assignments/${assignmentId}/submit`, {
        sourceCode,
        language: assignment.language,
      });

      setSubmissionResult(res);
      if (res.results) {
        setTestResults(res.results);
      }
    } catch (err: any) {
      console.error("Failed to submit assignment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0f] text-slate-300">
        <p className="text-lg font-bold mb-4">Assignment Not Found</p>
        <Link href={`/classroom/${classroomId}`}>
          <Button variant="secondary">Back to Classroom</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#090a10] text-slate-100 p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/classroom/${classroomId}`}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Classroom
            </Link>
            <span className="text-slate-700">•</span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {assignment.language}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {assignment.difficulty}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{assignment.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleRunTestCases} isLoading={isRunning}>
            ▶ Run Test Cases
          </Button>
          <Button variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
            🚀 Submit Assignment ({assignment.marks} pts)
          </Button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Instructions & Code Editor */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Assignment Description */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d0e15] p-5 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">Problem Description</h3>
            <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">
              {assignment.description || "No description provided."}
            </p>
          </div>

          {/* Web Code Editor */}
          <div className="flex-1 min-h-[450px]">
            <WebCodeEditor
              value={sourceCode}
              onChange={setSourceCode}
              language={assignment.language}
            />
          </div>
        </div>

        {/* Right Column: Test Case Results & Hints */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <TestCaseResults results={testResults} isRunning={isRunning} />
          <HintPanel assignmentId={assignmentId} />
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <SubmissionConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSubmissionResult(null);
        }}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        scoreResult={submissionResult}
      />
    </div>
  );
}
