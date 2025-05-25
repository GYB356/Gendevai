/**
 * Common types used across the extension
 */

export interface Opportunity {
    id: string;
    title: string;
    description: string;
    type: 'improvement' | 'bug' | 'security' | 'performance';
    priority: 'low' | 'medium' | 'high';
    location?: {
        file: string;
        line: number;
    };
}

export interface Agent {
    id: string;
    name: string;
    status: 'idle' | 'working' | 'waiting';
    type: 'planner' | 'coder' | 'reviewer';
    currentTask?: AgentTask;
}

export interface AgentTask {
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    agent?: Agent;
    dependencies: string[];
    result?: any;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    category: 'code' | 'documentation' | 'analysis' | 'testing';
    inputs: {
        name: string;
        type: string;
        description: string;
        required: boolean;
    }[];
}
