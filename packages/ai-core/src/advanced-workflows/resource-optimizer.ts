/**
 * Predictive Resource Optimization
 * 
 * This module predicts resource bottlenecks (CPU/GPU usage, memory leaks)
 * during development and suggests optimizations.
 */
import { AppError, ModelError, ValidationError, withRetry, withTimeout } from '../error-handling';
import { StructuredLogger } from '../logging';
import { ConfigManager } from '../config';
import { openai } from '../client';
import { MODELS } from '../models';

// Types of resources to monitor and optimize
export type ResourceType = 
  | 'cpu'
  | 'memory'
  | 'gpu'
  | 'network'
  | 'disk'
  | 'database'
  | 'serverless'
  | 'container';

// Types of applications for context-aware optimization
export type ApplicationType =
  | 'web'
  | 'mobile'
  | 'desktop'
  | 'ml'
  | 'gaming'
  | 'iot'
  | 'microservice'
  | 'serverless'
  | 'database';

// Levels of optimization to apply
export type OptimizationLevel =
  | 'minimal'    // Basic optimizations with minimal code changes
  | 'moderate'   // Balanced approach with some architectural changes
  | 'aggressive' // Maximum performance with significant refactoring
  | 'critical';  // For production emergencies

// Code context for optimization analysis
export interface OptimizationContext {
  codeSnippet: string;
  language: string;
  resourceTypes?: ResourceType[];
  applicationType?: ApplicationType;
  performanceMetrics?: {
    cpuUsage?: number;         // Percentage (0-100)
    memoryUsage?: number;      // In MB
    memoryLeakRate?: number;   // MB/hour
    responseTime?: number;     // In ms
    throughput?: number;       // Requests/second
    gpuUtilization?: number;   // Percentage (0-100)
  };
  environmentInfo?: {
    cpuCores?: number;
    totalMemory?: number;      // In MB
    operatingSystem?: string;
    runtime?: string;
    serverless?: boolean;
  };
  dependencies?: Record<string, string>;
  optimizationLevel?: OptimizationLevel;
  additionalContext?: string;
}

// Results of the optimization analysis
export interface OptimizationResult {
  success: boolean;
  bottlenecks: Array<{
    resourceType: ResourceType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
  }>;
  optimizationSuggestions: Array<{
    description: string;
    codeChanges?: string;
    expectedImprovement: string;
    effort: 'low' | 'medium' | 'high';
    priority: 'low' | 'medium' | 'high';
  }>;
  architecturalRecommendations?: string[];
  alternativeTechnologies?: Array<{
    name: string;
    description: string;
    advantagesOverCurrent: string[];
  }>;
  executionTimeMs: number;
  error?: string;
}

/**
 * Service for predicting and optimizing resource usage
 */
export class PredictiveResourceOptimizer {
  private logger: StructuredLogger;
  private configManager: ConfigManager;

  constructor() {
    this.logger = StructuredLogger.getInstance();
    this.configManager = new ConfigManager();
    
    this.logger.info('Predictive Resource Optimizer initialized');
  }

