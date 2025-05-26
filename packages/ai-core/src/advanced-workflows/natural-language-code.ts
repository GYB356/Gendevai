/**
 * Natural Language to Code Generation Module
 * 
 * This module enables users to describe functionality in plain language
 * and generates functional code skeletons.
 */
import { AppError, ModelError, ValidationError, withRetry, withTimeout } from '../error-handling';
import { StructuredLogger } from '../logging';
import { AISkillService, SkillInput } from '../ai-skill';
import { ConfigManager } from '../config';
import { openai } from '../client';
import { MODELS } from '../models';

// Supported languages for code generation
export type SupportedLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'java' 
  | 'csharp' 
  | 'go' 
  | 'rust'
  | 'php'
  | 'ruby';

// Types of code generation
export type GenerationType = 
  | 'function' 
  | 'class' 
  | 'component' 
  | 'api' 
  | 'fullSystem'
  | 'test'
  | 'refactor';

// Configuration for code generation
export interface CodeGenerationConfig {
  language: SupportedLanguage;
  type: GenerationType;
  includeComments: boolean;
  includeDocs: boolean;
  includeTests: boolean;
  complexity: 'simple' | 'intermediate' | 'advanced';
  style?: {
    naming: 'camelCase' | 'snake_case' | 'PascalCase';
    indentation: 'spaces' | 'tabs';
    bracketStyle: 'sameLine' | 'newLine';
  };
  dependencies?: string[];
  frameworks?: string[];
  architecture?: string;
}

// Result of code generation
export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  explanation?: string;
  suggestedDependencies?: string[];
  projectStructure?: {
    files: Array<{
      path: string;
      purpose: string;
    }>;
  };
  error?: string;
  executionTimeMs: number;
}

/**
 * Service for generating code from natural language descriptions
 */
export class NaturalLanguageCodeService {
  private logger: StructuredLogger;
  private configManager: ConfigManager;
  private skillService: AISkillService;

  constructor() {
    this.logger = StructuredLogger.getInstance();
    this.configManager = new ConfigManager();
    this.skillService = new AISkillService();
    
    this.logger.info('Natural Language Code Service initialized');
  }

