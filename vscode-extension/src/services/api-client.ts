/**
 * API Client for connecting to the GenDevAI backend services
 */

import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { Opportunity } from '../models/opportunity';
import { Agent, AgentTask } from '../models/agent';
import { Skill } from '../models/skill';

export interface ApiClientOptions {
    apiKey?: string;
    serverUrl?: string;
    context: vscode.ExtensionContext;
}

export class ApiClient {
    private apiKey?: string;
    private serverUrl: string;
    private context: vscode.ExtensionContext;
    
    constructor(options: ApiClientOptions) {
        this.apiKey = options.apiKey;
        this.serverUrl = options.serverUrl || 'https://api.gendevai.com';
        this.context = options.context;
    }
    
    /**
     * Update the API client configuration
     */
    updateConfig(options: Partial<ApiClientOptions>) {
        if (options.apiKey) {
            this.apiKey = options.apiKey;
        }
        if (options.serverUrl) {
            this.serverUrl = options.serverUrl;
        }
    }
    
    /**
     * Make an authenticated request to the GenDevAI API
     */
    private async request<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<T> {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }
        
        const url = `${this.serverUrl}${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
        
        const options: any = {
            method,
            headers
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            return await response.json() as T;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
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
