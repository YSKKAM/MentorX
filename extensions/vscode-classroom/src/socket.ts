import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';

let socket: Socket | null = null;
let activeClassroomId: string | null = null;
let savedToken: string | null = null;
let savedServerUrl: string | null = null;

export function connect(serverUrl: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket) {
            socket.disconnect();
        }

        savedServerUrl = serverUrl;
        savedToken = token;

        socket = io(serverUrl, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        // Set up connection timeout for the Promise
        const timeout = setTimeout(() => {
            cleanupTempListeners();
            reject(new Error('Connection timeout. Please verify that the server is online and the URL is correct.'));
        }, 10000);

        const onConnect = () => {
            clearTimeout(timeout);
            cleanupTempListeners();
            resolve();
        };

        const onConnectError = (err: any) => {
            clearTimeout(timeout);
            cleanupTempListeners();
            reject(err);
        };

        const cleanupTempListeners = () => {
            socket?.off('connect', onConnect);
            socket?.off('connect_error', onConnectError);
        };

        // Temporary listeners for this specific connection attempt
        socket.once('connect', onConnect);
        socket.once('connect_error', onConnectError);

        // Global permanent listeners (persisted across reconnection events)
        socket.on('connect', () => {
            console.log('Connected to Classroom Server');
            vscode.commands.executeCommand('setContext', 'classroom:connected', true);
            // Self-healing: if we were tracking a classroom, re-join it on reconnect!
            if (activeClassroomId) {
                console.log(`Re-joining classroom: ${activeClassroomId}`);
                socket?.emit('classroom:join', { classroomId: activeClassroomId });
            }
        });

        socket.on('disconnect', (reason) => {
            console.log(`Disconnected from Classroom Server: ${reason}`);
            vscode.commands.executeCommand('setContext', 'classroom:connected', false);
            if (reason === 'io server disconnect') {
                // Client was manually disconnected by the server, attempt manual reconnect
                socket?.connect();
            }
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });
    });
}

export function disconnect() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    activeClassroomId = null;
    savedToken = null;
    savedServerUrl = null;
    vscode.commands.executeCommand('setContext', 'classroom:connected', false);
}

export function emit(event: string, data?: any) {
    if (socket && socket.connected) {
        socket.emit(event, data);
    }
}

export function joinClassroom(classroomId: string) {
    activeClassroomId = classroomId;
    emit('classroom:join', { classroomId });
}

export function leaveClassroom(classroomId: string) {
    activeClassroomId = null;
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
