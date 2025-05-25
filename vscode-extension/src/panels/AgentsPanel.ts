import * as vscode from 'vscode';

interface AgentConfig {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    type: string;
    settings: Record<string, any>;
}

export class AgentsPanel {
    private static readonly viewType = 'gendevai.agentsPanel';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _agents: AgentConfig[] = [
        {
            id: 'planner',
            name: 'Planning Agent',
            description: 'Plans and coordinates development tasks',
            isEnabled: true,
            type: 'planning',
            settings: {}
        },
        {
            id: 'coder',
            name: 'Coding Agent',
            description: 'Implements code based on specifications',
            isEnabled: true,
            type: 'coding',
            settings: {}
        },
        {
            id: 'reviewer',
            name: 'Review Agent',
            description: 'Reviews code changes and provides feedback',
            isEnabled: true,
            type: 'review',
            settings: {}
        }
    ];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'configureAgent':
                        this.updateAgentConfig(message.agentId, message.config);
                        break;
                    case 'toggleAgent':
                        this.toggleAgent(message.agentId);
                        break;
                    case 'loadAgents':
                        this.sendMessageToWebview('setAgents', { agents: this._agents });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private updateAgentConfig(agentId: string, config: Partial<AgentConfig>) {
        const agent = this._agents.find(a => a.id === agentId);
        if (agent) {
            Object.assign(agent, config);
            this.sendMessageToWebview('updateAgent', { agent });
        }
    }

    private toggleAgent(agentId: string) {
        const agent = this._agents.find(a => a.id === agentId);
        if (agent) {
            agent.isEnabled = !agent.isEnabled;
            this.sendMessageToWebview('updateAgent', { agent });
        }
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
            <title>GenDevAI Agents</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 10px; 
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                }
                #agents-container { 
                    display: grid; 
                    grid-template-columns: 250px 1fr; 
                    gap: 20px; 
                    height: 100vh;
                }
                .agent-list { 
                    border-right: 1px solid var(--vscode-widget-border);
                    overflow-y: auto;
                }
                .agent-item {
                    padding: 8px;
                    margin: 4px 0;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .agent-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                .agent-item.selected {
                    background: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                }
                .agent-item.disabled {
                    opacity: 0.5;
                }
                .agent-details {
                    padding: 10px;
                }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 4px;
                }
                .form-group input {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 4px 8px;
                    width: 100%;
                }
                button {
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div id="agents-container">
                <div class="agent-list" id="agent-list">
                    <!-- Agent list will be dynamically populated -->
                </div>
                <div class="agent-details" id="agent-details">
                    <!-- Agent details and configuration will be shown here -->
                </div>
            </div>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    const agentList = document.getElementById('agent-list');
                    const agentDetails = document.getElementById('agent-details');
                    let selectedAgent = null;

                    // Load agents
                    vscode.postMessage({ command: 'loadAgents' });

                    window.addEventListener('message', event => {
                        const { command, agents, agent } = event.data;

                        switch (command) {
                            case 'setAgents':
                                updateAgentsList(agents);
                                break;
                            case 'updateAgent':
                                updateAgent(agent);
                                break;
                        }
                    });

                    function updateAgentsList(agents) {
                        agentList.innerHTML = agents.map(agent => 
                            \`<div class="agent-item \${agent.isEnabled ? '' : 'disabled'}" 
                                 data-agent-id="\${agent.id}"
                                 onclick="selectAgent('\${agent.id}')">
                                <div>\${agent.name}</div>
                            </div>\`
                        ).join('')
                    }

                    function updateAgent(agent) {
                        const element = agentList.querySelector(\`[data-agent-id="\${agent.id}"]\`);
                        if (element) {
                            element.classList.toggle('disabled', !agent.isEnabled);
                        }
                        if (selectedAgent === agent.id) {
                            showAgentDetails(agent);
                        }
                    }

                    function selectAgent(agentId) {
                        selectedAgent = agentId;
                        const agent = agents.find(a => a.id === agentId);
                        if (agent) {
                            showAgentDetails(agent);
                        }
                    }

                    function showAgentDetails(agent) {
                        agentDetails.innerHTML = `
                            <h2>\${agent.name}</h2>
                            <p>\${agent.description}</p>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" 
                                           \${agent.isEnabled ? 'checked' : ''}
                                           onchange="toggleAgent('\${agent.id}')">
                                    Enabled
                                </label>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <input type="text" value="\${agent.type}" readonly>
                            </div>
                            <!-- Add more configuration options as needed -->
                        `;
                    }

                    window.toggleAgent = function(agentId) {
                        vscode.postMessage({
                            command: 'toggleAgent',
                            agentId
                        });
                    };
                }())
            </script>
        </body>
        </html>`;
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (AgentsPanel.currentPanel) {
            AgentsPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AgentsPanel.viewType,
            'GenDevAI Agents',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        AgentsPanel.currentPanel = new AgentsPanel(panel, extensionUri);
    }

    private static currentPanel: AgentsPanel | undefined;

    public dispose() {
        AgentsPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        this._panel.dispose();
    }
}
