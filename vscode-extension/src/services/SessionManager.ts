import * as vscode from 'vscode';
import { Logger } from './Logger';

export interface Session {
    id: string;
    startTime: Date;
    context: {
        workspace: vscode.WorkspaceFolder | undefined;
        activeFile: string | undefined;
        language: string | undefined;
    };
}

export class SessionManager {
    private static instance: SessionManager;
    private currentSession: Session | undefined;
    private logger: Logger;

    private constructor() {
        this.logger = Logger.getInstance();
    }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    public startSession(): Session {
        const editor = vscode.window.activeTextEditor;
        
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: new Date(),
            context: {
                workspace: vscode.workspace.workspaceFolders?.[0],
                activeFile: editor?.document.uri.fsPath,
                language: editor?.document.languageId
            }
        };

        this.logger.log('Session started', {
            sessionId: this.currentSession.id,
            workspace: this.currentSession.context.workspace?.name
        });

        return this.currentSession;
    }

    public getCurrentSession(): Session | undefined {
        return this.currentSession;
    }

    public endSession() {
        if (this.currentSession) {
            this.logger.log('Session ended', {
                sessionId: this.currentSession.id,
                duration: new Date().getTime() - this.currentSession.startTime.getTime()
            });
            this.currentSession = undefined;
        }
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public updateSessionContext() {
        if (this.currentSession) {
            const editor = vscode.window.activeTextEditor;
            this.currentSession.context = {
                workspace: vscode.workspace.workspaceFolders?.[0],
                activeFile: editor?.document.uri.fsPath,
                language: editor?.document.languageId
            };
        }
    }
}
