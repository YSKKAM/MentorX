import * as vscode from 'vscode';

let extContext: vscode.ExtensionContext;

export function initSuggestions(context: vscode.ExtensionContext) {
    extContext = context;
}

export async function disableSuggestions() {
    if (!extContext) return;
    
    const config = vscode.workspace.getConfiguration();
    
    // Check if we already have saved settings (to prevent overwriting if VS Code was closed during a classroom session)
    const savedInline = extContext.globalState.get<boolean>('classroom-original-inline-suggest');
    const savedCopilot = extContext.globalState.get<any>('classroom-original-copilot-enable');
    
    let originalInline = config.get<boolean>('editor.inlineSuggest.enabled');
    let originalCopilot = config.get<any>('github.copilot.enable');
    
    // If we don't have them saved already, save them now
    if (savedInline === undefined) {
        await extContext.globalState.update('classroom-original-inline-suggest', originalInline);
    }
    if (savedCopilot === undefined) {
        await extContext.globalState.update('classroom-original-copilot-enable', originalCopilot);
    }

    try {
        // Disable VS Code native inline suggestions
        await config.update('editor.inlineSuggest.enabled', false, vscode.ConfigurationTarget.Global);
        
        // Disable GitHub Copilot
        await config.update('github.copilot.enable', { '*': false }, vscode.ConfigurationTarget.Global);
        
        vscode.window.showInformationMessage('Classroom Mode: Copilot and inline suggestions have been disabled.');
    } catch (err: any) {
        console.error('Failed to disable suggestions:', err);
    }
}

export async function restoreSuggestions() {
    if (!extContext) return;

    const config = vscode.workspace.getConfiguration();
    
    const savedInline = extContext.globalState.get<boolean>('classroom-original-inline-suggest');
    const savedCopilot = extContext.globalState.get<any>('classroom-original-copilot-enable');

    try {
        // Restore VS Code native inline suggestions
        if (savedInline !== undefined) {
            await config.update('editor.inlineSuggest.enabled', savedInline, vscode.ConfigurationTarget.Global);
            await extContext.globalState.update('classroom-original-inline-suggest', undefined);
        }

        // Restore GitHub Copilot
        if (savedCopilot !== undefined) {
            await config.update('github.copilot.enable', savedCopilot, vscode.ConfigurationTarget.Global);
            await extContext.globalState.update('classroom-original-copilot-enable', undefined);
        }

        console.log('Restored original suggestion settings.');
        vscode.window.showInformationMessage('Classroom Mode: Your inline suggestions settings have been restored.');
    } catch (err: any) {
        console.error('Failed to restore suggestions:', err);
    }
}

