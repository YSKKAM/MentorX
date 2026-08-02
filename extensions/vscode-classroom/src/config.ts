import * as vscode from 'vscode';

export const getDefaultServerUrl = (): string => {
    return vscode.workspace.getConfiguration('classroom').get<string>('serverUrl', 'http://localhost:3001');
};

export const getActivitySendInterval = (): number => {
    return vscode.workspace.getConfiguration('classroom').get<number>('activitySendInterval', 5000);
};

export const getIdleTimeout = (): number => {
    return vscode.workspace.getConfiguration('classroom').get<number>('idleTimeout', 30000);
};
