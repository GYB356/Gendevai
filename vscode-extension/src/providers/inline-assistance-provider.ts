/**
 * Provides inline AI assistance directly within the editor
 */

import * as vscode from 'vscode';
import { ApiClient } from './api-client';

export class InlineAssistanceProvider implements vscode.CodeActionProvider, vscode.HoverProvider, vscode.InlineCompletionItemProvider {
    private apiClient: ApiClient;
    private context: vscode.ExtensionContext;
    
    constructor(apiClient: ApiClient, context: vscode.ExtensionContext) {
        this.apiClient = apiClient;
        this.context = context;
        
        // Register providers
        this.registerProviders();
    }
    
    private registerProviders() {
        // Register code action provider
        this.context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'python', 'java', 'go', 'rust', 'c', 'cpp'],
                this,
                {
                    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
                }
            )
        );
        
        // Register hover provider
        this.context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'python', 'java', 'go', 'rust', 'c', 'cpp'],
                this
            )
        );
        
        // Register inline completion provider
        this.context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(
                ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'python', 'java', 'go', 'rust', 'c', 'cpp'],
                this
            )
        );
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
        // Get the code at the current position
        const code = document.getText(range);
        if (!code || code.trim().length < 10) {
            return [];
        }
        
        // We'll provide a few standard actions for the selected code
        const actions: vscode.CodeAction[] = [];
        
        // Add "Explain this code" action
        const explainAction = new vscode.CodeAction('Explain this code', vscode.CodeActionKind.QuickFix);
        explainAction.command = {
            command: 'gendevai.explainCode',
            title: 'Explain this code',
            arguments: [code]
        };
        actions.push(explainAction);
        
        // Add "Improve this code" action
        const improveAction = new vscode.CodeAction('Improve this code', vscode.CodeActionKind.QuickFix);
        improveAction.command = {
            command: 'gendevai.improveCode',
            title: 'Improve this code',
            arguments: [code]
        };
        actions.push(improveAction);
        
        // Add "Generate tests" action
        const testAction = new vscode.CodeAction('Generate tests', vscode.CodeActionKind.QuickFix);
        testAction.command = {
            command: 'gendevai.generateTests',
            title: 'Generate tests',
            arguments: [code]
        };
        actions.push(testAction);
        
        // TODO: Add more context-aware actions based on code analysis
        
        return actions;
    }
    
    /**
     * Provide hover information with AI insights
     */
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        // Get the symbol at the current position
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        
        const word = document.getText(wordRange);
        if (!word || word.length < 2) {
            return null;
        }
        
        // Get a bit more context around the word
        const lineText = document.lineAt(position.line).text;
        
        // Try to determine what kind of symbol this is based on context
        const symbolType = this.inferSymbolType(lineText, word, position.character);
        
        // For functions, we might want to analyze parameters, return types, etc.
        if (symbolType === 'function' || symbolType === 'method') {
            // Find the function definition (this is a simplified approach)
            const functionDefinition = this.findFunctionDefinition(document, word);
            
            if (functionDefinition) {
                try {
                    // Generate explanation for this function
                    const explanation = await this.apiClient.explainCode(functionDefinition);
                    
                    // Create markdown content for the hover
                    const content = new vscode.MarkdownString();
                    content.appendMarkdown(`**GenDevAI** 🤖\n\n`);
                    content.appendMarkdown(`${explanation}\n\n`);
                    content.appendMarkdown(`---\n`);
                    content.appendMarkdown(`[Explain in detail](command:gendevai.explainCode?${encodeURIComponent(JSON.stringify(functionDefinition))}) | `);
                    content.appendMarkdown(`[Improve this function](command:gendevai.improveCode?${encodeURIComponent(JSON.stringify(functionDefinition))})`);
                    
                    return new vscode.Hover(content);
                } catch (error) {
                    console.error('Error generating hover content:', error);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Provide inline code completions
     */
    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null> {
        // Check if we should provide completions
        if (!this.shouldProvideCompletions(document, position, context)) {
            return null;
        }
        
        // Get context before the current position
        const textBeforeCursor = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        
        try {
            // This would call the API to get completions based on the code context
            // For demonstration, we'll return a simple completion
            const completionText = '// GenDevAI would generate completions here\nfunction exampleCompletion() {\n  // Implementation\n}';
            
            return [
                new vscode.InlineCompletionItem(
                    completionText,
                    new vscode.Range(position, position)
                )
            ];
        } catch (error) {
            console.error('Error generating inline completions:', error);
            return null;
        }
    }
    
    /**
     * Infer the type of symbol based on context
     */
    private inferSymbolType(line: string, symbol: string, position: number): 'function' | 'method' | 'variable' | 'class' | 'unknown' {
        // This is a simplified approach - in a real implementation, this would use
        // language-specific parsing or the Language Server Protocol
        
        // Check for function/method calls
        if (line.slice(0, position).includes(`${symbol}(`)) {
            return 'function';
        }
        
        // Check for method calls
        if (line.slice(0, position).match(new RegExp(`\\.${symbol}\\s*\\(`))) {
            return 'method';
        }
        
        // Check for class usage
        if (line.includes(`new ${symbol}`)) {
            return 'class';
        }
        
        // Default to variable or unknown
        return 'variable';
    }
    
    /**
     * Find the definition of a function in the document
     */
    private findFunctionDefinition(document: vscode.TextDocument, functionName: string): string | null {
        // This is a simplified approach - in a real implementation, this would use
        // the Language Server Protocol or other language-specific tools
        
        const text = document.getText();
        const functionRegex = new RegExp(`(function\\s+${functionName}|${functionName}\\s*=\\s*function|const\\s+${functionName}\\s*=\\s*\\(|${functionName}\\s*\\()`, 'g');
        
        const match = functionRegex.exec(text);
        if (!match) {
            return null;
        }
        
        // Find the opening brace after the function name
        const startIndex = match.index;
        let openingBraceIndex = text.indexOf('{', startIndex);
        if (openingBraceIndex === -1) {
            return null;
        }
        
        // Track brace level to find the closing brace
        let braceLevel = 1;
        let endIndex = openingBraceIndex + 1;
        
        while (braceLevel > 0 && endIndex < text.length) {
            if (text[endIndex] === '{') {
                braceLevel++;
            } else if (text[endIndex] === '}') {
                braceLevel--;
            }
            endIndex++;
        }
        
        // Extract the full function definition
        return text.substring(startIndex, endIndex);
    }
    
    /**
     * Determine if we should provide completions in the current context
     */
    private shouldProvideCompletions(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext
    ): boolean {
        // Don't provide completions in comments or strings
        const lineText = document.lineAt(position.line).text;
        const textBeforeCursor = lineText.substring(0, position.character);
        
        // Simple check for comments
        if (textBeforeCursor.trimStart().startsWith('//') || textBeforeCursor.trimStart().startsWith('/*')) {
            return false;
        }
        
        // Skip if we're in the middle of a word
        const wordRange = document.getWordRangeAtPosition(position);
        if (wordRange && wordRange.start.character < position.character) {
            return false;
        }
        
        // Only provide completions after certain triggers
        const triggers = ['{', '(', '.', ' ', '\n'];
        const lastChar = textBeforeCursor.length > 0 ? textBeforeCursor[textBeforeCursor.length - 1] : '';
        
        return triggers.includes(lastChar);
    }
}
