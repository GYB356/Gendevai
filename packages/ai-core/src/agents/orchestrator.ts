/**
 * Implements the multi-agent orchestration system for GenDevAI.
 * This module handles task delegation, agent coordination, and result synthesis.
 */

import { AgentSpecialization, AgentConfigMap } from './agent-types';
import { SkillExecutionResult } from '../ai-skill';
import { 
  AppError, 
  ValidationError, 
  ModelError,
  NetworkError,
  RetryableError,
  withRetry,
  withTimeout 
} from '../error-handling';
import { StructuredLogger } from '../logging';
import { ConfigManager } from '../config';
import { LLMClient } from '../client';

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
  private logger: StructuredLogger;
  private configManager: ConfigManager;

  constructor(llmClient: LLMClient, session: CollaborationSession, configManager?: ConfigManager) {
    this.llmClient = llmClient;
    this.session = session;
    this.configManager = configManager || ConfigManager.getInstance();
    this.logger = StructuredLogger.getInstance();

    this.logger.info('Orchestrator agent initialized', {
      sessionId: session.id,
      userId: session.userId,
      projectId: session.projectId,
      taskCount: session.tasks.length
    });
  }

  /**
   * Creates a new collaboration session for a complex task
   */
  static async createSession(
    llmClient: LLMClient,
    userId: string,
    projectId: string | undefined,
    initialContext: Record<string, any>,
    configManager?: ConfigManager
  ): Promise<OrchestratorAgent> {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('Valid userId is required');
    }

    if (!initialContext || typeof initialContext !== 'object') {
      throw new ValidationError('Valid initialContext is required');
    }

    const session: CollaborationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      projectId,
      tasks: [],
      status: 'active',
      context: initialContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new OrchestratorAgent(llmClient, session, configManager);
  }

  /**
   * Analyzes a user request and decomposes it into sub-tasks for specialized agents
   */
  async analyzeAndDecompose(userRequest: string): Promise<AgentTask[]> {
    if (!userRequest || typeof userRequest !== 'string' || userRequest.trim().length === 0) {
      throw new ValidationError('Valid userRequest is required');
    }

    const executionId = `decompose-${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Starting task decomposition', {
      executionId,
      userRequest: userRequest.substring(0, 100),
      sessionId: this.session.id
    });

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
      const apiTimeout = this.configManager.get('API_TIMEOUT');
      const maxRetries = this.configManager.get('API_RETRY_ATTEMPTS');

      const response = await withTimeout(
        withRetry(
          async () => {
            return await this.llmClient.generateCompletion({
              model: leadAgentConfig.defaultModel,
              messages: [
                { role: 'system', content: leadAgentConfig.systemPrompt },
                { role: 'user', content: decompositionPrompt }
              ],
              temperature: leadAgentConfig.temperature,
              max_tokens: 2000,
            });
          },
          {
            maxAttempts: maxRetries,
            shouldRetry: (error: Error) => error instanceof RetryableError
          }
        ),
        apiTimeout
      );

      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        throw new ModelError('Empty response from decomposition model');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        this.logger.error('Failed to parse decomposition response', {
          executionId,
          responseContent,
          parseError: parseError.message,
          sessionId: this.session.id
        });
        throw new ModelError('Invalid JSON response from decomposition model');
      }

      if (!parsedResponse.subtasks || !Array.isArray(parsedResponse.subtasks)) {
        throw new ModelError('Invalid response format: missing or invalid subtasks array');
      }
      
      // Create tasks from the parsed response
      const tasks: AgentTask[] = parsedResponse.subtasks.map((subtask: any, index: number) => {
        // Validate subtask structure
        if (!subtask.specialization || !subtask.description) {
          throw new ValidationError(`Invalid subtask at index ${index}: missing required fields`);
        }

        if (!Object.values(AgentSpecialization).includes(subtask.specialization)) {
          throw new ValidationError(`Invalid specialization: ${subtask.specialization}`);
        }

        return {
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
        };
      });

      // Add tasks to the session
      this.session.tasks.push(...tasks);
      this.session.updatedAt = new Date();

      const duration = Date.now() - startTime;
      this.logger.info('Task decomposition completed successfully', {
        executionId,
        taskCount: tasks.length,
        duration,
        sessionId: this.session.id
      });

      return tasks;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Task decomposition failed', {
        executionId,
        error: error.message,
        duration,
        sessionId: this.session.id
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new ModelError('Failed to decompose user request into subtasks', {
        originalError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Executes a task using the appropriate specialized agent
   */
  async executeTask(taskId: string): Promise<any> {
    if (!taskId || typeof taskId !== 'string') {
      throw new ValidationError('Valid taskId is required');
    }

    const task = this.session.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new ValidationError(`Task with ID ${taskId} not found`);
    }

    const executionId = `execute-${taskId}-${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Starting task execution', {
      executionId,
      taskId,
      specialization: task.specialization,
      sessionId: this.session.id
    });

    // Check if dependencies are completed
    const unfinishedDependencies = task.dependencies.filter(depId => {
      const depTask = this.session.tasks.find(t => t.id === depId);
      return !depTask || depTask.status !== 'completed';
    });

    if (unfinishedDependencies.length > 0) {
      throw new ValidationError(`Cannot execute task ${taskId}, dependencies not met: ${unfinishedDependencies.join(', ')}`);
    }

    // Update task status
    task.status = 'in-progress';
    task.updatedAt = new Date();

    try {
      const agentConfig = AgentConfigMap[task.specialization];
      if (!agentConfig) {
        throw new ValidationError(`No configuration found for agent specialization: ${task.specialization}`);
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

      const apiTimeout = this.configManager.get('API_TIMEOUT');
      const maxRetries = this.configManager.get('API_RETRY_ATTEMPTS');

      // Execute the task with the specialized agent
      const response = await withTimeout(
        withRetry(
          async () => {
            return await this.llmClient.generateCompletion({
              model: agentConfig.defaultModel,
              messages: [
                { role: 'system', content: agentConfig.systemPrompt },
                { role: 'user', content: promptWithContext }
              ],
              temperature: agentConfig.temperature,
              max_tokens: 2000,
            });
          },
          {
            maxAttempts: maxRetries,
            shouldRetry: (error: Error) => error instanceof RetryableError
          }
        ),
        apiTimeout
      );

      // Parse and store the result
      const result = response.choices[0].message.content;
      if (!result) {
        throw new ModelError('Empty response from task execution model');
      }

      task.result = result;
      task.status = 'completed';
      task.updatedAt = new Date();

      // Update shared blackboard with task result
      this.blackboard[taskId] = result;

      const duration = Date.now() - startTime;
      this.logger.info('Task execution completed successfully', {
        executionId,
        taskId,
        specialization: task.specialization,
        duration,
        sessionId: this.session.id
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      task.status = 'failed';
      task.updatedAt = new Date();

      this.logger.error('Task execution failed', {
        executionId,
        taskId,
        specialization: task.specialization,
        error: error instanceof Error ? error.message : String(error),
        duration,
        sessionId: this.session.id
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new ModelError(`Failed to execute task ${taskId}`, {
        originalError: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Executes all tasks in the session in dependency order
   */
  async executeAll(): Promise<SkillExecutionResult> {
    const executionId = `executeAll-${this.session.id}-${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Starting execution of all tasks', {
      executionId,
      totalTasks: this.session.tasks.length,
      sessionId: this.session.id
    });

    try {
      // Create a copy of tasks to avoid modification issues during iteration
      const tasks = [...this.session.tasks];
      
      if (tasks.length === 0) {
        throw new ValidationError('No tasks to execute in session');
      }
      
      // Track completed tasks to avoid re-execution
      const completedTaskIds = new Set<string>();
      
      // Execute until all tasks are completed or we can't make progress
      let progress = true;
      let iterations = 0;
      const maxIterations = tasks.length * 2; // Prevent infinite loops
      
      while (progress && iterations < maxIterations) {
        progress = false;
        iterations++;
        
        this.logger.debug('Execution iteration started', {
          executionId,
          iteration: iterations,
          completedTasks: completedTaskIds.size,
          totalTasks: tasks.length,
          sessionId: this.session.id
        });
        
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
            try {
              // Execute the task
              await this.executeTask(task.id);
              completedTaskIds.add(task.id);
              progress = true;
            } catch (error) {
              this.logger.error('Task execution failed during executeAll', {
                executionId,
                taskId: task.id,
                error: error.message,
                sessionId: this.session.id
              });
              throw error;
            }
          }
        }
      }
      
      if (iterations >= maxIterations) {
        throw new Error('Maximum execution iterations reached - possible circular dependencies');
      }
      
      // Check if all tasks are completed
      const allCompleted = tasks.every(task => 
        task.status === 'completed' || completedTaskIds.has(task.id)
      );
      
      if (!allCompleted) {
        const unfinishedTasks = tasks.filter(task => 
          task.status !== 'completed' && !completedTaskIds.has(task.id)
        );
        const unfinishedTaskInfo = unfinishedTasks.map(t => ({
          id: t.id,
          status: t.status,
          dependencies: t.dependencies
        }));
        
        this.logger.error('Not all tasks could be completed', {
          executionId,
          unfinishedTasks: unfinishedTaskInfo,
          sessionId: this.session.id
        });
        
        throw new Error(`Not all tasks could be completed. Unfinished tasks: ${unfinishedTasks.map(t => t.id).join(', ')}`);
      }
      
      // Synthesize results using the Lead Agent
      const finalResult = await this.synthesizeResults();
      this.session.result = finalResult;
      this.session.status = 'completed';
      this.session.updatedAt = new Date();
      
      const duration = Date.now() - startTime;
      this.logger.info('All tasks executed successfully', {
        executionId,
        taskCount: tasks.length,
        completedTaskCount: completedTaskIds.size,
        duration,
        sessionId: this.session.id
      });
      
      return {
        output: finalResult,
        metadata: {
          sessionId: this.session.id,
          taskCount: tasks.length,
          completedTaskCount: completedTaskIds.size,
          executionTime: duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.session.status = 'failed';
      this.session.updatedAt = new Date();
      
      this.logger.error('Execution of all tasks failed', {
        executionId,
        error: error instanceof Error ? error.message : String(error),
        duration,
        sessionId: this.session.id
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(`Failed to execute collaboration session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Synthesizes results from all completed tasks into a final result
   */
  private async synthesizeResults(): Promise<any> {
    const executionId = `synthesize-${this.session.id}-${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Starting result synthesis', {
      executionId,
      sessionId: this.session.id,
      completedTasks: this.session.tasks.filter(t => t.status === 'completed').length
    });

    const leadAgentConfig = AgentConfigMap[AgentSpecialization.LEAD];
    
    // Collect all task results
    const taskResults: Record<string, any> = {};
    const completedTasks = this.session.tasks.filter(t => t.status === 'completed');
    
    if (completedTasks.length === 0) {
      throw new ValidationError('No completed tasks to synthesize');
    }

    for (const task of completedTasks) {
      if (task.result) {
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
      const apiTimeout = this.configManager.get('API_TIMEOUT');
      const maxRetries = this.configManager.get('API_RETRY_ATTEMPTS');

      const response = await withTimeout(
        withRetry(
          async () => {
            return await this.llmClient.generateCompletion({
              model: leadAgentConfig.defaultModel,
              messages: [
                { role: 'system', content: leadAgentConfig.systemPrompt },
                { role: 'user', content: synthesisPrompt }
              ],
              temperature: leadAgentConfig.temperature,
              max_tokens: 2000,
            });
          },
          maxRetries,
          (attempt, error) => {
            this.logger.warn('Retrying result synthesis', {
              executionId,
              attempt,
              error: error.message,
              sessionId: this.session.id
            });
            return error instanceof RetryableError;
          }
        ),
        apiTimeout
      );
      
      const synthesizedResult = response.choices[0].message.content;
      if (!synthesizedResult) {
        throw new ModelError('Empty response from synthesis model');
      }

      const duration = Date.now() - startTime;
      this.logger.info('Result synthesis completed successfully', {
        executionId,
        duration,
        sessionId: this.session.id
      });

      return synthesizedResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Result synthesis failed', {
        executionId,
        error: error instanceof Error ? error.message : String(error),
        duration,
        sessionId: this.session.id
      });

      if (error instanceof AppError) {
        throw error;
      }
      throw new ModelError('Failed to synthesize results from specialized agents', {
        originalError: error instanceof Error ? error.message : String(error)
      });
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
  userRequest: string,
  configManager?: ConfigManager
): Promise<OrchestratorAgent> {
  if (!userRequest || typeof userRequest !== 'string' || userRequest.trim().length === 0) {
    throw new ValidationError('Valid userRequest is required');
  }

  const initialContext = {
    userRequest,
    timestamp: new Date().toISOString(),
  };
  
  const orchestrator = await OrchestratorAgent.createSession(
    llmClient,
    userId,
    projectId,
    initialContext,
    configManager
  );
  
  // Automatically decompose the task
  await orchestrator.analyzeAndDecompose(userRequest);
  
  return orchestrator;
}
