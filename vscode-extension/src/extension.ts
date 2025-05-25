/**
 * GenDevAI VS Code Extension - Main Entry Point
 * 
 * This extension provides deep IDE integration for the GenDevAI platform,
 * enabling conversational AI assistance, multi-agent collaboration, and
 * proactive code improvement suggestions directly within VS Code.
 */

import * as vscode from 'vscode';
import { ChatPanel } from './panels/chat-panel';
import { AgentsPanel } from './panels/agents-panel';
import { OpportunitiesPanel } from './panels/opportunities-panel';
import { SkillsPanel } from './panels/skills-panel';
import { InlineAssistanceProvider } from './providers/inline-assistance-provider';
import { ProactiveAnalysisService } from './services/proactive-analysis-service';
import { ApiClient } from './services/api-client';
import { SessionManager } from './services/session-manager';
import { Logger } from './utils/logger';

// Extension state
let chatPanel: ChatPanel | undefined;
let agentsPanel: AgentsPanel | undefined;
let opportunitiesPanel: OpportunitiesPanel | undefined;
let skillsPanel: SkillsPanel | undefined;
let inlineAssistanceProvider: InlineAssistanceProvider | undefined;
let proactiveAnalysisService: ProactiveAnalysisService | undefined;
let apiClient: ApiClient | undefined;
let sessionManager: SessionManager | undefined;
let logger: Logger;

export function activate(context: vscode.ExtensionContext) {
    logger = new Logger('GenDevAI');
    logger.info('Activating GenDevAI extension');
    
    // Initialize services
    initializeServices(context);
    
    // Register commands
    registerCommands(context);
    
    // Initialize UI components
    initializeUiComponents(context);
    
    // Start proactive analysis if enabled
    startProactiveAnalysis();
    
    logger.info('GenDevAI extension activated');
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
    
    // Initialize session manager
    sessionManager = new SessionManager(apiClient, context);
    
    // Initialize inline assistance provider
    const inlineAssistanceEnabled = config.get<boolean>('inlineAssistanceEnabled');
    if (inlineAssistanceEnabled) {
        inlineAssistanceProvider = new InlineAssistanceProvider(apiClient, context);
    }
    
    // Initialize proactive analysis service
    const proactiveAnalysisEnabled = config.get<boolean>('proactiveAnalysisEnabled');
    if (proactiveAnalysisEnabled) {
        proactiveAnalysisService = new ProactiveAnalysisService(apiClient, context);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('gendevai.start', async () => {
            await sessionManager?.startSession();
            vscode.window.showInformationMessage('GenDevAI session started');
        }),
        
        vscode.commands.registerCommand('gendevai.askQuestion', async () => {
            const question = await vscode.window.showInputBox({
                prompt: 'What would you like to ask GenDevAI?',
                placeHolder: 'e.g., How do I implement authentication in Express?'
            });
            
            if (question) {
                chatPanel?.askQuestion(question);
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
            
            const result = await apiClient?.explainCode(selectedText);
            
            if (result) {
                chatPanel?.showExplanation(selectedText, result);
            }
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
            
            const result = await apiClient?.improveCode(selectedText);
            
            if (result) {
                chatPanel?.showImprovement(selectedText, result);
            }
        }),
        
        vscode.commands.registerCommand('gendevai.findOpportunities', async () => {
            if (!proactiveAnalysisService) {
                vscode.window.showErrorMessage('Proactive analysis service not available');
                return;
            }
            
            vscode.window.showInformationMessage('Scanning codebase for improvement opportunities...');
            
            try {
                const opportunities = await proactiveAnalysisService.analyzeWorkspace();
                opportunitiesPanel?.showOpportunities(opportunities);
                
                vscode.window.showInformationMessage(`Found ${opportunities.length} improvement opportunities`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error scanning codebase: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        
        vscode.commands.registerCommand('gendevai.startMultiAgentTask', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'Describe the development task',
                placeHolder: 'e.g., Create a user authentication system with login, registration, and password reset'
            });
            
            if (task) {
                agentsPanel?.startMultiAgentTask(task);
            }
        }),
        
        vscode.commands.registerCommand('gendevai.generateTests', async () => {
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
            
            const result = await apiClient?.generateTests(selectedText);
            
            if (result) {
                chatPanel?.showTests(selectedText, result);
            }
        }),
        
        vscode.commands.registerCommand('gendevai.analyzeArchitecture', async () => {
            vscode.window.showInformationMessage('Analyzing project architecture...');
            
            try {
                const analysis = await apiClient?.analyzeArchitecture();
                
                if (analysis) {
                    // Show architecture analysis in a webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'architectureAnalysis',
                        'Architecture Analysis',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true
                        }
                    );
                    
                    panel.webview.html = getArchitectureAnalysisHtml(analysis);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Error analyzing architecture: ${error instanceof Error ? error.message : String(error)}`);
            }
        })
    );
}

function initializeUiComponents(context: vscode.ExtensionContext) {
    // Initialize UI panels
    chatPanel = new ChatPanel(context, apiClient!);
    agentsPanel = new AgentsPanel(context, apiClient!);
    opportunitiesPanel = new OpportunitiesPanel(context, apiClient!);
    skillsPanel = new SkillsPanel(context, apiClient!);
}

function startProactiveAnalysis() {
    if (proactiveAnalysisService) {
        proactiveAnalysisService.startPeriodicAnalysis();
    }
}

function getArchitectureAnalysisHtml(analysis: any): string {
    // In a real implementation, this would generate HTML with diagrams, etc.
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Architecture Analysis</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .pattern { margin-bottom: 20px; }
            .component { margin-left: 20px; margin-bottom: 10px; }
            .confidence { color: #666; }
        </style>
    </head>
    <body>
        <h1>Project Architecture Analysis</h1>
        <div class="pattern">
            <h2>Dominant Pattern: ${analysis.dominantPattern}</h2>
            <p class="confidence">Confidence: ${analysis.confidence * 100}%</p>
        </div>
        <h2>Components</h2>
        ${analysis.components.map((comp: any) => `
            <div class="component">
                <h3>${comp.name}</h3>
                <p>${comp.description}</p>
                <p>Responsibilities: ${comp.responsibilities.join(', ')}</p>
            </div>
        `).join('')}
        <h2>Suggested Improvements</h2>
        <ul>
            ${analysis.suggestedImprovements.map((imp: string) => `<li>${imp}</li>`).join('')}
        </ul>
    </body>
    </html>
    `;
}

export function deactivate() {
    logger.info('Deactivating GenDevAI extension');
    
    // Stop any ongoing processes
    proactiveAnalysisService?.stopPeriodicAnalysis();
    
    // Clean up resources
    sessionManager?.endSession();
    
    logger.info('GenDevAI extension deactivated');
}
