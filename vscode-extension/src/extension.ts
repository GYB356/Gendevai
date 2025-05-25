/**
 * GenDevAI VS Code Extension - Main Entry Point
 * 
 * This extension provides deep IDE integration for the GenDevAI platform,
 * enabling conversational AI assistance, multi-agent collaboration, and
 * proactive code improvement suggestions directly within VS Code.
 */

import * as vscode from 'vscode';
import { ChatPanel } from './panels/ChatPanel';
import { AgentsPanel } from './panels/AgentsPanel';
import { InlineAssistanceProvider } from './providers/inline-assistance-provider';
import { ProactiveAnalysisService } from './services/ProactiveAnalysisService';
import { ApiClient } from './services/api-client';
import { SessionManager } from './services/SessionManager';
import { Logger } from './services/Logger';

// Extension state
let sessionManager = SessionManager.getInstance();
let logger = Logger.getInstance();
let proactiveAnalysisService = ProactiveAnalysisService.getInstance();
let inlineAssistanceProvider: InlineAssistanceProvider | undefined;
let apiClient: ApiClient | undefined;

export function activate(context: vscode.ExtensionContext) {
    logger.log('Activating GenDevAI extension');
    
    // Initialize services
    initializeServices(context);
    
    // Register commands
    registerCommands(context);
    
    // Initialize UI components
    initializeUiComponents(context);
    
    // Start proactive analysis if enabled
    startProactiveAnalysis();
    
    logger.log('GenDevAI extension activated');
}

function initializeServices(context: vscode.ExtensionContext) {
    // Initialize API client
    const config = vscode.workspace.getConfiguration('gendevai');
    const apiKey = config.get<string>('apiKey');
    const serverUrl = config.get<string>('serverUrl');
    
    if (!apiKey) {
        vscode.window.showWarningMessage('GenDevAI API key not found. Please set it in the extension settings.');
    }
    
    apiClient = new ApiClient({
        apiKey,
        serverUrl,
        context
    });

    // Initialize inline assistance provider
    const inlineAssistanceEnabled = config.get<boolean>('inlineAssistanceEnabled');
    if (inlineAssistanceEnabled) {
        inlineAssistanceProvider = new InlineAssistanceProvider(apiClient, context);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gendevai.start', async () => {
            const session = sessionManager.startSession();
            vscode.window.showInformationMessage('GenDevAI session started');
        }),
        
        vscode.commands.registerCommand('gendevai.showChat', () => {
            ChatPanel.createOrShow(context.extensionUri);
        }),

        vscode.commands.registerCommand('gendevai.showAgents', () => {
            AgentsPanel.createOrShow(context.extensionUri);
        }),

        vscode.commands.registerCommand('gendevai.askQuestion', async () => {
            const question = await vscode.window.showInputBox({
                prompt: 'What would you like to ask GenDevAI?',
                placeHolder: 'e.g., How do I implement authentication in Express?'
            });
            
            if (question && apiClient) {
                ChatPanel.createOrShow(context.extensionUri);
            }
        }),
        
        vscode.commands.registerCommand('gendevai.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showErrorMessage('No code selected');
                return;
            }
            
            ChatPanel.createOrShow(context.extensionUri);
        }),
        
        vscode.commands.registerCommand('gendevai.improveCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showErrorMessage('No code selected');
                return;
            }
            
            if (apiClient && proactiveAnalysisService) {
                // Let the proactive analysis service handle the code improvement
                await proactiveAnalysisService.analyze({
                    code: selectedText,
                    uri: editor.document.uri
                });
            }
        }),
        
        vscode.commands.registerCommand('gendevai.startMultiAgentTask', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'Describe the development task',
                placeHolder: 'e.g., Create a user authentication system'
            });
            
            if (task) {
                AgentsPanel.createOrShow(context.extensionUri);
            }
        })
    );
}

function initializeUiComponents(context: vscode.ExtensionContext) {
    // Register commands for showing panels
    context.subscriptions.push(
        vscode.commands.registerCommand('gendevai.showChat', () => {
            ChatPanel.createOrShow(context.extensionUri);
        }),
        vscode.commands.registerCommand('gendevai.showAgents', () => {
            AgentsPanel.createOrShow(context.extensionUri);
        })
    );
}

function startProactiveAnalysis() {
    if (proactiveAnalysisService) {
        const config = vscode.workspace.getConfiguration('gendevai');
        const analysisEnabled = config.get<boolean>('proactiveAnalysisEnabled', true);
        
        if (analysisEnabled) {
            proactiveAnalysisService.startAnalysis();
        }
    }
}

export function deactivate() {
    logger.log('Deactivating GenDevAI extension');
    sessionManager.endSession();
    logger.log('GenDevAI extension deactivated');
}
