import * as vscode from 'vscode';
import { initAuth, login, logout, getToken, getServerUrl } from './auth';
import { initStatusBar, update as updateStatus } from './statusbar';
import * as socket from './socket';
import * as tracker from './tracker';
import { AssignmentSidebarProvider } from './sidebar';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Classroom Tracker is now active!');

    initAuth(context);
    initStatusBar(context);

    const sidebarProvider = new AssignmentSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(AssignmentSidebarProvider.viewType, sidebarProvider)
    );

    context.subscriptions.push(vscode.commands.registerCommand('classroom.login', async () => {
        const result = await login();
        if (result) {
            try {
                await socket.connect(result.serverUrl, result.token);
                updateStatus('Connected');
                vscode.window.showInformationMessage('Successfully logged in and connected to Classroom Server.');
                vscode.commands.executeCommand('classroom.selectClassroom');
            } catch (err: any) {
                updateStatus('Error', err.message);
                vscode.window.showErrorMessage(`Failed to connect: ${err.message}`);
            }
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('classroom.selectClassroom', async () => {
        const token = await getToken();
        const serverUrl = await getServerUrl();
        if (!token || !serverUrl) {
            vscode.window.showErrorMessage('Please login first.');
            return;
        }

        try {
            const response = await fetch(`${serverUrl}/api/classrooms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch classrooms');
            
            const classrooms = await response.json() as any[];
            if (!classrooms || classrooms.length === 0) {
                vscode.window.showInformationMessage('No classrooms available.');
                return;
            }

            const items: vscode.QuickPickItem[] = classrooms.map(c => ({
                label: c.name,
                description: c.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a classroom to join'
            });

            if (selected && selected.description) {
                if (!socket.isConnected()) {
                    await socket.connect(serverUrl, token);
                }
                tracker.start(selected.description);
                updateStatus('Tracking', selected.label);
                vscode.window.showInformationMessage(`Joined classroom: ${selected.label}`);
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`Error selecting classroom: ${err.message}`);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('classroom.disconnect', async () => {
        tracker.stop();
        socket.disconnect();
        await logout();
        updateStatus('Disconnected');
        vscode.window.showInformationMessage('Disconnected from Classroom.');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('classroom.showStatus', () => {
        const trackStatus = tracker.getStatus();
        const connectionState = socket.isConnected() ? 'Connected' : 'Disconnected';
        
        let message = `Connection: ${connectionState}`;
        if (trackStatus.isTracking) {
            message += ` | Tracking Classroom: ${trackStatus.currentClassroomId} | Status: ${trackStatus.status}`;
        }
        
        vscode.window.showInformationMessage(message);
    }));

    // Auto-connect if token exists
    const token = await getToken();
    const serverUrl = await getServerUrl();
    if (token && serverUrl) {
        try {
            await socket.connect(serverUrl, token);
            updateStatus('Connected');
        } catch (err) {
            updateStatus('Error', 'Auto-connect failed');
        }
    }
}

export function deactivate() {
    tracker.stop();
    socket.disconnect();
}
