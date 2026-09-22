import * as vscode from 'vscode';
import * as socket from './socket';
import { getDiagnosticsForActiveFile } from './diagnostics';
import { getActivitySendInterval, getIdleTimeout } from './config';
import { disableSuggestions, restoreSuggestions } from './suggestions';
import { setClassroom } from './strictmode';

let isTracking = false;
let currentClassroomId: string | null = null;
let lastTypeTime = 0;
let status: 'coding' | 'idle' | 'debugging' = 'idle';
let intervalTimer: NodeJS.Timeout | null = null;
let disposables: vscode.Disposable[] = [];

export function start(classroomId: string) {
    if (isTracking) {
        stop();
    }
    
    currentClassroomId = classroomId;
    setClassroom(classroomId);
    isTracking = true;
    lastTypeTime = Date.now();
    status = 'coding';
    
    // Disable student inline suggestions/Copilot when joining classroom
    disableSuggestions();
    
    disposables.push(vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
            lastTypeTime = Date.now();
            if (status === 'idle') {
                status = 'coding';
            }
        }
    }));
    
    disposables.push(vscode.debug.onDidStartDebugSession(() => {
        status = 'debugging';
    }));
    
    disposables.push(vscode.debug.onDidTerminateDebugSession(() => {
        status = 'coding';
        lastTypeTime = Date.now();
    }));

    intervalTimer = setInterval(() => {
        sendStatus();
    }, getActivitySendInterval());
    
    socket.joinClassroom(classroomId);
    sendStatus();
}

export function stop() {
    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }
    
    disposables.forEach(d => d.dispose());
    disposables = [];
    
    if (currentClassroomId && socket.isConnected()) {
        socket.leaveClassroom(currentClassroomId);
    }
    
    isTracking = false;
    currentClassroomId = null;
    setClassroom(null);
    status = 'idle';
    
    // Restore student suggestion settings when leaving classroom
    restoreSuggestions();
}

function sendStatus() {
    if (!isTracking || !currentClassroomId || !socket.isConnected()) return;
    
    const now = Date.now();
    if (status !== 'debugging' && now - lastTypeTime > getIdleTimeout()) {
        status = 'idle';
    }
    
    const editor = vscode.window.activeTextEditor;
    const language = editor ? editor.document.languageId : 'unknown';
    
    let currentFile = 'unknown';
    if (editor) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
        if (workspaceFolder) {
            currentFile = vscode.workspace.asRelativePath(editor.document.uri);
        } else {
            currentFile = editor.document.fileName;
        }
    }
    
    const errors = getDiagnosticsForActiveFile();
    
    socket.sendActivity({
        classroomId: currentClassroomId,
        language,
        status,
        currentFile,
        errors
    });
}

export function getStatus() {
    return {
        isTracking,
        currentClassroomId,
        status
    };
}
