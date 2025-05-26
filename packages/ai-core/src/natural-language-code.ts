/**
 * Natural Language Code Generation Service
 * Converts natural language descriptions into functional code
 */

import { openai } from "./client";
import { MODELS } from "./models";
import { AppError, ModelError, ValidationError, withRetry, withTimeout } from "./error-handling";
import { StructuredLogger } from "./logging";
import { ConfigManager } from "./config";
import { AGENT_PERSONAS } from "./personalization";

export interface CodeGenerationInput {
  description: string;
  language?: string;
  framework?: string;
  libraries?: string[];
  additionalContext?: string;
  testGeneration?: boolean;
  documentationLevel?: "minimal" | "standard" | "comprehensive";
}

export interface CodeGenerationResult {
  code: string;
  documentation?: string;
  tests?: string;
  explanation?: string;
  imports?: string[];
  setupInstructions?: string;
}

export interface DebugAssistanceInput {
  code: string;
  error?: string;
  language?: string;
  framework?: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

export interface DebugAssistanceResult {
  fix: string;
  explanation: string;
  rootCause: string;
  additionalRecommendations?: string[];
}

export interface ResourceOptimizationInput {
  code: string;
  language?: string;
  framework?: string;
  targetMetrics?: Array<"memory" | "cpu" | "network" | "storage" | "startup">;
  context?: Record<string, any>;
}

export interface ResourceOptimizationResult {
  optimizations: Array<{
    description: string;
    code: string;
    impactArea: string;
    estimatedImprovement: string;
  }>;
  predictedImprovements: Record<string, string>;
  recommendations: string[];
}

/**
 * Service for natural language code generation, debugging assistance,
 * and resource optimization
 */
export class NaturalLanguageCodeService {
  private logger = StructuredLogger.getInstance();
  private configManager = new ConfigManager();
  
