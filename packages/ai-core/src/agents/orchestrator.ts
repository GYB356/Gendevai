/**
 * Implements the multi-agent orchestration system for GenDevAI.
 * This module handles task delegation, agent coordination, and result synthesis.
 */

import { AgentSpecialization, AgentConfigMap } from './agent-types';
import { LLMClient } from '../client';
import { SkillExecutionResult } from '../ai-skill';

/**
 * Represents a sub-task assigned to a specialized agent
 */
export interface AgentTask {
  id: string;
  specialization: AgentSpecialization;
  input: Record<string, any>;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  dependencies: string[]; // IDs of tasks that must be completed before this one
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a collaboration session with multiple agents working on a complex task
 */
export interface CollaborationSession {
  id: string;
  userId: string;
  projectId?: string;
  tasks: AgentTask[];
  status: 'active' | 'completed' | 'failed';
  result?: any;
  context: Record<string, any>; // Shared context accessible to all agents
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The OrchestratorAgent manages collaboration between specialized agents,
 * delegating tasks and synthesizing results.
 */
export class OrchestratorAgent {
  private llmClient: LLMClient;
  private session: CollaborationSession;
  private blackboard: Record<string, any> = {}; // Shared memory for agent communication

  constructor(llmClient: LLMClient, session: CollaborationSession) {
    this.llmClient = llmClient;
    this.session = session;
  }

  /**
   * Creates a new collaboration session for a complex task
   */
  static async createSession(
    llmClient: LLMClient,
    userId: string,
    projectId: string | undefined,
    initialContext: Record<string, any>
  ): Promise<OrchestratorAgent> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}`,
      userId,
      projectId,
      tasks: [],
      status: 'active',
      context: initialContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new OrchestratorAgent(llmClient, session);
  }

  /**
   * Analyzes a user request and decomposes it into sub-tasks for specialized agents
   */
  async analyzeAndDecompose(userRequest: string): Promise<AgentTask[]> {
    const leadAgentConfig = AgentConfigMap[AgentSpecialization.LEAD];
    
    // Use the Lead Agent to decompose the task
    const decompositionPrompt = `
      User Request: ${userRequest}
      
      Analyze this request and break it down into subtasks that can be assigned to specialized agents.
      For each subtask, specify:
      1. The agent specialization required (${Object.values(AgentSpecialization).join(', ')})
      2. A clear description of the subtask
      3. Required inputs for the subtask
      4. Dependencies on other subtasks (if any)
      
      Format your response as JSON with the following structure:
      {
        "subtasks": [
          {
            "specialization": "specialization_name",
            "description": "Detailed description of what needs to be done",
            "input": { "key1": "value1", ... },
            "dependencies": ["task_id_1", "task_id_2", ...]
          },
          ...
        ]
      }
    `;

    try {
      const response = await this.llmClient.generateCompletion({
        model: leadAgentConfig.defaultModel,
        messages: [
          { role: 'system', content: leadAgentConfig.systemPrompt },
          { role: 'user', content: decompositionPrompt }
        ],
        temperature: leadAgentConfig.temperature,
        max_tokens: 2000,
      });

      const responseContent = response.choices[0].message.content;
      const parsedResponse = JSON.parse(responseContent);
      
      // Create tasks from the parsed response
      const tasks: AgentTask[] = parsedResponse.subtasks.map((subtask: any, index: number) => ({
        id: `task-${Date.now()}-${index}`,
        specialization: subtask.specialization as AgentSpecialization,
        input: {
          ...subtask.input,
          description: subtask.description,
          userRequest
        },
        status: 'pending',
        dependencies: subtask.dependencies || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Add tasks to the session
      this.session.tasks.push(...tasks);
      this.session.updatedAt = new Date();

      return tasks;
    } catch (error) {
      console.error('Error in task decomposition:', error);
      throw new Error('Failed to decompose user request into subtasks');
    }
  }

  /**
   * Executes a task using the appropriate specialized agent
   */
  async executeTask(taskId: string): Promise<any> {
    const task = this.session.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // Check if dependencies are completed
    const unfinishedDependencies = task.dependencies.filter(depId => {
      const depTask = this.session.tasks.find(t => t.id === depId);
      return !depTask || depTask.status !== 'completed';
    });

    if (unfinishedDependencies.length > 0) {
      throw new Error(`Cannot execute task ${taskId}, dependencies not met: ${unfinishedDependencies.join(', ')}`);
    }

    // Update task status
    task.status = 'in-progress';
    task.updatedAt = new Date();

    try {
      const agentConfig = AgentConfigMap[task.specialization];
      if (!agentConfig) {
        throw new Error(`No configuration found for agent specialization: ${task.specialization}`);
      }

      // Gather context from completed dependency tasks
      const dependencyContext: Record<string, any> = {};
      for (const depId of task.dependencies) {
        const depTask = this.session.tasks.find(t => t.id === depId);
        if (depTask && depTask.status === 'completed' && depTask.result) {
          dependencyContext[depId] = depTask.result;
        }
      }

      // Prepare prompt with session context and dependency results
      const promptWithContext = `
        Task: ${task.input.description}
        
