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
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardPasteAction', async () => {
      if (activeSettings.strict_mode_enabled && currentClassroomId) {
        if (activeSettings.block_paste) {
          handleRestrictedAction('blocked_paste', 'Paste is disabled during this assignment because Strict Mode is enabled.');
        } else {
          // Monitor-only mode: Allow paste seamlessly, notify teacher dashboard
          await vscode.commands.executeCommand('default:editor.action.clipboardPasteAction');
          handleRestrictedAction('paste_used', null);
        }
      } else {
        // Execute default paste command when Strict Mode is OFF
        await vscode.commands.executeCommand('default:editor.action.clipboardPasteAction');
      }
    })
  );

  // Overrides VS Code Copy command (Ctrl+C / Cmd+C / Context Menu Copy)
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardCopyAction', async () => {
      if (activeSettings.strict_mode_enabled && currentClassroomId) {
        if (activeSettings.block_copy) {
          handleRestrictedAction('blocked_copy', 'Copy is restricted inside the controlled workspace because Strict Mode is enabled.');
        } else {
          await vscode.commands.executeCommand('default:editor.action.clipboardCopyAction');
          handleRestrictedAction('copy_used', null);
        }
      } else {
        await vscode.commands.executeCommand('default:editor.action.clipboardCopyAction');
      }
    })
  );

  // Overrides VS Code Cut command (Ctrl+X / Cmd+X / Context Menu Cut)
  disposables.push(
    vscode.commands.registerCommand('editor.action.clipboardCutAction', async () => {
      if (activeSettings.strict_mode_enabled && currentClassroomId) {
        if (activeSettings.block_cut) {
          handleRestrictedAction('blocked_cut', 'Cut is restricted inside the controlled workspace because Strict Mode is enabled.');
        } else {
          await vscode.commands.executeCommand('default:editor.action.clipboardCutAction');
          handleRestrictedAction('cut_used', null);
        }
      } else {
        await vscode.commands.executeCommand('default:editor.action.clipboardCutAction');
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
  eventType: 'blocked_paste' | 'blocked_copy' | 'blocked_cut' | 'paste_used' | 'copy_used' | 'cut_used',
  message?: string | null
) {
  // Show clear warning to student ONLY if blocking message is provided
  if (message) {
    vscode.window.showWarningMessage(message);
  }

  const now = Date.now();
  recentAttempts = recentAttempts.filter((t) => now - t < 30000); // 30 second window
  recentAttempts.push(now);

  const attemptCount = recentAttempts.length;
  const finalEventType = attemptCount >= 3 ? 'multiple_attempts' : eventType;

  // Get current active file path (minimum required context)
  let currentFile = 'unknown';
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (workspaceFolder) {
      currentFile = vscode.workspace.asRelativePath(editor.document.uri);
    } else {
      currentFile = editor.document.fileName;
    }
  }

  // Always emit if connected and in a classroom — server handles persistence decision
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
