'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  role?: 'teacher' | 'student';
  className?: string;
  buttonText?: string;
}

export default function GoogleLoginButton({
  role = 'student',
  className = '',
  buttonText = 'Continue with Google',
}: GoogleLoginButtonProps) {
  const { loginWithGoogle, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [demoEmail, setDemoEmail] = useState('student.alex@gmail.com');
  const [demoName, setDemoName] = useState('Alex Rivera');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>(role);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    // Load Google Identity Services script if not already present
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [clientId]);

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    try {
      setIsSubmitting(true);
      await loginWithGoogle(response.credential, selectedRole);
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClick = () => {
    if (!clientId) {
      // Prompt modal with setup instructions + instant demo login
      setShowConfigModal(true);
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render standard One Tap prompt or select account
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt is suppressed, fall back to showing the config or standard flow
          console.warn('Google prompt not displayed:', notification.getNotDisplayedReason());
        }
      });
    } else {
      setShowConfigModal(true);
    }
  };

  const handleDemoGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      const demoToken = `demo-google-token:${demoEmail}:${demoName}`;
      await loginWithGoogle(demoToken, selectedRole);
      setShowConfigModal(false);
    } catch (err) {
      console.error('Demo Google login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-3.5 px-4 rounded-xl border-3 border-black dark:border-white bg-white dark:bg-[#1E1E2E] text-slate-900 dark:text-white font-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.9)] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
            />
          </svg>
        )}
        <span>{isLoading ? 'Connecting to Google...' : buttonText}</span>
      </button>

      {/* Setup Guide & Demo Modal (shown when NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured yet) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FDFBF7] dark:bg-[#181824] rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] max-w-md w-full p-6 text-slate-950 dark:text-white space-y-5 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔑</span>
                <h3 className="font-black text-lg uppercase tracking-tight">Google OAuth Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="h-8 w-8 rounded-lg border-2 border-black dark:border-white bg-[#FF6666] text-black font-black flex items-center justify-center hover:opacity-80 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                ✕
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="rounded-2xl bg-[#FFE566] text-black border-2 border-black p-3.5 text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1.5">
              <div className="font-black uppercase flex items-center gap-1.5">
                <span>ℹ️</span> To enable official Google sign-in:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Create an OAuth Client ID in <strong>Google Cloud Console</strong></li>
                <li>Add to your <code className="bg-black/10 px-1 py-0.5 rounded font-mono">apps/web/.env.local</code>:</li>
                <pre className="bg-black text-white p-2 rounded-lg font-mono text-[10px] overflow-x-auto mt-1">
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                </pre>
              </ol>
            </div>

            {/* Instant Demo/Mock Sign-in section */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-black uppercase text-gray-500 tracking-wider">
                🧪 Test Google Sign-in Flow Now
              </div>

              <div>
                <label className="text-xs font-black block mb-1">Your Name</label>
                <input
                  type="text"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-black font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black block mb-1">Google Email</label>
                <input
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-black font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black block mb-1">Sign in as</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`py-2 px-3 rounded-xl border-2 border-black font-black text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      selectedRole === 'student'
                        ? 'bg-[#00FF66] text-black'
                        : 'bg-white text-gray-600 opacity-60'
                    }`}
                  >
                    🎒 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`py-2 px-3 rounded-xl border-2 border-black font-black text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      selectedRole === 'teacher'
                        ? 'bg-[#FF66C4] text-black'
                        : 'bg-white text-gray-600 opacity-60'
                    }`}
                  >
                    🧑‍🏫 Teacher
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoGoogleLogin}
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
              >
                {isLoading ? 'Signing In...' : '🚀 Test Sign In with Google'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
