import * as vscode from 'vscode';

export interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
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

    public log(message: string, data?: any) {
        this.addEntry('info', message, data);
    }

    public warn(message: string, data?: any) {
        this.addEntry('warn', message, data);
    }

    public error(message: string, data?: any) {
        this.addEntry('error', message, data);
        vscode.window.showErrorMessage(`GenDevAI: ${message}`);
    }

    private addEntry(level: 'info' | 'warn' | 'error', message: string, data?: any) {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            data
        };

        this.logs.push(entry);
        this.outputToChannel(entry);
    }

    private outputToChannel(entry: LogEntry) {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase();
        let output = `[${timestamp}] [${level}] ${entry.message}`;
        
        if (entry.data) {
            output += `\n${JSON.stringify(entry.data, null, 2)}`;
        }

        this.outputChannel.appendLine(output);
    }

    public getLogs(level?: 'info' | 'warn' | 'error'): LogEntry[] {
        if (level) {
            return this.logs.filter(log => log.level === level);
        }
        return this.logs;
    }

    public clearLogs() {
        this.logs = [];
        this.outputChannel.clear();
    }

    public dispose() {
        this.outputChannel.dispose();
    }
}
