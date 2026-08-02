import * as vscode from 'vscode';
import { getToken, getServerUrl } from './auth';

export class AssignmentSidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'classroomAssignments';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const serverUrl = await getServerUrl();
      const token = await getToken();
      
      if (!serverUrl || !token) {
        webviewView.webview.postMessage({ type: 'error', value: 'Not logged in' });
        return;
      }

      switch (data.type) {
        case 'fetchAssignments':
          try {
            // Need classroomId. Usually fetched from tracker state or user selection
            // For MVP, we will fetch the first classroom they are enrolled in
            const classRes = await fetch(`${serverUrl}/api/classrooms`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const classrooms = await classRes.json() as any[];
            if (classrooms && classrooms.length > 0) {
              const classroomId = classrooms[0].id;
              const res = await fetch(`${serverUrl}/api/assignments/classroom/${classroomId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const assignments = await res.json();
              webviewView.webview.postMessage({ type: 'assignmentsData', value: assignments });
            } else {
              webviewView.webview.postMessage({ type: 'assignmentsData', value: [] });
            }
          } catch (e: any) {
            webviewView.webview.postMessage({ type: 'error', value: e.message });
          }
          break;

        case 'fetchDetails':
          try {
            const res = await fetch(`${serverUrl}/api/assignments/${data.assignmentId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const details = await res.json();
            
            try {
              const { marked } = require('marked');
              details.descriptionHtml = marked.parse(details.description);
            } catch (err) {
              console.error('Failed to parse markdown', err);
              details.descriptionHtml = details.description;
            }

            webviewView.webview.postMessage({ type: 'assignmentDetails', value: details });
          } catch (e: any) {
             webviewView.webview.postMessage({ type: 'error', value: e.message });
          }
          break;

        case 'runCode':
          try {
            // Get current active editor code
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage('No active file open.');
              return;
            }
            const code = editor.document.getText();
            
            const res = await fetch(`${serverUrl}/api/assignments/${data.assignmentId}/run`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ sourceCode: code, language: editor.document.languageId === 'javascript' ? 'node' : editor.document.languageId })
            });
            const result = await res.json();
            webviewView.webview.postMessage({ type: 'runResult', value: result });
          } catch (e: any) {
            webviewView.webview.postMessage({ type: 'error', value: e.message });
          }
          break;

        case 'submitCode':
          try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
              vscode.window.showErrorMessage('No active file open.');
              return;
            }
            const code = editor.document.getText();
            
            const res = await fetch(`${serverUrl}/api/assignments/${data.assignmentId}/submit`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ sourceCode: code, language: editor.document.languageId === 'javascript' ? 'node' : editor.document.languageId })
            });
            const result = await res.json();
            webviewView.webview.postMessage({ type: 'submitResult', value: result });
            vscode.window.showInformationMessage(`Assignment submitted! Score: ${result.score}`);
          } catch (e: any) {
            webviewView.webview.postMessage({ type: 'error', value: e.message });
          }
          break;

        case 'getHint':
          try {
            const res = await fetch(`${serverUrl}/api/assignments/${data.assignmentId}/hint`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ level: data.level })
            });
            const result = await res.json();
            webviewView.webview.postMessage({ type: 'hintResult', value: result.hint, level: data.level });
          } catch (e: any) {
            webviewView.webview.postMessage({ type: 'error', value: e.message });
          }
          break;
      }
    });
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Classroom Assignments</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); padding: 10px; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 12px; cursor: pointer; margin-top: 5px; width: 100%; border-radius: 4px;}
    button:hover { background: var(--vscode-button-hoverBackground); }
    .card { background: var(--vscode-editorWidget-background); padding: 10px; margin-bottom: 10px; border: 1px solid var(--vscode-widget-border); border-radius: 4px; cursor: pointer; }
    .hidden { display: none; }
    #details { margin-top: 10px; }
    .test-case { background: #1e1e1e; padding: 8px; font-family: monospace; font-size: 12px; margin-top: 5px; border-radius: 4px; }
    .hint-box { background: rgba(128, 0, 128, 0.2); border-left: 3px solid purple; padding: 8px; margin-top: 5px; }
  </style>
</head>
<body>
  <div id="list-view">
    <h3 style="margin-top:0">Assignments</h3>
    <button onclick="fetchAssignments()">Refresh List</button>
    <div id="assignments-container" style="margin-top: 15px;"></div>
  </div>

  <div id="detail-view" class="hidden">
    <button onclick="goBack()" style="margin-bottom: 10px;">&larr; Back</button>
    <h2 id="a-title"></h2>
    <div id="a-meta" style="font-size: 12px; color: #888; margin-bottom: 10px;"></div>
    <p id="a-desc" style="white-space: pre-wrap; line-height: 1.4;"></p>
    
    <h4>Visible Test Cases</h4>
    <div id="a-tests"></div>

    <div style="margin-top: 20px;">
      <button onclick="runCode()" style="background: #2b7044;">Run Visible Tests</button>
      <button onclick="submitCode()" style="background: #005a9e; margin-top: 10px;">Submit Assignment</button>
      
      <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 10px;">
        <h4>Need help?</h4>
        <button onclick="getHint(1)" style="background: #6b2f75;">Get Concept Hint (Level 1)</button>
        <button onclick="getHint(2)" style="background: #6b2f75;">Get Logic Hint (Level 2)</button>
      </div>
      
      <div id="hints-container"></div>
      
      <div id="result-container" style="margin-top: 15px; font-weight: bold;"></div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentAssignmentId = null;

    function fetchAssignments() {
      vscode.postMessage({ type: 'fetchAssignments' });
    }

    function showDetails(id) {
      currentAssignmentId = id;
      vscode.postMessage({ type: 'fetchDetails', assignmentId: id });
    }

    function goBack() {
      document.getElementById('detail-view').classList.add('hidden');
      document.getElementById('list-view').classList.remove('hidden');
    }

    function runCode() {
      document.getElementById('result-container').innerText = 'Running code...';
      vscode.postMessage({ type: 'runCode', assignmentId: currentAssignmentId });
    }

    function submitCode() {
      document.getElementById('result-container').innerText = 'Submitting...';
      vscode.postMessage({ type: 'submitCode', assignmentId: currentAssignmentId });
    }

    function getHint(level) {
      vscode.postMessage({ type: 'getHint', assignmentId: currentAssignmentId, level });
    }

    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'assignmentsData':
          const container = document.getElementById('assignments-container');
          container.innerHTML = '';
          const published = message.value.filter(a => a.is_published);
          if(published.length === 0) {
             container.innerHTML = '<p>No assignments yet.</p>';
          }
          published.forEach(a => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = '<strong>' + a.title + '</strong><br/><small>' + a.difficulty + ' | ' + a.marks + ' Marks</small>';
            div.onclick = () => showDetails(a.id);
            container.appendChild(div);
          });
          break;

        case 'assignmentDetails':
          const d = message.value;
          document.getElementById('list-view').classList.add('hidden');
          document.getElementById('detail-view').classList.remove('hidden');
          document.getElementById('a-title').innerText = d.title;
          document.getElementById('a-desc').innerHTML = d.descriptionHtml || d.description;
          document.getElementById('a-meta').innerText = \`\${d.difficulty} • \${d.marks} Marks • \${d.language}\`;
          document.getElementById('hints-container').innerHTML = '';
          document.getElementById('result-container').innerText = '';
          
          const tCont = document.getElementById('a-tests');
          tCont.innerHTML = '';
          (d.testCases || []).filter(t => !t.is_hidden).forEach(t => {
             tCont.innerHTML += '<div class="test-case"><strong>Input:</strong> ' + t.input + '<br/><strong>Output:</strong> ' + t.expected_output + '</div>';
          });
          break;

        case 'hintResult':
          document.getElementById('hints-container').innerHTML += '<div class="hint-box"><strong>Hint Level ' + message.level + ':</strong> ' + message.value + '</div>';
          break;

        case 'runResult':
          const runRes = message.value.results || [];
          let runHtml = '<h4>Test Results</h4>';
          let rPassed = 0;
          runRes.forEach(r => {
             const icon = r.passed ? '<span style="color:#4ade80">✓</span>' : '<span style="color:#f87171">✗</span>';
             if(r.passed) rPassed++;
             runHtml += \`<div class="test-case" style="border-left: 3px solid \${r.passed ? '#4ade80' : '#f87171'};">
                 \${icon} <strong>Test case \${r.testCaseNumber}</strong><br/>
                 <small style="color:#888">Input:</small><pre style="margin:2px 0 6px;background:#111;padding:4px;overflow-x:auto;">\${r.input}</pre>
                 <small style="color:#888">Expected Output:</small><pre style="margin:2px 0 6px;background:#111;padding:4px;overflow-x:auto;">\${r.expectedOutput}</pre>
                 <small style="color:#888">Your Output:</small><pre style="margin:2px 0 0px;background:#111;padding:4px;color:\${r.passed?'#ccc':'#f87171'};overflow-x:auto;">\${r.actualOutput}</pre>
             </div>\`;
          });
          runHtml = \`<div style="margin-bottom:10px;font-size:14px;color:\${rPassed===runRes.length?'#4ade80':'#f87171'}">Test cases passed: \${rPassed}/\${runRes.length}</div>\` + runHtml;
          document.getElementById('result-container').innerHTML = runHtml;
          break;

        case 'submitResult':
          const subRes = message.value.results || [];
          let subHtml = \`<h4>Submission: \${message.value.status} (\${message.value.score} Marks)</h4>\`;
          subRes.forEach(r => {
             const icon = r.passed ? '<span style="color:#4ade80">✓</span>' : '<span style="color:#f87171">✗</span>';
             subHtml += \`<div class="test-case" style="border-left: 3px solid \${r.passed ? '#4ade80' : '#f87171'};">
                 \${icon} <strong>Test case \${r.testCaseNumber} \${r.isHidden ? '<span style="color:#eab308">(Hidden)</span>' : ''}</strong><br/>
                 \${!r.isHidden ? \`
                 <small style="color:#888">Input:</small><pre style="margin:2px 0 6px;background:#111;padding:4px;overflow-x:auto;">\${r.input}</pre>
                 <small style="color:#888">Expected:</small><pre style="margin:2px 0 6px;background:#111;padding:4px;overflow-x:auto;">\${r.expectedOutput}</pre>
                 <small style="color:#888">Your Output:</small><pre style="margin:2px 0 0px;background:#111;padding:4px;color:\${r.passed?'#ccc':'#f87171'};overflow-x:auto;">\${r.actualOutput}</pre>
                 \` : (r.passed ? '' : \`<div style="margin-top:4px;color:#f87171">Hidden test case failed.</div>\`)}
             </div>\`;
          });
          document.getElementById('result-container').innerHTML = subHtml;
          break;
          
        case 'error':
          document.getElementById('result-container').innerHTML = '<span style="color: #f87171;">Error: ' + message.value + '</span>';
          break;
      }
    });

    // Initial load
    fetchAssignments();
  </script>
</body>
</html>`;
  }
}