  /**
   * Generate code from a natural language description
   */
  async generateCode(
    description: string, 
    config: CodeGenerationConfig
  ): Promise<CodeGenerationResult> {
    const startTime = Date.now();
    const executionId = `nlcode_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.logger.info(`Starting code generation from natural language`, {
      descriptionLength: description.length,
      language: config.language,
      type: config.type
    });
    
    try {
      // Validate input
      if (!description || description.trim().length < 10) {
        throw new ValidationError('Description is too short or empty');
      }
      
      if (!this.isLanguageSupported(config.language)) {
        throw new ValidationError(`Language '${config.language}' is not supported`);
      }

      // Prepare the system prompt based on the configuration
      const systemPrompt = this.buildSystemPrompt(config);
      
      // Prepare the user prompt with the description
      const userPrompt = this.buildUserPrompt(description, config);
      
      // Get the model based on complexity
      const model = this.getModelForComplexity(config.complexity);
      
      // Request timeout
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
              temperature: 0.2, // Lower temperature for more deterministic code generation
              max_tokens: 4000,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0
            });
          },
          {
            maxAttempts: maxRetries,
            shouldRetry: (error) => {
              // Retry on network errors and certain API errors
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
      
      // Extract code and other information from the response
      const result = this.parseGeneratedResponse(response);
      
      const executionTime = Date.now() - startTime;
      this.logger.info(`Code generation completed successfully in ${executionTime}ms`);
      
      return {
        success: true,
        ...result,
        executionTimeMs: executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Code generation failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        executionTimeMs: executionTime
      };
    }
  }

  /**
   * Checks if the specified language is supported
   */
  private isLanguageSupported(language: string): language is SupportedLanguage {
    const supportedLanguages: SupportedLanguage[] = [
      'javascript', 'typescript', 'python', 'java', 
      'csharp', 'go', 'rust', 'php', 'ruby'
    ];
    return supportedLanguages.includes(language as SupportedLanguage);
  }

  /**
   * Builds the system prompt based on the configuration
   */
  private buildSystemPrompt(config: CodeGenerationConfig): string {
    const { language, type, includeComments, includeDocs, style } = config;
    
    let prompt = `You are an expert software developer specializing in ${language} development. 
Your task is to generate high-quality, production-ready ${language} code based on natural language descriptions.

Follow these guidelines:
- Write clean, efficient, and maintainable code
- Use modern best practices for ${language}`;

    if (includeComments) {
      prompt += '\n- Include helpful comments to explain complex logic';
    }
    
    if (includeDocs) {
      prompt += '\n- Add documentation comments that explain purpose, parameters, and return values';
    }
    
    if (style) {
      prompt += `\n- Use ${style.naming} for naming conventions`;
      prompt += `\n- Use ${style.indentation} for indentation`;
      prompt += `\n- Place brackets ${style.bracketStyle === 'sameLine' ? 'on the same line' : 'on a new line'}`;
    }
    
    if (config.frameworks && config.frameworks.length > 0) {
      prompt += `\n- Implement using the following frameworks/libraries: ${config.frameworks.join(', ')}`;
    }
    
    if (config.architecture) {
      prompt += `\n- Follow ${config.architecture} architecture principles`;
    }
    
    prompt += `\n\nYou are generating a ${type} in ${language}.`;
    
    return prompt;
  }

  /**
   * Builds the user prompt with the description and configuration
   */
  private buildUserPrompt(description: string, config: CodeGenerationConfig): string {
    let prompt = `Please generate ${config.language} code for the following requirement:\n\n${description}\n\n`;
    
    prompt += `Desired output:\n`;
    prompt += `- Language: ${config.language}\n`;
    prompt += `- Type: ${config.type}\n`;
    
    if (config.includeTests) {
      prompt += '- Please include unit tests for the code\n';
    }
    
    if (config.dependencies && config.dependencies.length > 0) {
      prompt += `- Use the following dependencies: ${config.dependencies.join(', ')}\n`;
    }
    
    prompt += `\nRespond in the following format:
\`\`\`json
{
  "explanation": "Brief explanation of the implementation approach",
  "code": "The generated code",
  "suggestedDependencies": ["any additional dependencies needed"],
  "projectStructure": {
    "files": [
      {"path": "path/to/file", "purpose": "brief purpose description"}
    ]
  }
}
\`\`\`

If the requirement is unclear or needs clarification, identify what's missing.`;
    
    return prompt;
  }

  /**
   * Gets the appropriate model based on complexity
   */
  private getModelForComplexity(complexity: 'simple' | 'intermediate' | 'advanced'): string {
    switch (complexity) {
      case 'simple':
        return MODELS.CHAT;
      case 'intermediate':
        return MODELS.COMPLETION;
      case 'advanced':
        return MODELS.ANALYSIS;
      default:
        return MODELS.COMPLETION;
    }
  }

  /**
   * Parses the generated response to extract code and other information
   */
  private parseGeneratedResponse(response: string): Partial<CodeGenerationResult> {
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      // Try to parse as JSON
      try {
        const result = JSON.parse(jsonString);
        return {
          code: result.code,
          explanation: result.explanation,
          suggestedDependencies: result.suggestedDependencies,
          projectStructure: result.projectStructure
        };
      } catch (e) {
        // If JSON parsing fails, try to extract code blocks
        const codeBlockMatch = response.match(/```[\w]*\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          return {
            code: codeBlockMatch[1],
            explanation: response.replace(/```[\w]*\s*[\s\S]*?\s*```/g, '').trim()
          };
        }
        
        // If no code blocks found, return the raw response
        return {
          code: response,
          explanation: 'Generated code without structured format'
        };
      }
    } catch (error) {
      this.logger.error(`Error parsing generated response: ${error instanceof Error ? error.message : String(error)}`);
      return {
        code: response,
        explanation: 'Error parsing structured response'
      };
    }
  }
}
