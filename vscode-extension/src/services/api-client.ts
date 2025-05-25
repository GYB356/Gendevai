/**
 * API Client for connecting to the GenDevAI backend services
 */

import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { Opportunity } from '../models/opportunity';
import { Agent, AgentTask } from '../models/agent';
import { Skill } from '../models/skill';
import { Logger } from './EnhancedLogger';

// Enhanced error classes for better error handling
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public endpoint: string,
        public method: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class AuthenticationError extends ApiError {
    constructor(endpoint: string, method: string) {
        super('Authentication required', 401, endpoint, method);
        this.name = 'AuthenticationError';
    }
}

export class NetworkError extends ApiError {
    constructor(message: string, endpoint: string, method: string) {
        super(message, 0, endpoint, method);
        this.name = 'NetworkError';
    }
}

export interface ApiClientOptions {
    apiKey?: string;
    serverUrl?: string;
    context: vscode.ExtensionContext;
}

export class ApiClient {
    private apiKey?: string;
    private serverUrl: string;
    private context: vscode.ExtensionContext;
    private logger: Logger;
    private requestTimeout: number = 30000; // 30 seconds
    
    constructor(options: ApiClientOptions) {
        this.apiKey = options.apiKey;
        this.serverUrl = options.serverUrl || 'https://api.gendevai.com';
        this.context = options.context;
        this.logger = Logger.getInstance();
        
        this.logger.info('API Client initialized', {
            serverUrl: this.serverUrl,
            hasApiKey: !!this.apiKey
        });
    }
    
    /**
     * Update the API client configuration
     */
    updateConfig(options: Partial<ApiClientOptions>) {
        const oldConfig = { 
            apiKey: !!this.apiKey,
            serverUrl: this.serverUrl 
        };
        
        if (options.apiKey) {
            this.apiKey = options.apiKey;
        }
        if (options.serverUrl) {
            this.serverUrl = options.serverUrl;
        }
        
        this.logger.info('API Client configuration updated', {
            oldConfig,
            newConfig: {
                apiKey: !!this.apiKey,
                serverUrl: this.serverUrl
            }
        });
    }

