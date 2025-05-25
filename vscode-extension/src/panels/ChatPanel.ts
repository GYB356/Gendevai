import * as vscode from 'vscode';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export class ChatPanel {
    private static readonly viewType = 'gendevai.chatPanel';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _messages: ChatMessage[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'sendMessage':
                        await this.handleUserMessage(message.text);
                        break;
                    case 'loadHistory':
                        this.sendMessageToWebview('setHistory', { messages: this._messages });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleUserMessage(text: string) {
        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        
        this._messages.push(userMessage);
        this.sendMessageToWebview('addMessage', { message: userMessage });

        // TODO: Process the message with AI core and get response
        const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: 'This is a placeholder response. AI core integration pending.',
            timestamp: Date.now()
        };

        this._messages.push(assistantMessage);
        this.sendMessageToWebview('addMessage', { message: assistantMessage });
    }

    private sendMessageToWebview(command: string, data: any) {
        this._panel.webview.postMessage({ command, ...data });
    }

    private _getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GenDevAI Chat</title>
            <style>
                body { margin: 0; padding: 10px; color: var(--vscode-foreground); }
                #chat-container { height: 100vh; display: flex; flex-direction: column; }
                #messages { flex-grow: 1; overflow-y: auto; margin-bottom: 10px; }
                #input-container { display: flex; gap: 10px; }
                #message-input { 
                    flex-grow: 1; 
                    min-height: 60px; 
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 8px;
                }
                #send-button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                #send-button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .message {
                    margin: 8px 0;
                    padding: 8px;
                    border-radius: 4px;
                }
                .message.user {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    margin-left: 20%;
                }
                .message.assistant {
                    background: var(--vscode-editor-selectionBackground);
                    margin-right: 20%;
                }
            </style>
        </head>
        <body>
            <div id="chat-container">
                <div id="messages"></div>
                <div id="input-container">
                    <textarea id="message-input" placeholder="Type your message..."></textarea>
                    <button id="send-button">Send</button>
                </div>
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const messagesContainer = document.getElementById('messages');

                    // Load message history
                    vscode.postMessage({ command: 'loadHistory' });

                    window.addEventListener('message', event => {
                        const { command, message, messages } = event.data;

                        switch (command) {
                            case 'addMessage':
                                addMessageToUI(message);
                                break;
                            case 'setHistory':
                                messages.forEach(msg => addMessageToUI(msg));
                                break;
                        }
                    });

                    function addMessageToUI(message) {
                        const div = document.createElement('div');
                        div.className = \`message \${message.role}\`;
                        div.textContent = message.content;
                        messagesContainer.appendChild(div);
                        div.scrollIntoView({ behavior: 'smooth' });
                    }

                    function sendMessage() {
                        const text = messageInput.value.trim();
                        if (text) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text
                            });
                            messageInput.value = '';
                        }
                    }

                    sendButton.addEventListener('click', sendMessage);
                    messageInput.addEventListener('keydown', e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                }())
            </script>
        </body>
        </html>`;
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            ChatPanel.viewType,
            'GenDevAI Chat',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri);
    }

    private static currentPanel: ChatPanel | undefined;

    public dispose() {
        ChatPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        this._panel.dispose();
    }
}