  /**
   * Analyze code for potential resource bottlenecks and suggest optimizations
   */
  async analyzeResourceUsage(
    context: OptimizationContext
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const executionId = `optimize_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.logger.info(`Starting resource optimization analysis`, {
      language: context.language,
      applicationType: context.applicationType || 'unknown',
      optimizationLevel: context.optimizationLevel || 'moderate'
    });
    
    try {
      // Validate input
      if (!context.codeSnippet || context.codeSnippet.trim().length === 0) {
        throw new ValidationError('Code snippet is required for optimization analysis');
      }
      
      if (!context.language) {
        throw new ValidationError('Programming language must be specified');
      }
      
      // Prepare the system prompt
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare the user prompt with the code and context
      const userPrompt = this.buildUserPrompt(context);
      
      // Get the appropriate model
      const model = MODELS.ANALYSIS; // Use the most powerful model for analysis
      
      // Request timeout and retries
      const timeout = parseInt(this.configManager.get('API_TIMEOUT') || '60000', 10);
      const maxRetries = parseInt(this.configManager.get('API_RETRY_ATTEMPTS') || '3', 10);

      // Make the API call with retry and timeout handling
      const completion = await withTimeout(
        withRetry(
          async () => {
            return await openai.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.2,
              max_tokens: 3000,
              top_p: 1,
              response_format: { type: 'json_object' }
            });
          },
          {
            maxAttempts: maxRetries,
            shouldRetry: (error) => {
              return error.message.includes('timeout') ||
                     error.message.includes('network') ||
                     error.message.includes('rate limit');
            }
          }
        ),
        timeout
      );

      if (!completion.choices || completion.choices.length === 0) {
        throw new ModelError('No completion choices returned from model');
      }
      
      const response = completion.choices[0].message.content;
      
      if (!response) {
        throw new ModelError('Empty response from model');
      }
      
      // Parse the response
      const result = this.parseOptimizationResponse(response);
      
      const executionTime = Date.now() - startTime;
      this.logger.info(`Resource optimization analysis completed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        ...result,
        executionTimeMs: executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Resource optimization analysis failed: ${errorMessage}`);
      
      return {
        success: false,
        bottlenecks: [],
        optimizationSuggestions: [],
        error: errorMessage,
        executionTimeMs: executionTime
      };
    }
  }

  /**
   * Builds the system prompt based on the optimization context
   */
  private buildSystemPrompt(context: OptimizationContext): string {
    const { language, applicationType, optimizationLevel } = context;
    
    let prompt = `You are an expert software performance engineer specializing in ${language} optimization.
Your task is to analyze code for potential resource bottlenecks and suggest specific optimizations.

Focus on identifying:
1. CPU usage inefficiencies (algorithms, loops, computations)
2. Memory problems (leaks, excessive allocations, garbage collection issues)
3. I/O and network bottlenecks
4. Concurrency and parallelism opportunities
5. Database and query optimization
6. Framework-specific optimizations`;

    if (applicationType) {
      prompt += `\n\nThis is a ${applicationType} application, so focus on the typical bottlenecks for this type of application.`;
    }

    if (optimizationLevel) {
      prompt += `\n\nThe desired optimization level is '${optimizationLevel}'. `;
      
      switch (optimizationLevel) {
        case 'minimal':
          prompt += 'Suggest only simple changes with minimal risk.';
          break;
        case 'moderate':
          prompt += 'Balance performance improvements with implementation effort.';
          break;
        case 'aggressive':
          prompt += 'Prioritize maximum performance even if it requires significant refactoring.';
          break;
        case 'critical':
          prompt += 'This is a production emergency - focus on immediate solutions for critical issues.';
          break;
      }
    }

    prompt += `\n\nRespond with a JSON object that contains:
- bottlenecks: An array of identified resource bottlenecks, their severity, and impact
- optimizationSuggestions: Specific code changes or improvements with expected impact
- architecturalRecommendations: Any higher-level architectural changes that could improve performance
- alternativeTechnologies: Suggestions for alternative frameworks or libraries that might perform better`;

    return prompt;
  }

  /**
   * Builds the user prompt with the code and context
   */
  private buildUserPrompt(context: OptimizationContext): string {
    let prompt = `Please analyze the following ${context.language} code for resource bottlenecks and optimization opportunities:\n\n`;
    
    prompt += `CODE:\n\`\`\`${context.language}\n${context.codeSnippet}\n\`\`\`\n\n`;
    
    if (context.resourceTypes && context.resourceTypes.length > 0) {
      prompt += `FOCUS ON THESE RESOURCES: ${context.resourceTypes.join(', ')}\n\n`;
    }
    
    if (context.performanceMetrics) {
      prompt += `CURRENT PERFORMANCE METRICS:\n`;
      
      if (context.performanceMetrics.cpuUsage !== undefined) {
        prompt += `- CPU Usage: ${context.performanceMetrics.cpuUsage}%\n`;
      }
      
      if (context.performanceMetrics.memoryUsage !== undefined) {
        prompt += `- Memory Usage: ${context.performanceMetrics.memoryUsage} MB\n`;
      }
      
      if (context.performanceMetrics.memoryLeakRate !== undefined) {
        prompt += `- Memory Leak Rate: ${context.performanceMetrics.memoryLeakRate} MB/hour\n`;
      }
      
      if (context.performanceMetrics.responseTime !== undefined) {
        prompt += `- Response Time: ${context.performanceMetrics.responseTime} ms\n`;
      }
      
      if (context.performanceMetrics.throughput !== undefined) {
        prompt += `- Throughput: ${context.performanceMetrics.throughput} requests/second\n`;
      }
      
      if (context.performanceMetrics.gpuUtilization !== undefined) {
        prompt += `- GPU Utilization: ${context.performanceMetrics.gpuUtilization}%\n`;
      }
      
      prompt += '\n';
    }
    
    if (context.environmentInfo) {
      prompt += `ENVIRONMENT INFORMATION:\n`;
      
      if (context.environmentInfo.cpuCores !== undefined) {
        prompt += `- CPU Cores: ${context.environmentInfo.cpuCores}\n`;
      }
      
      if (context.environmentInfo.totalMemory !== undefined) {
        prompt += `- Total Memory: ${context.environmentInfo.totalMemory} MB\n`;
      }
      
      if (context.environmentInfo.operatingSystem) {
        prompt += `- Operating System: ${context.environmentInfo.operatingSystem}\n`;
      }
      
      if (context.environmentInfo.runtime) {
        prompt += `- Runtime: ${context.environmentInfo.runtime}\n`;
      }
      
      if (context.environmentInfo.serverless !== undefined) {
        prompt += `- Serverless Environment: ${context.environmentInfo.serverless ? 'Yes' : 'No'}\n`;
      }
      
      prompt += '\n';
    }
    
    if (context.dependencies && Object.keys(context.dependencies).length > 0) {
      prompt += `DEPENDENCIES:\n`;
      
      for (const [dep, version] of Object.entries(context.dependencies)) {
        prompt += `- ${dep}: ${version}\n`;
      }
      
      prompt += '\n';
    }
    
    if (context.additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${context.additionalContext}\n\n`;
    }
    
    prompt += `Please provide detailed, specific optimization suggestions with code examples where possible.`;
    
    return prompt;
  }

  /**
   * Parses the optimization response
   */
  private parseOptimizationResponse(response: string): Partial<OptimizationResult> {
    try {
      const result = JSON.parse(response);
      
      return {
        bottlenecks: result.bottlenecks || [],
        optimizationSuggestions: result.optimizationSuggestions || [],
        architecturalRecommendations: result.architecturalRecommendations || [],
        alternativeTechnologies: result.alternativeTechnologies || []
      };
    } catch (error) {
      this.logger.error(`Error parsing optimization response: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to returning a basic result
      return {
        bottlenecks: [{
          resourceType: 'cpu',
          severity: 'medium',
          description: 'Could not parse structured response from the AI model',
          impact: 'Unknown'
        }],
        optimizationSuggestions: [{
          description: 'Error parsing AI response. Please review the code manually.',
          expectedImprovement: 'Unknown',
          effort: 'medium',
          priority: 'medium'
        }]
      };
    }
  }
  
  /**
   * Analyze a specific function or method for optimization
   */
  async analyzeFunction(
    code: string,
    language: string,
    functionName: string,
    applicationType: ApplicationType
  ): Promise<OptimizationResult> {
    return this.analyzeResourceUsage({
      codeSnippet: code,
      language,
      applicationType,
      additionalContext: `Focus on optimizing the function/method named "${functionName}"`
    });
  }
  
  /**
   * Analyze database queries and data access patterns
   */
  async analyzeDatabaseUsage(
    code: string,
    language: string,
    databaseType: string,
    queryExamples: string[]
  ): Promise<OptimizationResult> {
    const queryContext = queryExamples.map((q, i) => `Query ${i + 1}:\n${q}`).join('\n\n');
    
    return this.analyzeResourceUsage({
      codeSnippet: code,
      language,
      resourceTypes: ['database'],
      additionalContext: `Database Type: ${databaseType}\n\nExample Queries:\n${queryContext}`
    });
  }
}
