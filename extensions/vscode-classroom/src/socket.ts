import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';

let socket: Socket | null = null;

export function connect(serverUrl: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket) {
            socket.disconnect();
        }

        socket = io(serverUrl, {
            auth: { token },
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('Connected to Classroom Server');
            resolve();
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Classroom Server');
        });

        socket.on('connect_error', (err) => {
            vscode.window.showErrorMessage(`Socket connection error: ${err.message}`);
            reject(err);
        });
    });
}

export function disconnect() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function emit(event: string, data?: any) {
    if (socket && socket.connected) {
        socket.emit(event, data);
    }
}

export function joinClassroom(classroomId: string) {
    emit('classroom:join', { classroomId });
}

export function leaveClassroom(classroomId: string) {
    emit('classroom:leave', { classroomId });
}

export function sendActivity(data: any) {
    emit('student:activity', data);
}

export function isConnected(): boolean {
    return socket !== null && socket.connected;
}

export function onEvent(event: string, callback: (...args: any[]) => void) {
    if (socket) {
        socket.on(event, callback);
    }
}