  /**
   * Generate code from a natural language description
   */
  async generateCode(input: CodeGenerationInput): Promise<CodeGenerationResult> {
    const executionId = `code-gen-${Date.now()}`;
    this.logger.info('Starting code generation', { 
      executionId,
      language: input.language || 'typescript',
      framework: input.framework
    });
    
    try {
      // Validate input
      if (!input.description) {
        throw new ValidationError('Description is required for code generation');
      }
      
      const language = input.language || 'typescript';
      const framework = input.framework || 'none';
      const codeGenPersona = AGENT_PERSONAS.CODE_GENERATOR;
      
      // Build prompt with detailed instructions
      const prompt = this.buildCodeGenerationPrompt(input);
      
      // Generate code with GPT model
      const response = await withTimeout(
        withRetry(
          async () => {
            return await openai.chat.completions.create({
              model: MODELS.GPT4,
              messages: [
                {
                  role: 'system',
                  content: codeGenPersona.systemPrompt
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: codeGenPersona.temperatureRange[0],
              max_tokens: 4000
            });
          },
          {
            maxAttempts: 3,
            shouldRetry: error => {
              return error.message?.includes('timeout') || error.message?.includes('rate limit');
            }
          }
        ),
        60000
      );
      
      const generatedContent = response.choices[0].message.content;
      
      // Parse the generated content to extract code, documentation, and tests
      const result = this.parseGeneratedContent(generatedContent, input);
      
      this.logger.info('Code generation completed successfully', {
        executionId,
        language: input.language,
        codeLength: result.code.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Code generation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error instanceof AppError 
        ? error 
        : new ModelError('Failed to generate code', {
            description: input.description,
            language: input.language,
            originalError: error instanceof Error ? error.message : String(error)
          });
    }
  }
  
  /**
   * Analyze code and errors to provide debugging assistance
   */
  async debugCode(input: DebugAssistanceInput): Promise<DebugAssistanceResult> {
    const executionId = `debug-assist-${Date.now()}`;
    this.logger.info('Starting debugging assistance', { 
      executionId,
      language: input.language || 'typescript',
      hasError: !!input.error
    });
    
    try {
      // Validate input
      if (!input.code) {
        throw new ValidationError('Code is required for debugging assistance');
      }
      
      const language = input.language || 'typescript';
      const debugPersona = AGENT_PERSONAS.DEBUG_ASSISTANT;
      
      // Build prompt with detailed context
      const prompt = this.buildDebugAssistancePrompt(input);
      
      // Generate debugging assistance with GPT model
      const response = await withTimeout(
        withRetry(
          async () => {
            return await openai.chat.completions.create({
              model: MODELS.GPT4,
              messages: [
                {
                  role: 'system',
                  content: debugPersona.systemPrompt
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: debugPersona.temperatureRange[0],
              max_tokens: 2000
            });
          },
          {
            maxAttempts: 3,
            shouldRetry: error => {
              return error.message?.includes('timeout') || error.message?.includes('rate limit');
            }
          }
        ),
        30000
      );
      
      const generatedContent = response.choices[0].message.content;
      
      // Parse the generated content to extract fix, explanation, and root cause
      const result = this.parseDebugAssistanceContent(generatedContent);
      
      this.logger.info('Debugging assistance completed successfully', {
        executionId,
        language: input.language,
        fixLength: result.fix.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Debugging assistance failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error instanceof AppError 
        ? error 
        : new ModelError('Failed to provide debugging assistance', {
            language: input.language,
            hasError: !!input.error,
            originalError: error instanceof Error ? error.message : String(error)
          });
    }
  }
  
  /**
   * Analyze code to predict and optimize resource usage
   */
  async optimizeResources(input: ResourceOptimizationInput): Promise<ResourceOptimizationResult> {
    const executionId = `resource-opt-${Date.now()}`;
    this.logger.info('Starting resource optimization', { 
      executionId,
      language: input.language || 'typescript',
      targetMetrics: input.targetMetrics || ['memory', 'cpu']
    });
    
    try {
      // Validate input
      if (!input.code) {
        throw new ValidationError('Code is required for resource optimization');
      }
      
      const language = input.language || 'typescript';
      const optimizerPersona = AGENT_PERSONAS.RESOURCE_OPTIMIZER;
      
      // Build prompt with detailed metrics targets
      const prompt = this.buildResourceOptimizationPrompt(input);
      
      // Generate optimization suggestions with GPT model
      const response = await withTimeout(
        withRetry(
          async () => {
            return await openai.chat.completions.create({
              model: MODELS.GPT4,
              messages: [
                {
                  role: 'system',
                  content: optimizerPersona.systemPrompt
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: optimizerPersona.temperatureRange[0],
              max_tokens: 3000
            });
          },
          {
            maxAttempts: 3,
            shouldRetry: error => {
              return error.message?.includes('timeout') || error.message?.includes('rate limit');
            }
          }
        ),
        45000
      );
      
      const generatedContent = response.choices[0].message.content;
      
      // Parse the generated content to extract optimizations and recommendations
      const result = this.parseResourceOptimizationContent(generatedContent, input);
      
      this.logger.info('Resource optimization completed successfully', {
        executionId,
        language: input.language,
        optimizationsCount: result.optimizations.length
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Resource optimization failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error instanceof AppError 
        ? error 
        : new ModelError('Failed to optimize resources', {
            language: input.language,
            targetMetrics: input.targetMetrics,
            originalError: error instanceof Error ? error.message : String(error)
          });
    }
  }
  
  /**
   * Build a detailed prompt for code generation
   */
  private buildCodeGenerationPrompt(input: CodeGenerationInput): string {
    const { description, language = 'typescript', framework = 'none', libraries = [], additionalContext = '', testGeneration = false, documentationLevel = 'standard' } = input;
    
    let prompt = `Generate ${language} code for the following description:\n\n${description}\n\n`;
    
    // Add framework and libraries context
    if (framework && framework !== 'none') {
      prompt += `Framework: ${framework}\n`;
    }
    
    if (libraries.length > 0) {
      prompt += `Libraries/Dependencies: ${libraries.join(', ')}\n`;
    }
    
    // Add additional context
    if (additionalContext) {
      prompt += `\nAdditional Context:\n${additionalContext}\n`;
    }
    
    // Specify test generation requirements
    if (testGeneration) {
      prompt += `\nPlease include appropriate unit tests for the code.\n`;
    }
    
    // Specify documentation level
    prompt += `\nDocumentation Level: ${documentationLevel.charAt(0).toUpperCase() + documentationLevel.slice(1)}\n`;
    
    // Request specific output format
    prompt += `\nPlease structure your response as follows:
1. Brief explanation of the implementation approach
2. Main code implementation
3. Setup instructions (if applicable)
4. ${testGeneration ? 'Unit tests' : 'Usage examples'}

For code blocks, use markdown code block syntax with the appropriate language tag.`;
    
    return prompt;
  }
  
  /**
   * Build a detailed prompt for debugging assistance
   */
  private buildDebugAssistancePrompt(input: DebugAssistanceInput): string {
    const { code, error = '', language = 'typescript', framework = '', context = {}, stackTrace = '' } = input;
    
    let prompt = `Please analyze the following ${language} code and provide debugging assistance:\n\n`;
    prompt += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    if (error) {
      prompt += `Error Message:\n\`\`\`\n${error}\n\`\`\`\n\n`;
    }
    
    if (stackTrace) {
      prompt += `Stack Trace:\n\`\`\`\n${stackTrace}\n\`\`\`\n\n`;
    }
    
    if (framework) {
      prompt += `Framework: ${framework}\n`;
    }
    
    if (Object.keys(context).length > 0) {
      prompt += `\nAdditional Context:\n${JSON.stringify(context, null, 2)}\n`;
    }
    
    prompt += `\nPlease provide:
1. A clear identification of the root cause of the issue
2. A detailed explanation of what's causing the problem
3. The fixed code or code changes needed to resolve the issue
4. Any additional recommendations to prevent similar issues in the future

For code fixes, please include the complete fixed code or clear instructions on what to change.`;
    
    return prompt;
  }
  
  /**
   * Build a detailed prompt for resource optimization
   */
  private buildResourceOptimizationPrompt(input: ResourceOptimizationInput): string {
    const { code, language = 'typescript', framework = '', targetMetrics = ['memory', 'cpu'], context = {} } = input;
    
    let prompt = `Please analyze the following ${language} code for resource optimization opportunities:\n\n`;
    prompt += `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    prompt += `Target Optimization Metrics: ${targetMetrics.join(', ')}\n`;
    
    if (framework) {
      prompt += `Framework: ${framework}\n`;
    }
    
    if (Object.keys(context).length > 0) {
      prompt += `\nAdditional Context:\n${JSON.stringify(context, null, 2)}\n`;
    }
    
    prompt += `\nPlease provide:
1. Identification of potential resource bottlenecks or inefficiencies
2. Specific optimization suggestions with code examples
3. Predicted improvements for each optimization
4. Overall recommendations for better resource utilization

For each optimization, please provide:
- A description of the issue
- The optimized code
- The impact area (e.g., memory usage, CPU performance)
- Estimated improvement

Format your response as JSON for easy parsing, but include detailed explanations within the JSON structure.`;
    
    return prompt;
  }
  
  /**
   * Parse the generated content to extract code, documentation, and tests
   */
  private parseGeneratedContent(content: string, input: CodeGenerationInput): CodeGenerationResult {
    // Extract code blocks from markdown
    const codeBlockRegex = /```(?:[\w]+)?\s*([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    // Try to identify main code, tests, and documentation
    let mainCode = '';
    let tests = '';
    let documentation = '';
    let imports: string[] = [];
    let setupInstructions = '';
    
    if (codeBlocks.length === 1) {
      // Only one code block - assume it's the main code
      mainCode = codeBlocks[0];
    } else if (codeBlocks.length >= 2) {
      // Multiple code blocks - try to identify their purpose
      mainCode = codeBlocks[0];
      
      // Look for test-like content in other blocks
      for (let i = 1; i < codeBlocks.length; i++) {
        const block = codeBlocks[i];
        
        if (block.includes('test') || block.includes('assert') || block.includes('expect') || 
            block.includes('describe') || block.includes('it(') || block.includes('Test')) {
          tests = block;
        } else if (block.includes('npm install') || block.includes('yarn add') || 
                  block.includes('setup') || block.includes('installation')) {
          setupInstructions = block;
        } else {
          // If we haven't identified a special block type, consider it part of main code
          mainCode += '\n\n' + block;
        }
      }
    }
    
    // Extract documentation from non-code parts
    const sections = content.split('```');
    for (let i = 0; i < sections.length; i += 2) {
      // Only look at non-code sections (even indices)
      if (i < sections.length) {
        const section = sections[i].trim();
        if (section) {
          documentation += section + '\n\n';
        }
      }
    }
    
    // Extract imports
    const importRegex = /import\s+.*?from\s+['"].*?['"];?/g;
    const importMatches = mainCode.match(importRegex) || [];
    imports = importMatches.map(imp => imp.trim());
    
    return {
      code: mainCode,
      documentation: documentation.trim(),
      tests: tests || undefined,
      explanation: sections[0]?.trim() || undefined,
      imports: imports.length > 0 ? imports : undefined,
      setupInstructions: setupInstructions || undefined
    };
  }
  
  /**
   * Parse the generated content to extract debugging assistance details
   */
  private parseDebugAssistanceContent(content: string): DebugAssistanceResult {
    // Default structure in case parsing fails
    const result: DebugAssistanceResult = {
      fix: '',
      explanation: content,
      rootCause: '',
      additionalRecommendations: []
    };
    
    // Extract root cause
    const rootCauseRegex = /root cause|cause of the issue|issue is|problem is/i;
    const rootCauseSections = content.split(rootCauseRegex);
    if (rootCauseSections.length > 1) {
      const rootCauseSection = rootCauseSections[1].split('\n\n')[0].trim();
      result.rootCause = rootCauseSection;
    }
    
    // Extract code fix
    const codeBlockRegex = /```(?:[\w]+)?\s*([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    if (codeBlocks.length > 0) {
      result.fix = codeBlocks[0];
    }
    
    // Extract explanation
    const explanationRegex = /explanation|what's happening|why this happens|the issue is/i;
    const explanationSections = content.split(explanationRegex);
    if (explanationSections.length > 1) {
      const explanationSection = explanationSections[1].split('\n\n')[0].trim();
      result.explanation = explanationSection;
    }
    
    // Extract additional recommendations
    const recommendationsRegex = /recommendations|additional notes|prevent similar issues|future prevention/i;
    const recommendationsSections = content.split(recommendationsRegex);
    if (recommendationsSections.length > 1) {
      const recommendationsSection = recommendationsSections[1].trim();
      const recommendations = recommendationsSection
        .split(/\d+\.|\n-|\*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (recommendations.length > 0) {
        result.additionalRecommendations = recommendations;
      }
    }
    
    return result;
  }
  
  /**
   * Parse the generated content to extract resource optimization details
   */
  private parseResourceOptimizationContent(content: string, input: ResourceOptimizationInput): ResourceOptimizationResult {
    // Try to parse JSON response
    try {
      // Extract JSON from the response
      const jsonRegex = /{[\s\S]*}/;
      const jsonMatch = content.match(jsonRegex);
      
      if (jsonMatch) {
        const jsonContent = JSON.parse(jsonMatch[0]);
        
        if (jsonContent.optimizations && 
            jsonContent.predictedImprovements &&
            jsonContent.recommendations) {
          return jsonContent as ResourceOptimizationResult;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to parse JSON from resource optimization response: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with manual parsing if JSON parsing fails
    }
    
    // Default structure in case parsing fails
    const result: ResourceOptimizationResult = {
      optimizations: [],
      predictedImprovements: {},
      recommendations: []
    };
    
    // Extract code blocks for optimizations
    const codeBlockRegex = /```(?:[\w]+)?\s*([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    // Extract optimization sections
    const optimizationRegex = /optimization\s+\d+|issue\s+\d+|bottleneck\s+\d+/i;
    const optimizationSections = content.split(optimizationRegex).slice(1);
    
    for (let i = 0; i < optimizationSections.length && i < codeBlocks.length; i++) {
      const section = optimizationSections[i];
      const code = codeBlocks[i];
      
      // Extract impact area
      let impactArea = input.targetMetrics?.[0] || 'memory';
      const impactMatch = section.match(/impact area[:\s]+([\w\s]+)/i);
      if (impactMatch) {
        impactArea = impactMatch[1].trim();
      }
      
      // Extract estimated improvement
      let improvement = 'Unknown';
      const improvementMatch = section.match(/estimated improvement[:\s]+([\w\s%\.]+)/i);
      if (improvementMatch) {
        improvement = improvementMatch[1].trim();
      }
      
      // Extract description
      let description = section.split('\n')[0].trim();
      if (description.length < 10) {
        description = section.split('\n').slice(0, 2).join(' ').trim();
      }
      
      result.optimizations.push({
        description,
        code,
        impactArea,
        estimatedImprovement: improvement
      });
      
      // Add to predicted improvements
      result.predictedImprovements[impactArea] = improvement;
    }
    
    // Extract recommendations
    const recommendationsRegex = /recommendations|overall recommendations|additional recommendations/i;
    const recommendationsSections = content.split(recommendationsRegex);
    if (recommendationsSections.length > 1) {
      const recommendationsSection = recommendationsSections[1].trim();
      const recommendations = recommendationsSection
        .split(/\d+\.|\n-|\*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (recommendations.length > 0) {
        result.recommendations = recommendations;
      }
    }
    
    return result;
  }
}
