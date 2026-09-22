import * as vscode from 'vscode';
import * as socket from './socket';

export interface StrictModeSettings {
  classroomId?: string;
  strict_mode_enabled?: boolean;
  block_paste?: boolean;
  block_copy?: boolean;
  block_cut?: boolean;
  record_restricted_events?: boolean;
}

let activeSettings: StrictModeSettings = {
  strict_mode_enabled: false,
  block_paste: true,
  block_copy: true,
  block_cut: true,
  record_restricted_events: true,
};

let currentClassroomId: string | null = null;
let disposables: vscode.Disposable[] = [];
let recentAttempts: number[] = [];

/**
 * Initialize Strict Mode command overrides and listeners
 */
export function initStrictMode(context: vscode.ExtensionContext) {
  // Overrides VS Code Paste command (Ctrl+V / Cmd+V / Context Menu Paste)
  // MONITOR-ONLY: always allows the paste, always notifies teacher when in a classroom.
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardPasteAction', async () => {
      await vscode.commands.executeCommand('default:editor.action.clipboardPasteAction');
      if (currentClassroomId) {
        handleRestrictedAction('paste_used');
      }
    })
  );

  // Overrides VS Code Copy command (Ctrl+C / Cmd+C / Context Menu Copy)
  // MONITOR-ONLY: always allows the copy, always notifies teacher when in a classroom.
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardCopyAction', async () => {
      await vscode.commands.executeCommand('default:editor.action.clipboardCopyAction');
      if (currentClassroomId) {
        handleRestrictedAction('copy_used');
      }
    })
  );

  // Overrides VS Code Cut command (Ctrl+X / Cmd+X / Context Menu Cut)
  // MONITOR-ONLY: always allows the cut, always notifies teacher when in a classroom.
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardCutAction', async () => {
      await vscode.commands.executeCommand('default:editor.action.clipboardCutAction');
      if (currentClassroomId) {
        handleRestrictedAction('cut_used');
      }
    })
  );

  // Listen for real-time Strict Mode configuration toggles from the teacher dashboard.
  // NOTE: onEventWhenReady defers registration until the socket is connected, preventing
  // silent drops when initStrictMode() runs before the student logs in.
  socket.onEventWhenReady('classroom:strict-mode-toggle', (data: StrictModeSettings) => {
    if (data && (!data.classroomId || data.classroomId === currentClassroomId)) {
      updateSettings(data);
    }
  });

  context.subscriptions.push(...disposables);
}

/**
 * Update active Strict Mode settings for the current classroom session
 */
export function updateSettings(settings: StrictModeSettings) {
  activeSettings = {
    ...activeSettings,
    ...settings,
  };

  if (activeSettings.strict_mode_enabled) {
    vscode.window.showInformationMessage('MentorX Strict Mode is ACTIVE for this classroom assignment.');
  }
}

/**
 * Enable/Disable tracking for a specific classroom
 */
export function setClassroom(classroomId: string | null) {
  currentClassroomId = classroomId;
  if (!classroomId) {
    activeSettings.strict_mode_enabled = false;
    recentAttempts = [];
  }
}

/**
 * Handle restricted copy/paste action, notify student, track attempts, and emit socket event.
 * We always emit when connected — the server decides whether to persist based on
 * record_restricted_events. Gating emission client-side caused silent data loss because
 * the DB default differs from the extension default.
 */
function handleRestrictedAction(
  eventType: 'paste_used' | 'copy_used' | 'cut_used' | 'multiple_attempts'
) {
  const now = Date.now();
  recentAttempts = recentAttempts.filter((t) => now - t < 30000); // 30 second window
  recentAttempts.push(now);

  const attemptCount = recentAttempts.length;
  const finalEventType = attemptCount >= 3 ? 'multiple_attempts' : eventType;

  // Get current active file path
  let currentFile = 'unknown';
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    currentFile = workspaceFolder
      ? vscode.workspace.asRelativePath(editor.document.uri)
      : editor.document.fileName;
  }

  // Emit to server — no clipboard content collected, monitor-only
  if (currentClassroomId && socket.isConnected()) {
    socket.emit('student:restricted-action', {
      classroomId: currentClassroomId,
      eventType: finalEventType,
      currentFile,
      attemptCount,
    });
  }
}

export function getStrictModeConfig() {
  return {
    ...activeSettings,
    currentClassroomId,
  };
}
