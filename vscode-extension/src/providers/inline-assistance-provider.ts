/**
 * Provides inline AI assistance directly within the editor
 */

import * as vscode from 'vscode';
import { ApiClient } from '../services/api-client';
import { Logger } from '../services/Logger';
import { debounce } from '../utils/debounce';

interface AssistanceContext {
    code: string;
    language: string;
    position: vscode.Position;
    lineText: string;
}

export class InlineAssistanceProvider implements vscode.CodeActionProvider, vscode.HoverProvider, vscode.InlineCompletionItemProvider {
    private apiClient: ApiClient;
    private context: vscode.ExtensionContext;
    private logger: Logger;
    
    constructor(apiClient: ApiClient, context: vscode.ExtensionContext) {
        this.apiClient = apiClient;
        this.context = context;
        this.logger = Logger.getInstance();
        
        // Register providers
        this.registerProviders();
    }
    
    private registerProviders() {
        const supportedLanguages = [
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'python', 'java', 'go', 'rust', 'c', 'cpp'
        ];
        
        // Register code action provider
        this.context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                supportedLanguages,
                this,
                {
                    providedCodeActionKinds: [
                        vscode.CodeActionKind.QuickFix,
                        vscode.CodeActionKind.RefactorRewrite
                    ]
                }
            )
        );
        
        // Register hover provider
        this.context.subscriptions.push(
            vscode.languages.registerHoverProvider(supportedLanguages, this)
        );
        
        // Register inline completion provider
        this.context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(supportedLanguages, this)
        );
    }
    
    private getContext(
        document: vscode.TextDocument,
        position: vscode.Position,
        range?: vscode.Range
    ): AssistanceContext {
        // Get the line text
        const lineText = document.lineAt(position.line).text;
        
        // Get selected or nearby code for context
        const codeRange = range || new vscode.Range(
            Math.max(0, position.line - 10),
            0,
            Math.min(document.lineCount - 1, position.line + 10),
            0
        );
        
        return {
            code: document.getText(codeRange),
            language: document.languageId,
            position,
            lineText
        };
    }
    
    /**
     * Provide code actions for potential improvements or fixes
     */
    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        if (token.isCancellationRequested) {
            return [];
        }

        const code = document.getText(range);
        if (!code || code.trim().length < 10) {
            return [];
        }
        
        const actions: vscode.CodeAction[] = [];
        
        // Standard actions
        actions.push(this.createAction('Explain this code', 'explainCode', code, range));
        actions.push(this.createAction('Improve this code', 'improveCode', code, range));
        actions.push(this.createAction('Generate tests', 'generateTests', code, range));
        
        // Get intelligent suggestions based on the code context
        try {
            const assistContext = this.getContext(document, range.start, range);
            const suggestions = await this.apiClient.analyzeCode(assistContext);
            
            if (suggestions) {
                suggestions.forEach(suggestion => {
                    const action = new vscode.CodeAction(
                        suggestion.title,
                        suggestion.kind === 'refactor' 
                            ? vscode.CodeActionKind.RefactorRewrite
                            : vscode.CodeActionKind.QuickFix
                    );
                    action.edit = new vscode.WorkspaceEdit();
                    action.edit.replace(document.uri, range, suggestion.code);
                    actions.push(action);
                });
            }
        } catch (error) {
            this.logger.error('Error getting code suggestions', error);
        }
        
        return actions;
    }
    
    private createAction(title: string, command: string, code: string, range: vscode.Range): vscode.CodeAction {
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.command = {
            command: `gendevai.${command}`,
            title,
            arguments: [code, range]
        };
        return action;
    }
    
    /**
     * Provide hover information with AI insights
     */
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        if (token.isCancellationRequested) {
            return null;
        }
        
        try {
            const context = this.getContext(document, position);
            const wordRange = document.getWordRangeAtPosition(position);
            
            if (!wordRange) {
                return null;
            }
            
            const word = document.getText(wordRange);
            const insights = await this.apiClient.getInsights({
                word,
                ...context
            });
            
            if (insights) {
                return new vscode.Hover([
                    new vscode.MarkdownString(insights.description),
                    new vscode.MarkdownString(insights.example || '')
                ]);
            }
        } catch (error) {
            this.logger.error('Error getting hover insights', error);
        }
        
        return null;
    }
    
    /**
     * Provide AI-powered inline completions
     */
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | null> {
        if (token.isCancellationRequested) {
            return null;
        }

        try {
            const assistContext = this.getContext(document, position);
            const suggestions = await this.getInlineCompletions(assistContext);
            
            return suggestions.map(suggestion => ({
                text: suggestion.code,
                range: new vscode.Range(
                    position.line,
                    position.character,
                    position.line,
                    position.character + suggestion.insertText.length
                )
            }));
        } catch (error) {
            this.logger.error('Error getting inline completions', error);
            return null;
        }
    }

    @debounce(500)
    private async getInlineCompletions(context: AssistanceContext) {
        const completions = await this.apiClient.getCompletions(context);
        return completions || [];
    }
}
