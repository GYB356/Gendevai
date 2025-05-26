// AI Workflow Execution Engine
import { AISkillService, SkillInput } from "./ai-skill";
import { 
  AppError, 
  ValidationError, 
  ModelError, 
  TimeoutError,
  RetryableError,
  withRetry,
  withTimeout 
} from './error-handling';
import { StructuredLogger } from './logging';
import { ConfigManager } from './config';
import { AnalyticsService } from './analytics';
import { NaturalLanguageCodeService, CodeGenerationConfig } from './advanced-workflows/natural-language-code';
import { AIDebuggingAssistant, ErrorContext } from './advanced-workflows/debugging-assistant';
import { PredictiveResourceOptimizer, OptimizationContext } from './advanced-workflows/resource-optimizer';
import { AnalyticsService } from './analytics';
import { generateCodeFromNaturalLanguage } from './advanced-workflows/natural-language-code';
import { analyzeCodeAndFixErrors } from './advanced-workflows/debugging-assistant';
import { optimizeCodeForResources } from './advanced-workflows/resource-optimizer';
import { AnalyticsService } from './analytics';

/**
 * Interface for a workflow node
 */
export interface WorkflowNode {
  id: string;
  type: "skill" | "condition" | "input" | "output" | "codeGen" | "debugAssist" | "resourceOpt";
  skillId?: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connections: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }[];
}

/**
 * Interface for a workflow
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

/**
 * Interface for a workflow execution event
 */
export interface WorkflowExecutionEvent {
  nodeId: string;
  timestamp: Date;
  status: "started" | "completed" | "failed";
  input?: any;
  output?: any;
  error?: string;
}

/**
 * Service for executing AI workflows
 */
export class WorkflowExecutionEngine {
  private skillService: AISkillService;
  private logger: StructuredLogger;
  private configManager: ConfigManager;
  private analyticsService: AnalyticsService;
  
  constructor(configManager?: ConfigManager) {
    this.configManager = configManager || new ConfigManager();
    this.skillService = new AISkillService();
    this.logger = StructuredLogger.getInstance();
    this.analyticsService = new AnalyticsService();

    this.logger.info('Workflow execution engine initialized');
  }

  /**
   * Validates a workflow before execution with comprehensive checks
   */
  private validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      if (!workflow || typeof workflow !== 'object') {
        errors.push('Workflow must be a valid object');
        return { valid: false, errors };
      }

      if (!workflow.id || typeof workflow.id !== 'string') {
        errors.push('Workflow must have a valid id');
      }

