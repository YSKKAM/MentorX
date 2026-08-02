import * as vscode from 'vscode';
import { getDefaultServerUrl } from './config';

let extContext: vscode.ExtensionContext;

export function initAuth(context: vscode.ExtensionContext) {
    extContext = context;
}

export async function login() {
    const defaultUrl = await getServerUrl() || getDefaultServerUrl();
    const serverUrl = await vscode.window.showInputBox({ prompt: 'Enter Server URL', value: defaultUrl });
    if (!serverUrl) return null;

    const email = await vscode.window.showInputBox({ prompt: 'Enter Email' });
    if (!email) return null;

    const password = await vscode.window.showInputBox({ prompt: 'Enter Password', password: true });
    if (!password) return null;

    try {
        const response = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }
        
        const data = await response.json() as any;
        if (data.token) {
            await extContext.secrets.store('classroom-token', data.token);
            await extContext.globalState.update('classroom-server-url', serverUrl);
            await extContext.globalState.update('classroom-user', data.user);
            return { token: data.token, user: data.user, serverUrl };
        } else {
            throw new Error('No token received');
        }
    } catch (err: any) {
        vscode.window.showErrorMessage(`Login Error: ${err.message}`);
        return null;
    }
}

export async function logout() {
    await extContext.secrets.delete('classroom-token');
    await extContext.globalState.update('classroom-server-url', undefined);
    await extContext.globalState.update('classroom-user', undefined);
}

export async function getToken() {
    return await extContext.secrets.get('classroom-token');
}

export async function getServerUrl() {
    return extContext.globalState.get<string>('classroom-server-url');
}

export async function getStoredUser() {
    return extContext.globalState.get<any>('classroom-user');
}