    /**
     * Create a timeout wrapper for API requests
     */
    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Request timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            })
        ]);
    }
    
    /**
     * Make an authenticated request to the GenDevAI API with enhanced error handling and logging
     */
    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        const startTime = Date.now();
        
        if (!this.apiKey) {
            const error = new AuthenticationError(endpoint, method);
            this.logger.error('API request failed: No API key configured', error, {
                endpoint,
                method
            });
            throw error;
        }
        
        const url = `${this.serverUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': `GenDevAI-VSCode/${vscode.version}`
        };
        
        const options: any = {
            method,
            headers
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }

        this.logger.debug(`Making API request: ${method} ${endpoint}`, {
            url,
            hasBody: !!body,
            bodySize: body ? JSON.stringify(body).length : 0
        });
        
        try {
            const response = await this.withTimeout(
                fetch(url, options),
                this.requestTimeout
            );
            
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let errorDetails: any = {};
                
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        try {
                            errorDetails = JSON.parse(errorText);
                            errorMessage = errorDetails.message || errorDetails.error || errorMessage;
                        } catch {
                            errorDetails.rawError = errorText;
                        }
                    }
                } catch {
                    // Ignore error text parsing failures
                }
                
                const apiError = new ApiError(errorMessage, response.status, endpoint, method);
                
                this.logger.error('API request failed', apiError, {
                    endpoint,
                    method,
                    statusCode: response.status,
                    duration,
                    errorDetails
                });
                
                // Log API call for monitoring
                this.logger.logApiCall(method, endpoint, duration, false, {
                    statusCode: response.status,
                    errorDetails
                });
                
                throw apiError;
            }
            
            const result = await response.json() as T;
            
            // Log successful API call
            this.logger.logApiCall(method, endpoint, duration, true, {
                statusCode: response.status,
                responseSize: JSON.stringify(result).length
            });
            
            this.logger.debug(`API request completed successfully: ${method} ${endpoint}`, {
                statusCode: response.status,
                duration,
                responseSize: JSON.stringify(result).length
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Handle network errors
            const networkError = new NetworkError(
                error instanceof Error ? error.message : 'Unknown network error',
                endpoint,
                method
            );
            
            this.logger.error('Network error during API request', networkError, {
                endpoint,
                method,
                duration,
                originalError: error instanceof Error ? error.message : String(error)
            });
            
            // Log failed API call
            this.logger.logApiCall(method, endpoint, duration, false, {
                errorType: 'network',
                originalError: error instanceof Error ? error.message : String(error)
            });
            
            throw networkError;
        }
    }
    
    /**
     * Start a new GenDevAI session
     */
    async startSession(): Promise<{ sessionId: string }> {
        return this.request<{ sessionId: string }>('/api/sessions', 'POST', {
            clientInfo: {
                vscode: vscode.version,
                os: process.platform
            }
        });
    }
    
    /**
     * End an active session
     */
    async endSession(sessionId: string): Promise<void> {
        await this.request(`/api/sessions/${sessionId}`, 'DELETE');
    }
    
    /**
     * Ask a question to the AI
     */
    async askQuestion(question: string, context?: any): Promise<string> {
        const response = await this.request<{ answer: string }>('/api/chat', 'POST', {
            message: question,
            context
        });
        
        return response.answer;
    }
    
    /**
     * Generate an explanation for the provided code
     */
    async explainCode(code: string): Promise<string> {
        const response = await this.request<{ explanation: string }>('/api/code/explain', 'POST', {
            code
        });
        
        return response.explanation;
    }
    
    /**
     * Suggest improvements for the provided code
     */
    async improveCode(code: string): Promise<{ improved: string; explanation: string }> {
        return this.request<{ improved: string; explanation: string }>('/api/code/improve', 'POST', {
            code
        });
    }
    
    /**
     * Generate tests for the provided code
     */
    async generateTests(code: string): Promise<{ tests: string; explanation: string }> {
        return this.request<{ tests: string; explanation: string }>('/api/code/generate-tests', 'POST', {
            code
        });
    }
    
    /**
     * Analyze the workspace for improvement opportunities
     */
    async analyzeWorkspace(): Promise<Opportunity[]> {
        return this.request<Opportunity[]>('/api/analysis/opportunities', 'POST', {
            workspaceInfo: this.getWorkspaceInfo()
        });
    }
    
    /**
     * Start a multi-agent task
     */
    async startMultiAgentTask(taskDescription: string): Promise<{ taskId: string; agents: Agent[] }> {
        return this.request<{ taskId: string; agents: Agent[] }>('/api/agents/tasks', 'POST', {
            description: taskDescription,
            workspaceInfo: this.getWorkspaceInfo()
        });
    }
    
    /**
     * Get the status of a multi-agent task
     */
    async getTaskStatus(taskId: string): Promise<{ status: string; agents: Agent[]; progress: number }> {
        return this.request<{ status: string; agents: Agent[]; progress: number }>(`/api/agents/tasks/${taskId}`);
    }
    
    /**
     * Get the subtasks for a multi-agent task
     */
    async getTaskSubtasks(taskId: string): Promise<AgentTask[]> {
        return this.request<AgentTask[]>(`/api/agents/tasks/${taskId}/subtasks`);
    }
    
    /**
     * Get available AI skills
     */
    async getSkills(): Promise<Skill[]> {
        return this.request<Skill[]>('/api/skills');
    }
    
    /**
     * Execute an AI skill
     */
    async executeSkill(skillId: string, inputs: any): Promise<any> {
        return this.request<any>(`/api/skills/${skillId}/execute`, 'POST', {
            inputs,
            workspaceInfo: this.getWorkspaceInfo()
        });
    }
    
    /**
     * Analyze the project architecture
     */
    async analyzeArchitecture(): Promise<any> {
        return this.request<any>('/api/analysis/architecture', 'POST', {
            workspaceInfo: this.getWorkspaceInfo()
        });
    }
    
    /**
     * Get information about the current workspace
     */
    private getWorkspaceInfo(): any {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            return { type: 'no-workspace' };
        }
        
        return {
            type: 'workspace',
            folders: workspaceFolders.map(folder => ({
                name: folder.name,
                uri: folder.uri.toString()
            }))
        };
    }
}