      if (!workflow.name || typeof workflow.name !== 'string') {
        errors.push('Workflow must have a valid name');
      }

      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        errors.push('Workflow must have a valid nodes array');
        return { valid: false, errors };
      }

      if (workflow.nodes.length === 0) {
        errors.push('Workflow must have at least one node');
        return { valid: false, errors };
      }
      
      // Check for required nodes
      const inputNodes = workflow.nodes.filter(node => node.type === "input");
      const outputNodes = workflow.nodes.filter(node => node.type === "output");
      
      if (inputNodes.length === 0) {
        errors.push("Workflow must have at least one input node");
      }
      
      if (outputNodes.length === 0) {
        errors.push("Workflow must have at least one output node");
      }

      // Validate individual nodes
      for (const node of workflow.nodes) {
        if (!node.id || typeof node.id !== 'string') {
          errors.push(`Node at position ${node.position?.x || 0},${node.position?.y || 0} must have a valid id`);
        }

        if (!['skill', 'condition', 'input', 'output', 'codeGen', 'debugAssist', 'resourceOpt'].includes(node.type)) {
          errors.push(`Node ${node.id} has invalid type: ${node.type}`);
        }

        if (node.type === 'skill' && (!node.skillId || typeof node.skillId !== 'string')) {
          errors.push(`Skill node ${node.id} must have a valid skillId`);
        }

        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          errors.push(`Node ${node.id} must have valid position coordinates`);
        }

        if (!node.config || typeof node.config !== 'object') {
          errors.push(`Node ${node.id} must have a valid config object`);
        }

        if (!Array.isArray(node.connections)) {
          errors.push(`Node ${node.id} must have a valid connections array`);
        }
      }

      // Check for circular dependencies
      const circularDependencyErrors = this.detectCircularDependencies(workflow);
      errors.push(...circularDependencyErrors);

      // Validate node connections
      for (const node of workflow.nodes) {
        for (const connection of node.connections) {
          const targetExists = workflow.nodes.some(n => n.id === connection.target);
          if (!targetExists) {
            errors.push(`Node ${node.id} has connection to non-existent target: ${connection.target}`);
          }
        }
      }

      this.logger.debug('Workflow validation completed', {
        workflowId: workflow.id,
        nodeCount: workflow.nodes.length,
        inputNodes: inputNodes.length,
        outputNodes: outputNodes.length,
        errorCount: errors.length,
        valid: errors.length === 0
      });

      return { valid: errors.length === 0, errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during workflow validation: ${errorMessage}`);
      
      return { valid: false, errors: [`Validation error: ${errorMessage}`] };
    }
  }

  /**
   * Detects circular dependencies in the workflow
   */
  private detectCircularDependencies(workflow: Workflow): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const visit = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        errors.push(`Circular dependency detected: ${path.join(' -> ')} -> ${nodeId}`);
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (node) {
        for (const connection of node.connections) {
          if (visit(connection.target, [...path, nodeId])) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id, []);
      }
    }

    return errors;
  }

  /**
   * Gets the execution order of nodes using topological sorting
   */
  private getExecutionOrder(workflow: Workflow): WorkflowNode[] {
    const nodes = [...workflow.nodes];
    const visited = new Set<string>();
    const result: WorkflowNode[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        return;
      }

      // Visit dependencies first
      const dependencies = workflow.nodes.flatMap(n =>
        n.connections.filter(conn => conn.target === nodeId).map(conn => conn.source)
      );

      for (const depId of dependencies) {
        visit(depId);
      }

      result.push(node);
    };

    // Start with input nodes
    const inputNodes = nodes.filter(node => node.type === "input");
    for (const inputNode of inputNodes) {
      visit(inputNode.id);
    }

    // Visit remaining nodes
    for (const node of nodes) {
      visit(node.id);
    }

    return result;
  }

  /**
   * Safely evaluates a condition expression with validation
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    if (!condition || typeof condition !== 'string') {
      this.logger.warn('Invalid condition provided', { condition });
      return false;
    }

    if (!context || typeof context !== 'object') {
      this.logger.warn('Invalid context provided for condition evaluation', { condition });
      return false;
    }

    try {
      // Basic safety check - only allow simple expressions
      const safeConditionPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\s*[><=!&|]+\s*[a-zA-Z0-9_$'".\s]*)*$/;
      if (!safeConditionPattern.test(condition.trim())) {
        this.logger.warn('Unsafe condition expression detected', { condition });
        return false;
      }

      // Check for potentially dangerous context keys
      const contextKeys = Object.keys(context);
      
      if (contextKeys.some(key => /[^a-zA-Z0-9_$]/.test(key))) {
        this.logger.warn('Unsafe context keys detected', { contextKeys });
        return false;
      }

      const contextValues = Object.values(context);

      // Create a safe evaluation function
      const fn = new Function(...contextKeys, `return ${condition};`);
      const result = fn(...contextValues);
      
      this.logger.debug('Condition evaluated', {
        condition,
        context: Object.keys(context),
        result: Boolean(result)
      });

      return Boolean(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error evaluating condition: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Executes a workflow with enhanced error handling and monitoring
   */
  async executeWorkflow(
    workflow: Workflow,
    initialInputs: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    output: any;
    events: WorkflowExecutionEvent[];
    error?: string;
  }> {
    const executionId = `workflow-${workflow.id}-${Date.now()}`;
    const startTime = Date.now();

    this.logger.info('Starting workflow execution', {
      executionId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodeCount: workflow.nodes.length,
      initialInputs: Object.keys(initialInputs)
    });

    try {
      // Validate workflow
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        const errorMessage = `Workflow validation failed: ${validation.errors.join(", ")}`;
        
        this.logger.error('Workflow validation failed', {
          executionId,
          workflowId: workflow.id,
          errors: validation.errors
        });

        throw new ValidationError(errorMessage, {
          workflowId: workflow.id,
          validationErrors: validation.errors
        });
      }

      const events: WorkflowExecutionEvent[] = [];
      const nodeOutputs: Record<string, any> = {};

      // Process input nodes first
      const inputNodes = workflow.nodes.filter(node => node.type === "input");
      for (const inputNode of inputNodes) {
        const inputName = inputNode.config.name || inputNode.id;
        const inputValue = initialInputs[inputName] || inputNode.config.defaultValue;
        nodeOutputs[inputNode.id] = inputValue;

        this.logger.debug('Input node processed', {
          executionId,
          nodeId: inputNode.id,
          inputName,
          hasValue: inputValue !== undefined
        });

        events.push({
          nodeId: inputNode.id,
          timestamp: new Date(),
          status: "completed",
          input: inputValue,
          output: inputValue
        });
      }

      // Get execution order and process remaining nodes
      const executionOrder = this.getExecutionOrder(workflow);
      const remainingNodes = executionOrder.filter(node =>
        !inputNodes.some(inputNode => inputNode.id === node.id)
      );

      for (const node of remainingNodes) {
        this.logger.debug('Processing node', {
          executionId,
          nodeId: node.id,
          nodeType: node.type
        });

        events.push({
          nodeId: node.id,
          timestamp: new Date(),
          status: "started"
        });

        try {
          // Collect inputs from connected nodes
          const incomingConnections = workflow.nodes.flatMap(n =>
            n.connections.filter(conn => conn.target === node.id)
          );

          const nodeInputs: Record<string, any> = {};
          for (const connection of incomingConnections) {
            if (nodeOutputs[connection.source] !== undefined) {
              nodeInputs[connection.sourceHandle || 'input'] = nodeOutputs[connection.source];
            }
          }

          if (node.type === "skill") {
            const nodeStartTime = Date.now();
            const apiTimeout = 30000; // Default timeout
            const maxRetries = 3; // Default retries

            // Execute the skill directly with the skillId
            const result = await withTimeout(
              withRetry(
                async () => {
                  return await this.skillService.executeSkill(
                    { id: node.skillId! } as any, // Simple workaround for type issue
                    nodeInputs as SkillInput
                  );
                },
                {
                  maxAttempts: maxRetries,
                  shouldRetry: (error) => error instanceof RetryableError
                }
              ),
              apiTimeout
            );

            const nodeDuration = Date.now() - nodeStartTime;

            if (result.success) {
              nodeOutputs[node.id] = result.output;
              
              this.logger.debug('Skill node executed successfully', {
                executionId,
                nodeId: node.id,
                skillId: node.skillId
              });
              
              // Track successful node execution
              this.analyticsService.trackNodeExecution({
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeId: node.id,
                nodeType: node.type,
                duration: nodeDuration,
                inputSize: JSON.stringify(nodeInputs).length,
                outputSize: JSON.stringify(result.output).length,
                success: true
              });
            } else {
              this.logger.error(`Skill node execution failed: ${result.error || 'Unknown error'}`);

              // Track failed node execution
              this.analyticsService.trackNodeExecution({
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeId: node.id,
                nodeType: node.type,
                duration: nodeDuration,
                inputSize: JSON.stringify(nodeInputs).length,
                success: false,
                error: result.error
              });

              throw new ModelError(`Skill execution failed: ${result.error}`, {
                nodeId: node.id,
                skillId: node.skillId
              });
            }

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: nodeInputs,
              output: result.output,
              error: result.error
            });

          } else if (node.type === "codeGen") {
            // Natural Language Code Generation Node
            const nodeStartTime = Date.now();
            const description = nodeInputs.description || node.config.defaultDescription;
            if (!description) {
              throw new ValidationError("Code generation requires a description");
            }

            const language = nodeInputs.language || node.config.language || "typescript";
            const framework = nodeInputs.framework || node.config.framework || "none";
            
            this.logger.debug('Starting code generation', {
              executionId,
              nodeId: node.id,
              language,
              framework
            });

            const result = await withTimeout(
              async () => {
                const prompt = `Generate ${language} code for: ${description}\nFramework/Libraries: ${framework}`;
                const response = await this.skillService.executeSkill(
                  { id: "code-generator" } as any,
                  { prompt, language, framework } as SkillInput
                );
                return response;
              },
              apiTimeout
            );

            const nodeDuration = Date.now() - nodeStartTime;

            if (result.success) {
              nodeOutputs[node.id] = {
                code: result.output,
                language,
                description
              };
              
              this.logger.debug('Code generation completed successfully', {
                executionId,
                nodeId: node.id,
                language,
                codeLength: result.output?.length || 0
              });
              
              // Track successful code generation
              this.analyticsService.trackNodeExecution({
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeId: node.id,
                nodeType: node.type,
                duration: nodeDuration,
                inputSize: description.length,
                outputSize: JSON.stringify(result.output).length,
                success: true,
                metrics: {
                  language,
                  framework,
                  codeLength: result.output?.length || 0
                }
              });
            } else {
              this.logger.error(`Code generation failed: ${result.error || 'Unknown error'}`);
              
              // Track failed code generation
              this.analyticsService.trackNodeExecution({
                workflowId: workflow.id,
                workflowName: workflow.name,
                executionId,
                nodeId: node.id,
                nodeType: node.type,
                duration: nodeDuration,
                inputSize: description.length,
                success: false,
                error: result.error,
                metrics: {
                  language,
                  framework
                }
              });
              
              throw new ModelError(`Code generation failed: ${result.error}`, {
                nodeId: node.id,
                language,
                framework
              });
            }

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: { description, language, framework },
              output: nodeOutputs[node.id]
            });
            
          } else if (node.type === "debugAssist") {
            // AI-Powered Debugging Assistant Node
            const code = nodeInputs.code || node.config.defaultCode;
            const error = nodeInputs.error || node.config.defaultError;
            
            if (!code) {
              throw new ValidationError("Debugging assistant requires code to analyze");
            }
            
            this.logger.debug('Starting debugging assistance', {
              executionId,
              nodeId: node.id,
              errorLength: error?.length || 0
            });

            const result = await withTimeout(
              async () => {
                return await this.skillService.executeSkill(
                  { id: "debug-assistant" } as any,
                  { 
                    code, 
                    error,
                    context: nodeInputs.context || {},
                    language: nodeInputs.language || node.config.language || "typescript"
                  } as SkillInput
                );
              },
              apiTimeout
            );

            if (result.success) {
              nodeOutputs[node.id] = {
                fix: result.output.fix,
                explanation: result.output.explanation,
                rootCause: result.output.rootCause
              };
              
              this.logger.debug('Debugging assistance completed successfully', {
                executionId,
                nodeId: node.id,
                fixFound: !!result.output.fix
              });
            } else {
              this.logger.error(`Debugging assistance failed: ${result.error || 'Unknown error'}`);
              throw new ModelError(`Debugging assistance failed: ${result.error}`, {
                nodeId: node.id
              });
            }

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: { code, error },
              output: nodeOutputs[node.id]
            });
            
          } else if (node.type === "resourceOpt") {
            // Predictive Resource Optimization Node
            const code = nodeInputs.code || node.config.defaultCode;
            const context = nodeInputs.context || node.config.defaultContext || {};
            
            if (!code) {
              throw new ValidationError("Resource optimization requires code to analyze");
            }
            
            this.logger.debug('Starting resource optimization analysis', {
              executionId,
              nodeId: node.id,
              codeLength: code.length
            });

            const result = await withTimeout(
              async () => {
                return await this.skillService.executeSkill(
                  { id: "resource-optimizer" } as any,
                  { 
                    code, 
                    context,
                    targetMetrics: nodeInputs.targetMetrics || node.config.targetMetrics || ["memory", "cpu"],
                    language: nodeInputs.language || node.config.language || "typescript"
                  } as SkillInput
                );
              },
              apiTimeout
            );

            if (result.success) {
              nodeOutputs[node.id] = {
                optimizations: result.output.optimizations,
                predictedImprovements: result.output.predictedImprovements,
                recommendations: result.output.recommendations
              };
              
              this.logger.debug('Resource optimization completed successfully', {
                executionId,
                nodeId: node.id,
                optimizationsCount: result.output.optimizations?.length || 0
              });
            } else {
              this.logger.error(`Resource optimization failed: ${result.error || 'Unknown error'}`);
              throw new ModelError(`Resource optimization failed: ${result.error}`, {
                nodeId: node.id
              });
            }

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: { code, context },
              output: nodeOutputs[node.id]
            });
            
          } else if (node.type === "condition") {
            const condition = node.config.condition;
            const conditionValue = this.evaluateCondition(condition, nodeInputs);
            nodeOutputs[node.id] = conditionValue;

            this.logger.debug('Condition node evaluated', {
              executionId,
              nodeId: node.id,
              condition,
              result: conditionValue
            });

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: nodeInputs,
              output: conditionValue
            });

          } else if (node.type === "output") {
            const outputName = node.config.name || "output";
            nodeOutputs[node.id] = nodeInputs;

            this.logger.debug('Output node processed', {
              executionId,
              nodeId: node.id,
              outputName
            });

            events.push({
              nodeId: node.id,
              timestamp: new Date(),
              status: "completed",
              input: nodeInputs,
              output: nodeOutputs[node.id]
            });
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          this.logger.error(`Node execution failed: ${errorMessage}`);

          events.push({
            nodeId: node.id,
            timestamp: new Date(),
            status: "failed",
            error: errorMessage
          });

          throw error;
        }
      }

      // Collect final outputs
      const outputNodes = workflow.nodes.filter(node => node.type === "output");
      const finalOutput = outputNodes.reduce((acc, node) => {
        const outputName = node.config.name || node.id;
        acc[outputName] = nodeOutputs[node.id];
        return acc;
      }, {} as Record<string, any>);

      const duration = Date.now() - startTime;
      
      this.logger.info(`Workflow execution completed successfully in ${duration}ms`);

      // Track successful workflow execution in analytics
      this.analyticsService.trackWorkflowExecution({
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionId,
        duration,
        nodeExecutions: events
          .filter(event => event.status === 'completed')
          .map(event => {
            const node = workflow.nodes.find(n => n.id === event.nodeId);
            return {
              nodeId: event.nodeId,
              nodeType: node?.type || 'unknown',
              duration: 0, // Duration not tracked at node level in this version
              success: true
            };
          }),
        success: true
      });

      return {
        success: true,
        output: finalOutput,
        events
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Workflow execution failed: ${errorMessage}`);

      // Track failed workflow execution in analytics
      this.analyticsService.trackWorkflowExecution({
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionId,
        duration,
        nodeExecutions: events
          .map(event => {
            const node = workflow.nodes.find(n => n.id === event.nodeId);
            return {
              nodeId: event.nodeId,
              nodeType: node?.type || 'unknown',
              duration: 0,
              success: event.status === 'completed'
            };
          }),
        success: false,
        error: errorMessage
      });

      return {
        success: false,
        output: null,
        events: [],
        error: errorMessage
      };
    }
  }
}
