import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function initStatusBar(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'classroom.showStatus';
    context.subscriptions.push(statusBarItem);
    update('Disconnected');
    statusBarItem.show();
}

export function update(state: 'Disconnected' | 'Connected' | 'Tracking' | 'Error', text?: string) {
    if (!statusBarItem) return;

    switch (state) {
        case 'Disconnected':
            statusBarItem.text = '$(debug-disconnect) Classroom';
            statusBarItem.tooltip = 'Disconnected';
            statusBarItem.color = new vscode.ThemeColor('disabledForeground');
            break;
        case 'Connected':
            statusBarItem.text = '$(plug) Classroom: Connected';
            statusBarItem.tooltip = 'Connected';
            statusBarItem.color = new vscode.ThemeColor('charts.green');
            break;
        case 'Tracking':
            statusBarItem.text = `$(eye) Tracking: ${text || 'Unknown'}`;
            statusBarItem.tooltip = 'Tracking Activity';
            statusBarItem.color = new vscode.ThemeColor('charts.blue');
            break;
        case 'Error':
            statusBarItem.text = '$(error) Classroom: Error';
            statusBarItem.tooltip = text || 'Error';
            statusBarItem.color = new vscode.ThemeColor('errorForeground');
            break;
    }
}
