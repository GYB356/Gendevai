/**
 * AI-Powered Debugging Assistant
 * 
 * This module provides real-time error analysis and suggests fixes,
 * including context-aware solutions for API call issues, race conditions, etc.
 */
import { AppError, ModelError, ValidationError, withRetry, withTimeout } from '../error-handling';
import { StructuredLogger } from '../logging';
import { ConfigManager } from '../config';
import { openai } from '../client';
import { MODELS } from '../models';

// Types of errors that can be analyzed
export type ErrorType = 
  | 'syntax'
  | 'runtime'
  | 'logic'
  | 'api'
  | 'performance'
  | 'memory'
  | 'concurrency'
  | 'security'
  | 'typescript'
  | 'compilation'
  | 'unknown';

// Error context containing relevant information for analysis
export interface ErrorContext {
  errorMessage: string;
  errorType?: ErrorType;
  stackTrace?: string;
  codeSnippet?: string;
  language?: string;
  frameworksUsed?: string[];
  additionalContext?: string;
  environment?: {
    runtime?: string;
    osType?: string;
    dependencies?: Record<string, string>;
  };
  similarErrors?: string[];
}

// Result of error analysis
export interface ErrorAnalysisResult {
  success: boolean;
  errorType?: ErrorType;
  rootCause?: string;
  explanation?: string;
  suggestedFixes: Array<{
    description: string;
    codeSnippet?: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  relatedResources?: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
  preventionTips?: string[];
  executionTimeMs: number;
  error?: string;
}

/**
 * Service for analyzing and fixing errors with AI assistance
 */
export class AIDebuggingAssistant {
  private logger: StructuredLogger;
  private configManager: ConfigManager;

  constructor() {
    this.logger = StructuredLogger.getInstance();
    this.configManager = new ConfigManager();
    
    this.logger.info('AI Debugging Assistant initialized');
  }

  /**
   * Analyze an error and suggest fixes
   */
  async analyzeError(
    errorContext: ErrorContext
  ): Promise<ErrorAnalysisResult> {
    const startTime = Date.now();
    const executionId = `debug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.logger.info(`Starting error analysis`, {
      errorType: errorContext.errorType || 'unknown',
      errorMessageLength: errorContext.errorMessage.length
    });
    
    try {
      // Validate input
      if (!errorContext.errorMessage || errorContext.errorMessage.trim().length === 0) {
        throw new ValidationError('Error message is required');
      }
      
      // Prepare the system prompt
      const systemPrompt = this.buildSystemPrompt(errorContext);
      
      // Prepare the user prompt with the error details
      const userPrompt = this.buildUserPrompt(errorContext);
      
      // Get the appropriate model
      const model = MODELS.ANALYSIS; // Use the most powerful model for debugging
      
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
              temperature: 0.1, // Very low temperature for precise debugging
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
      const result = this.parseAnalysisResponse(response);
      
      const executionTime = Date.now() - startTime;
      this.logger.info(`Error analysis completed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        ...result,
        executionTimeMs: executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Error analysis failed: ${errorMessage}`);
      
      return {
        success: false,
        suggestedFixes: [],
        error: errorMessage,
        executionTimeMs: executionTime
      };
    }
  }

  /**
   * Builds the system prompt based on the error context
   */
  private buildSystemPrompt(errorContext: ErrorContext): string {
    const language = errorContext.language || 'unknown';
    
    let prompt = `You are an expert software debugger and troubleshooter with decades of experience in ${language} development.
Your task is to analyze error messages, stack traces, and code snippets to:
1. Identify the root cause of the error
2. Provide a clear explanation of why the error is occurring
3. Suggest specific, practical fixes with code examples
4. Offer prevention tips to avoid similar issues in the future

Focus on being precise, technical, and solution-oriented. Provide specific code fixes when possible, not just general advice.`;

    if (errorContext.frameworksUsed && errorContext.frameworksUsed.length > 0) {
      prompt += `\n\nThe code uses the following frameworks/libraries: ${errorContext.frameworksUsed.join(', ')}.`;
    }

    if (errorContext.environment) {
      prompt += `\n\nEnvironment information:`;
      if (errorContext.environment.runtime) {
        prompt += `\n- Runtime: ${errorContext.environment.runtime}`;
      }
      if (errorContext.environment.osType) {
        prompt += `\n- OS: ${errorContext.environment.osType}`;
      }
    }

    prompt += `\n\nRespond with a JSON object that contains:
- errorType: The categorization of the error
- rootCause: The underlying issue causing the error
- explanation: A detailed explanation of why the error is occurring
- suggestedFixes: An array of possible solutions with code snippets and confidence levels
- preventionTips: Advice to prevent similar issues in the future
- relatedResources: Links to documentation or discussions that might help resolve the issue`;

    return prompt;
  }

  /**
   * Builds the user prompt with the error details
   */
  private buildUserPrompt(errorContext: ErrorContext): string {
    let prompt = `Please analyze the following error:\n\n`;
    
    prompt += `ERROR MESSAGE:\n${errorContext.errorMessage}\n\n`;
    
    if (errorContext.errorType) {
      prompt += `ERROR TYPE: ${errorContext.errorType}\n\n`;
    }
    
    if (errorContext.stackTrace) {
      prompt += `STACK TRACE:\n${errorContext.stackTrace}\n\n`;
    }
    
    if (errorContext.codeSnippet) {
      prompt += `CODE SNIPPET:\n\`\`\`${errorContext.language || ''}\n${errorContext.codeSnippet}\n\`\`\`\n\n`;
    }
    
    if (errorContext.additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${errorContext.additionalContext}\n\n`;
    }
    
    if (errorContext.similarErrors && errorContext.similarErrors.length > 0) {
      prompt += `SIMILAR ERRORS ENCOUNTERED PREVIOUSLY:\n`;
      errorContext.similarErrors.forEach((err, index) => {
        prompt += `${index + 1}. ${err}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Please provide a detailed analysis with specific fixes I can implement.`;
    
    return prompt;
  }

  /**
   * Parses the analysis response
   */
  private parseAnalysisResponse(response: string): Partial<ErrorAnalysisResult> {
    try {
      const result = JSON.parse(response);
      
      return {
        errorType: result.errorType as ErrorType,
        rootCause: result.rootCause,
        explanation: result.explanation,
        suggestedFixes: result.suggestedFixes || [],
        relatedResources: result.relatedResources || [],
        preventionTips: result.preventionTips || []
      };
    } catch (error) {
      this.logger.error(`Error parsing analysis response: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to returning the raw response
      return {
        explanation: response,
        suggestedFixes: [{
          description: 'Could not parse structured response from the AI model',
          confidence: 'low'
        }]
      };
    }
  }
  
  /**
   * Analyzes a compilation error and suggests fixes
   */
  async analyzeCompilationError(
    errorMessage: string,
    filePath: string,
    codeSnippet: string,
    language: string
  ): Promise<ErrorAnalysisResult> {
    return this.analyzeError({
      errorMessage,
      errorType: 'compilation',
      codeSnippet,
      language,
      additionalContext: `Error occurred in file: ${filePath}`
    });
  }
  
  /**
   * Analyzes a runtime error and suggests fixes
   */
  async analyzeRuntimeError(
    errorMessage: string,
    stackTrace: string,
    language: string,
    additionalContext?: string
  ): Promise<ErrorAnalysisResult> {
    return this.analyzeError({
      errorMessage,
      errorType: 'runtime',
      stackTrace,
      language,
      additionalContext
    });
  }
}
