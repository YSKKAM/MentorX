import * as vscode from 'vscode';

let debounceTimer: NodeJS.Timeout | null = null;

export function getDiagnosticsForActiveFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return [];

    const uri = editor.document.uri;
    const diagnostics = vscode.languages.getDiagnostics(uri);
    return mapDiagnostics(diagnostics, uri);
}

export function getAllDiagnostics() {
    const allDiagnostics = vscode.languages.getDiagnostics();
    let result: any[] = [];
    for (const [uri, diagnostics] of allDiagnostics) {
        result = result.concat(mapDiagnostics(diagnostics, uri));
    }
    return result;
}

function mapDiagnostics(diagnostics: vscode.Diagnostic[], uri: vscode.Uri) {
    let file = vscode.workspace.asRelativePath(uri);
    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uri.toString());
    
    return diagnostics.map(d => {
        let codeSnippet = '';
        if (doc) {
            codeSnippet = doc.getText();
        }
        
        return {
            message: d.message,
            severity: severityToString(d.severity),
            line: d.range.start.line + 1,
            file: file,
            source: d.source || 'unknown',
            codeSnippet: codeSnippet.trim()
        };
    });
}

function severityToString(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
        case vscode.DiagnosticSeverity.Error: return 'Error';
        case vscode.DiagnosticSeverity.Warning: return 'Warning';
        case vscode.DiagnosticSeverity.Information: return 'Information';
        case vscode.DiagnosticSeverity.Hint: return 'Hint';
        default: return 'Unknown';
    }
}

export function watchDiagnostics(callback: () => void): vscode.Disposable {
    return vscode.languages.onDidChangeDiagnostics(() => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
            callback();
        }, 1000);
    });
}
