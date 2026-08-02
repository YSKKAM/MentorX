import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execAsync = promisify(exec);

export const codeExecutionService = {
  async executeCode(sourceCode: string, language: string, input: string): Promise<{ stdout: string; stderr: string; error?: string }> {
    const tmpDir = path.join(os.tmpdir(), `exec-${crypto.randomUUID()}`);
    
    try {
      await fs.mkdir(tmpDir, { recursive: true });
      const inputPath = path.join(tmpDir, 'input.txt');
      await fs.writeFile(inputPath, input, 'utf8');

      let runCommand = '';

      if (language.toLowerCase() === 'java') {
        const filePath = path.join(tmpDir, 'Main.java');
        await fs.writeFile(filePath, sourceCode, 'utf8');
        try {
          await execAsync(`javac Main.java`, { cwd: tmpDir, timeout: 5000 });
        } catch (compileError: any) {
          return { stdout: '', stderr: compileError.stderr || compileError.message, error: 'Compilation Error' };
        }
        runCommand = `java Main < input.txt`;
      } else if (language.toLowerCase() === 'python') {
        const filePath = path.join(tmpDir, 'main.py');
        await fs.writeFile(filePath, sourceCode, 'utf8');
        runCommand = `python main.py < input.txt`;
      } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'node') {
        const filePath = path.join(tmpDir, 'main.js');
        await fs.writeFile(filePath, sourceCode, 'utf8');
        runCommand = `node main.js < input.txt`;
      } else {
        return { stdout: '', stderr: '', error: `Language ${language} not supported for execution` };
      }

      try {
        const { stdout, stderr } = await execAsync(runCommand, { 
          cwd: tmpDir, 
          timeout: 5000,
          maxBuffer: 1024 * 1024 
        });
        return { stdout, stderr };
      } catch (runError: any) {
        return {
          stdout: runError.stdout || '',
          stderr: runError.stderr || runError.message,
          error: runError.killed ? 'Time Limit Exceeded' : 'Runtime Error'
        };
      }
    } catch (e: any) {
      return { stdout: '', stderr: '', error: 'System Error: ' + e.message };
    } finally {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup tmp dir', tmpDir, e);
      }
    }
  }
};
