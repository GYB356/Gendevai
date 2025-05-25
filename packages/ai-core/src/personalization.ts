// AI Persona and Personalization Service
import { GenerationStatus } from "@gendevai/database";
import { openai } from "./client";
import { MODELS } from "./models";

// Interface for the user preferences
interface UserPreferences {
  codingStyle?: string;
  codeVerbosityLevel: number;
  preferredLanguages: string[];
  preferredFrameworks: string[];
  documentationLevel: number;
  securityFocusLevel: number;
  testCoveragePreference: number;
  defaultAgentPersona?: string;
}

// Interface for the agent persona
interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  strengths: string[];
  focusAreas: string[];
  temperatureRange: [number, number];
  skillTags: string[];
}

/**
 * Base class for AI agents with different personas
 */
export class PersonalizedAgent {
  private userPreferences?: UserPreferences;
  private persona?: AgentPersona;
  private taskContext?: Record<string, any>;
  private baseTemperature: number = 0.7;

  constructor(options?: {
    userPreferences?: UserPreferences;
    persona?: AgentPersona;
    taskContext?: Record<string, any>;
  }) {
    this.userPreferences = options?.userPreferences;
    this.persona = options?.persona;
    this.taskContext = options?.taskContext;
  }

  /**
   * Generates an optimal system prompt based on user preferences and the selected persona
   */
  private generateSystemPrompt(task: string): string {
    // Start with the base system prompt from the persona, or a default if none is provided
    let systemPrompt = this.persona?.systemPrompt || 
      "You are an expert software developer assistant that specializes in generating high-quality code.";
    
    // Add user preferences if available
    if (this.userPreferences) {
      // Add coding style preference
      if (this.userPreferences.codingStyle) {
        systemPrompt += `\n\nPreferred coding style: ${this.userPreferences.codingStyle}`;
      }
      
      // Add verbosity preference
      const verbosityMap = {
        1: "Be very concise and minimal in explanations.",
        2: "Be somewhat concise in explanations.",
        3: "Provide balanced explanations.",
        4: "Be somewhat detailed in explanations.",
        5: "Be very detailed and thorough in explanations."
      };
      
      systemPrompt += `\n\n${verbosityMap[this.userPreferences.codeVerbosityLevel as keyof typeof verbosityMap] || verbosityMap[3]}`;
      
      // Add documentation preference
      const documentationMap = {
        1: "Include minimal documentation.",
        2: "Include basic documentation for complex parts.",
        3: "Include standard documentation.",
        4: "Include detailed documentation.",
        5: "Include comprehensive documentation for all code."
      };
      
      systemPrompt += `\n\n${documentationMap[this.userPreferences.documentationLevel as keyof typeof documentationMap] || documentationMap[3]}`;
      
      // Add security focus
      if (this.userPreferences.securityFocusLevel >= 4) {
        systemPrompt += "\n\nPay special attention to security considerations and best practices.";
      }
      
      // Add test coverage preference
      if (this.userPreferences.testCoveragePreference >= 4) {
        systemPrompt += "\n\nInclude comprehensive test coverage for the code.";
      }
    }
    
    // Add task-specific guidance
    systemPrompt += `\n\nYour current task: ${task}`;
    
    return systemPrompt;
  }

  /**
   * Determines the optimal temperature for the given task and persona
   */
  private determineTemperature(): number {
    // Start with the base temperature
    let temperature = this.baseTemperature;
    
    // Adjust based on persona if available
    if (this.persona?.temperatureRange) {
      const [min, max] = this.persona.temperatureRange;
      temperature = (min + max) / 2; // Use the middle of the range as default
    }
    
    // Could further adjust based on task type, e.g.:
    // - Lower for security-critical tasks
    // - Higher for creative tasks
    
    return temperature;
  }