        Session Context:
        ${JSON.stringify(this.session.context, null, 2)}
        
        Dependency Results:
        ${JSON.stringify(dependencyContext, null, 2)}
        
        Additional Input:
        ${JSON.stringify(task.input, null, 2)}
        
        Please complete this task based on your specialization and the provided context.
      `;

      // Execute the task with the specialized agent
      const response = await this.llmClient.generateCompletion({
        model: agentConfig.defaultModel,
        messages: [
          { role: 'system', content: agentConfig.systemPrompt },
          { role: 'user', content: promptWithContext }
        ],
        temperature: agentConfig.temperature,
        max_tokens: 2000,
      });

      // Parse and store the result
      const result = response.choices[0].message.content;
      task.result = result;
      task.status = 'completed';
      task.updatedAt = new Date();

      // Update shared blackboard with task result
      this.blackboard[taskId] = result;

      return result;
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      task.status = 'failed';
      task.updatedAt = new Date();
      throw error;
    }
  }

  /**
   * Executes all tasks in the session in dependency order
   */
  async executeAll(): Promise<SkillExecutionResult> {
    try {
      // Create a copy of tasks to avoid modification issues during iteration
      const tasks = [...this.session.tasks];
      
      // Track completed tasks to avoid re-execution
      const completedTaskIds = new Set<string>();
      
      // Execute until all tasks are completed or we can't make progress
      let progress = true;
      while (progress) {
        progress = false;
        
        for (const task of tasks) {
          // Skip already completed or in-progress tasks
          if (task.status === 'completed' || task.status === 'in-progress' || completedTaskIds.has(task.id)) {
            continue;
          }
          
          // Check if all dependencies are met
          const allDependenciesMet = task.dependencies.every(depId => 
            completedTaskIds.has(depId)
          );
          
          if (allDependenciesMet) {
            // Execute the task
            await this.executeTask(task.id);
            completedTaskIds.add(task.id);
            progress = true;
          }
        }
      }
      
      // Check if all tasks are completed
      const allCompleted = tasks.every(task => 
        task.status === 'completed' || completedTaskIds.has(task.id)
      );
      
      if (!allCompleted) {
        const unfinishedTasks = tasks.filter(task => 
          task.status !== 'completed' && !completedTaskIds.has(task.id)
        );
        throw new Error(`Not all tasks could be completed. Unfinished tasks: ${unfinishedTasks.map(t => t.id).join(', ')}`);
      }
      
      // Synthesize results using the Lead Agent
      const finalResult = await this.synthesizeResults();
      this.session.result = finalResult;
      this.session.status = 'completed';
      this.session.updatedAt = new Date();
      
      return {
        output: finalResult,
        metadata: {
          sessionId: this.session.id,
          taskCount: tasks.length,
          completedTaskCount: completedTaskIds.size
        }
      };
    } catch (error) {
      console.error('Error executing collaboration session:', error);
      this.session.status = 'failed';
      this.session.updatedAt = new Date();
      
      throw error;
    }
  }

  /**
   * Synthesizes results from all completed tasks into a final result
   */
  private async synthesizeResults(): Promise<any> {
    const leadAgentConfig = AgentConfigMap[AgentSpecialization.LEAD];
    
    // Collect all task results
    const taskResults: Record<string, any> = {};
    for (const task of this.session.tasks) {
      if (task.status === 'completed' && task.result) {
        taskResults[task.id] = {
          specialization: task.specialization,
          description: task.input.description,
          result: task.result
        };
      }
    }
    
    // Use the Lead Agent to synthesize results
    const synthesisPrompt = `
      User Request: ${this.session.context.userRequest || 'No user request provided'}
      
      Task Results:
      ${JSON.stringify(taskResults, null, 2)}
      
      Please synthesize these results into a coherent final response that addresses the user's request.
      The response should be well-structured and comprehensive, incorporating the key insights and outputs
      from each specialized agent.
    `;
    
    try {
      const response = await this.llmClient.generateCompletion({
        model: leadAgentConfig.defaultModel,
        messages: [
          { role: 'system', content: leadAgentConfig.systemPrompt },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: leadAgentConfig.temperature,
        max_tokens: 2000,
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error synthesizing results:', error);
      throw new Error('Failed to synthesize results from specialized agents');
    }
  }

  /**
   * Returns the current state of the collaboration session
   */
  getSessionState(): CollaborationSession {
    return { ...this.session };
  }
}

/**
 * Specialized factory function to create an orchestrator agent for a specific use case
 */
export async function createMultiAgentSession(
  llmClient: LLMClient,
  userId: string,
  projectId: string | undefined,
  userRequest: string
): Promise<OrchestratorAgent> {
  const initialContext = {
    userRequest,
    timestamp: new Date().toISOString(),
  };
  
  const orchestrator = await OrchestratorAgent.createSession(
    llmClient,
    userId,
    projectId,
    initialContext
  );
  
  // Automatically decompose the task
  await orchestrator.analyzeAndDecompose(userRequest);
  
  return orchestrator;
}
