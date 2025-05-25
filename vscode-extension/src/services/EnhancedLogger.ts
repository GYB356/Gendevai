import * as vscode from 'vscode';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.INFO;
    private logs: LogEntry[] = [];

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('GenDevAI');
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.logLevel;
    }

    private formatMessage(entry: LogEntry): string {
        const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
        const timestamp = entry.timestamp.toISOString();
        const levelName = levelNames[entry.level];
        
        let message = `[${timestamp}] ${levelName}: ${entry.message}`;
        
        if (entry.context && Object.keys(entry.context).length > 0) {
            message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
        }
        
        if (entry.error) {
            message += `\n  Error: ${entry.error.message}`;
            if (entry.error.stack) {
                message += `\n  Stack: ${entry.error.stack}`;
            }
        }
        
        return message;
    }

    private writeLog(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            error
        };

        this.logs.push(entry);
        
        const formattedMessage = this.formatMessage(entry);
        this.outputChannel.appendLine(formattedMessage);

        // Also log to console for development
        if (level === LogLevel.ERROR) {
            console.error(formattedMessage);
        } else if (level === LogLevel.WARN) {
            console.warn(formattedMessage);
        } else {
            console.log(formattedMessage);
        }
    }

    public error(message: string, error?: Error, context?: Record<string, any>): void {
        this.writeLog(LogLevel.ERROR, message, context, error);
        
        // Show error notification for critical errors
        if (error && this.isCriticalError(error)) {
            vscode.window.showErrorMessage(`GenDevAI: ${message}`);
        }
    }

    public warn(message: string, context?: Record<string, any>): void {
        this.writeLog(LogLevel.WARN, message, context);
    }

    public info(message: string, context?: Record<string, any>): void {
        this.writeLog(LogLevel.INFO, message, context);
    }

    public debug(message: string, context?: Record<string, any>): void {
        this.writeLog(LogLevel.DEBUG, message, context);
    }

    public log(message: string, context?: Record<string, any>): void {
        this.info(message, context);
    }

    private isCriticalError(error: Error): boolean {
        const criticalKeywords = ['auth', 'permission', 'network', 'timeout'];
        const errorMessage = error.message.toLowerCase();
        return criticalKeywords.some(keyword => errorMessage.includes(keyword));
    }

    public logApiCall(method: string, url: string, duration: number, success: boolean, context?: Record<string, any>): void {
        const level = success ? LogLevel.DEBUG : LogLevel.WARN;
        const status = success ? 'SUCCESS' : 'FAILED';
        
        this.writeLog(level, `API ${method} ${url} - ${status} (${duration}ms)`, {
            ...context,
            method,
            url,
            duration,
            success,
            type: 'api_call'
        });
    }

    public logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
        const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
        
        this.writeLog(level, `Performance: ${operation} took ${duration}ms`, {
            ...context,
            operation,
            duration,
            type: 'performance'
        });
    }

    public getLogs(level?: LogLevel): LogEntry[] {
        if (level !== undefined) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    public clearLogs(): void {
        this.logs = [];
        this.outputChannel.clear();
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