  /**
   * Executes a task using the personalized agent settings
   */
  async executeTask(
    task: string,
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
    }
  ) {
    try {
      const systemPrompt = this.generateSystemPrompt(task);
      const temperature = options?.temperature || this.determineTemperature();
      
      const completion = await openai.chat.completions.create({
        model: options?.model || MODELS.CODE,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature,
      });

      const result = completion.choices[0]?.message.content || "";
      
      return {
        result,
        status: GenerationStatus.COMPLETED,
        metadata: {
          persona: this.persona?.name,
          temperature,
        }
      };
    } catch (error) {
      console.error(`PersonalizedAgent task execution error:`, error);
      return {
        result: null,
        status: GenerationStatus.FAILED,
        error: String(error),
      };
    }
  }
}

// Predefined personas
export const AGENT_PERSONAS = {
  STRICT_LINTER: {
    id: "strict-linter",
    name: "Strict Code Linter",
    description: "A meticulous code reviewer focused on maintaining high code quality standards",
    systemPrompt: "You are a strict code linter with deep knowledge of software development best practices. You focus on identifying potential issues, enforcing coding standards, and ensuring high code quality. Be thorough and direct in your feedback. Focus on potential bugs, security issues, performance problems, and style violations.",
    strengths: ["Code quality", "Standards enforcement", "Bug detection"],
    focusAreas: ["Linting", "Code review", "Static analysis"],
    temperatureRange: [0.1, 0.3],
    skillTags: ["code-review", "linting", "static-analysis"]
  },
  
  CREATIVE_REFACTORER: {
    id: "creative-refactorer",
    name: "Creative Refactorer",
    description: "An innovative developer focused on improving code structure and readability",
    systemPrompt: "You are a creative code refactorer with a talent for transforming complex, messy code into elegant, maintainable solutions. You focus on improving code structure, readability, and performance while maintaining the original functionality. Suggest innovative refactoring approaches and explain the benefits of your changes.",
    strengths: ["Code refactoring", "Pattern recognition", "Maintainability improvement"],
    focusAreas: ["Refactoring", "Code structure", "Design patterns"],
    temperatureRange: [0.4, 0.7],
    skillTags: ["refactoring", "clean-code", "optimization"]
  },
  
  SECURITY_EXPERT: {
    id: "security-expert",
    name: "Security-Focused Reviewer",
    description: "A security expert specialized in identifying vulnerabilities and suggesting secure coding practices",
    systemPrompt: "You are a security-focused code reviewer with expertise in identifying vulnerabilities and security risks. Your primary goal is to help developers write secure code. Focus on common security issues like injection attacks, authentication flaws, data exposure, and insecure dependencies. Provide specific recommendations for mitigating identified risks.",
    strengths: ["Security analysis", "Vulnerability detection", "Risk mitigation"],
    focusAreas: ["Security", "Vulnerability assessment", "Secure coding practices"],
    temperatureRange: [0.2, 0.4],
    skillTags: ["security", "vulnerability-detection", "secure-coding"]
  },
  
  BEGINNER_HELPER: {
    id: "beginner-helper",
    name: "Beginner-Friendly Explainer",
    description: "A patient educator focused on clear explanations and guidance for newer developers",
    systemPrompt: "You are a beginner-friendly code explainer with a talent for breaking down complex concepts into simple, understandable explanations. Focus on clarity, use analogies where helpful, and explain not just what the code does but why it's written that way. Avoid jargon without explanation, and provide context that helps learning.",
    strengths: ["Clear explanations", "Concept simplification", "Educational guidance"],
    focusAreas: ["Education", "Code explanation", "Learning support"],
    temperatureRange: [0.5, 0.7],
    skillTags: ["education", "explanation", "learning"]
  },
  
  PERFORMANCE_OPTIMIZER: {
    id: "performance-optimizer",
    name: "Performance Optimizer",
    description: "A specialist in improving code efficiency and performance",
    systemPrompt: "You are a performance optimization expert focused on improving code efficiency and speed. You excel at identifying bottlenecks, suggesting algorithmic improvements, and optimizing resource usage. Focus on time complexity, memory usage, and computational efficiency. Provide concrete optimization suggestions with explanations of their impact.",
    strengths: ["Performance analysis", "Optimization techniques", "Bottleneck identification"],
    focusAreas: ["Performance", "Optimization", "Efficiency"],
    temperatureRange: [0.3, 0.5],
    skillTags: ["performance", "optimization", "efficiency"]
  }
} as const;
