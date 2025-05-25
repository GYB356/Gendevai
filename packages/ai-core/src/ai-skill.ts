// AI Skill Components and Marketplace Service
import { openai } from "./client";
import { MODELS } from "./models";

/**
 * Interface for skill input parameters
 */
export interface SkillInput {
  [key: string]: any;
}

/**
 * Interface for skill definition
 */
export interface AISkill {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: "BASIC" | "INTERMEDIATE" | "ADVANCED";
  systemPrompt: string;
  userPromptTemplate: string;
  inputSchema: Record<string, any>; // JSON schema
  outputSchema?: Record<string, any>; // Optional JSON schema
  exampleInputs: SkillInput[];
  exampleOutputs: any[];
  tags: string[];
  isPublic: boolean;
  isVerified: boolean;
  version: string;
}

/**
 * Interface for skill execution result
 */
export interface SkillExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  executionTimeMs: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/**
 * Service for executing AI skills and managing the marketplace
 */
export class AISkillService {
  /**
   * Validates input against the skill's input schema
   */
  private validateInput(input: SkillInput, schema: Record<string, any>): boolean {
    // This is a simplified validation
    // In a real implementation, you would use a JSON schema validator like Ajv
    
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (input[requiredProp] === undefined) {
          return false;
        }
      }
    }
    
    // Check property types (simplified)
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (input[propName] !== undefined) {
          const propType = (propSchema as any).type;
          
          if (propType === "string" && typeof input[propName] !== "string") {
            return false;
          } else if (propType === "number" && typeof input[propName] !== "number") {
            return false;
          } else if (propType === "boolean" && typeof input[propName] !== "boolean") {
            return false;
          } else if (propType === "array" && !Array.isArray(input[propName])) {
            return false;
          } else if (propType === "object" && (typeof input[propName] !== "object" || input[propName] === null || Array.isArray(input[propName]))) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Formats the user prompt by replacing template variables with input values
   */
  private formatUserPrompt(template: string, input: SkillInput): string {
    let prompt = template;
    
    // Replace template variables (e.g., {{variableName}}) with input values
    for (const [key, value] of Object.entries(input)) {
      const placeholder = `{{${key}}}`;
      
      // Convert value to string representation
      let stringValue = "";
      if (typeof value === "object") {
        stringValue = JSON.stringify(value, null, 2);
      } else {
        stringValue = String(value);
      }
      
      // Replace all occurrences
      prompt = prompt.split(placeholder).join(stringValue);
    }
    
    return prompt;
  }

  /**
   * Executes an AI skill with the provided inputs
   */
  async executeSkill(
    skill: AISkill,
    input: SkillInput,
    options?: {
      model?: string;
      temperature?: number;
      userId?: string;
    }
  ): Promise<SkillExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate input against the skill's input schema
      if (!this.validateInput(input, skill.inputSchema)) {
        return {
          success: false,
          output: null,
          error: "Input validation failed",
          executionTimeMs: Date.now() - startTime,
        };
      }
      
      // Format the user prompt
      const userPrompt = this.formatUserPrompt(skill.userPromptTemplate, input);
      
      // Choose the model based on skill complexity
      let model = options?.model || MODELS.DEFAULT;
      if (skill.complexity === "ADVANCED") {
        model = MODELS.ADVANCED;
      } else if (skill.complexity === "BASIC") {
        model = MODELS.BASIC;
      }
      
      // Determine if JSON output is required based on output schema
      const jsonOutput = !!skill.outputSchema;
      
      // Execute the skill
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: skill.systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: options?.temperature || 0.5,
        response_format: jsonOutput ? { type: "json_object" } : undefined,
      });

      const result = completion.choices[0]?.message.content || "";
      
      let parsedResult: any;
      
      // Parse the result if JSON output is expected
      if (jsonOutput) {
        try {
          parsedResult = JSON.parse(result);
        } catch (error) {
          return {
            success: false,
            output: result,
            error: "Failed to parse JSON output",
            executionTimeMs: Date.now() - startTime,
          };
        }
      } else {
        parsedResult = result;
      }
      
      // Validate output against schema if provided
      if (skill.outputSchema) {
        // This would use a full JSON schema validator in a real implementation
        // For now, we're just checking that the output is not null
        if (parsedResult === null) {
          return {
            success: false,
            output: parsedResult,
            error: "Output validation failed",
            executionTimeMs: Date.now() - startTime,
          };
        }
      }
      
      // Return the successful result
      return {
        success: true,
        output: parsedResult,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("Skill execution error:", error);
      return {
        success: false,
        output: null,
        error: String(error),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Searches for skills based on query and filters
   */
  async searchSkills(
    options: {
      query?: string;
      categories?: string[];
      tags?: string[];
      complexity?: string;
      creatorId?: string;
      publicOnly?: boolean;
      verifiedOnly?: boolean;
    }
  ): Promise<AISkill[]> {
    // This would query the database in a real implementation
    // For this example, we're just returning an empty array
    return [];
  }

  /**
   * Creates a new AI skill
   */
  async createSkill(
    skillData: Omit<AISkill, "id"> & { creatorId: string }
  ): Promise<AISkill> {
    // This would create a new skill in the database in a real implementation
    // For this example, we're just returning a mock skill
    return {
      id: "mock-skill-id",
      ...skillData,
    };
  }

  /**
   * Updates an existing AI skill
   */
  async updateSkill(
    skillId: string,
    updates: Partial<AISkill>
  ): Promise<AISkill> {
    // This would update the skill in the database in a real implementation
    // For this example, we're just returning a mock updated skill
    return {
      id: skillId,
      name: updates.name || "Updated Skill",
      description: updates.description || "Updated description",
      category: updates.category || "CODE_GENERATION",
      complexity: updates.complexity || "INTERMEDIATE",
      systemPrompt: updates.systemPrompt || "Updated system prompt",
      userPromptTemplate: updates.userPromptTemplate || "Updated user prompt template",
      inputSchema: updates.inputSchema || {},
      outputSchema: updates.outputSchema,
      exampleInputs: updates.exampleInputs || [],
      exampleOutputs: updates.exampleOutputs || [],
      tags: updates.tags || [],
      isPublic: updates.isPublic !== undefined ? updates.isPublic : false,
      isVerified: updates.isVerified !== undefined ? updates.isVerified : false,
      version: updates.version || "1.0.0",
    };
  }
}

/**
 * Service for executing and managing AI workflows
 */
export class AIWorkflowService {
  private skillService: AISkillService;
  
  constructor() {
    this.skillService = new AISkillService();
  }

  /**
   * Executes a workflow with the provided inputs
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, any>,
    options?: {
      userId?: string;
    }
  ): Promise<{
    success: boolean;
    output: any;
    logs: any[];
    error?: string;
    executionTimeMs: number;
  }> {
    const startTime = Date.now();
    
    try {
      // This would fetch the workflow from the database and execute it
      // For this example, we're just returning a mock result
      return {
        success: true,
        output: { result: "Workflow executed successfully" },
        logs: [
          { step: "start", timestamp: new Date().toISOString() },
          { step: "execution", timestamp: new Date().toISOString() },
          { step: "complete", timestamp: new Date().toISOString() },
        ],
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Workflow execution error:", error);
      return {
        success: false,
        output: null,
        logs: [
          { step: "start", timestamp: new Date().toISOString() },
          { step: "error", timestamp: new Date().toISOString(), error: String(error) },
        ],
        error: String(error),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

// Predefined example skills for the marketplace
export const EXAMPLE_SKILLS = {
  CODE_REVIEWER: {
    id: "code-reviewer",
    name: "Advanced Code Reviewer",
    description: "Reviews code for best practices, bugs, and style issues",
    category: "CODE_REVIEW",
    complexity: "ADVANCED" as const,
    systemPrompt: "You are an expert code reviewer with years of experience across multiple languages. You excel at identifying issues, suggesting improvements, and explaining the reasoning behind your recommendations. Focus on code quality, performance, security, and maintainability.",
    userPromptTemplate: `Please review the following {{language}} code and provide detailed feedback:

\`\`\`{{language}}
{{code}}
\`\`\`

Review the code for:
- Bugs and logical errors
- Performance issues
- Security vulnerabilities
- Style and convention issues
- Architecture and design improvements`,
    inputSchema: {
      type: "object",
      required: ["code", "language"],
      properties: {
        code: { type: "string" },
        language: { type: "string" },
        focus: { type: "array", items: { type: "string" } }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        overallRating: { type: "number" },
        summary: { type: "string" },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              severity: { type: "string" },
              description: { type: "string" },
              suggestion: { type: "string" },
              lineNumbers: { type: "array", items: { type: "number" } }
            }
          }
        }
      }
    },
    exampleInputs: [
      {
        code: "function add(a, b) { return a + b; }",
        language: "javascript"
      }
    ],
    exampleOutputs: [
      {
        overallRating: 4,
        summary: "This code is generally good but could use additional type safety.",
        issues: [
          {
            type: "TYPE_SAFETY",
            severity: "MEDIUM",
            description: "No type checking for input parameters",
            suggestion: "Consider adding TypeScript or JSDoc type annotations",
            lineNumbers: [1]
          }
        ]
      }
    ],
    tags: ["code-review", "static-analysis", "best-practices"],
    isPublic: true,
    isVerified: true,
    version: "1.0.0"
  },
  
  DOCUMENTATION_GENERATOR: {
    id: "documentation-generator",
    name: "Documentation Generator",
    description: "Generates comprehensive documentation for code",
    category: "DOCUMENTATION",
    complexity: "INTERMEDIATE" as const,
    systemPrompt: "You are a documentation specialist who excels at creating clear, comprehensive documentation for code. You understand how to explain complex concepts in accessible ways and how to structure documentation for maximum usability.",
    userPromptTemplate: `Please generate documentation for the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Documentation format: {{format}}
Include examples: {{includeExamples}}`,
    inputSchema: {
      type: "object",
      required: ["code", "language"],
      properties: {
        code: { type: "string" },
        language: { type: "string" },
        format: { type: "string", enum: ["markdown", "jsdoc", "javadoc", "docstring"] },
        includeExamples: { type: "boolean" }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        documentation: { type: "string" },
        format: { type: "string" },
        coveragePercentage: { type: "number" }
      }
    },
    exampleInputs: [
      {
        code: "function calculateTotal(prices, discount) { return prices.reduce((sum, price) => sum + price, 0) * (1 - discount); }",
        language: "javascript",
        format: "jsdoc",
        includeExamples: true
      }
    ],
    exampleOutputs: [
      {
        documentation: "/**\n * Calculates the total price after applying a discount\n * @param {number[]} prices - Array of prices\n * @param {number} discount - Discount as a decimal (e.g., 0.1 for 10%)\n * @returns {number} The total price after discount\n * @example\n * // Returns 27\n * calculateTotal([10, 20], 0.1);\n */",
        format: "jsdoc",
        coveragePercentage: 100
      }
    ],
    tags: ["documentation", "comments", "code-explanation"],
    isPublic: true,
    isVerified: true,
    version: "1.0.0"
  },
  
  UNIT_TEST_GENERATOR: {
    id: "unit-test-generator",
    name: "Unit Test Generator",
    description: "Generates comprehensive unit tests for code",
    category: "TESTING",
    complexity: "ADVANCED" as const,
    systemPrompt: "You are an expert in test-driven development and writing effective unit tests. You understand how to test edge cases, ensure good coverage, and write maintainable test code.",
    userPromptTemplate: `Please generate unit tests for the following {{language}} code using {{testFramework}}:

\`\`\`{{language}}
{{code}}
\`\`\`

Test coverage focus: {{coverageFocus}}`,
    inputSchema: {
      type: "object",
      required: ["code", "language", "testFramework"],
      properties: {
        code: { type: "string" },
        language: { type: "string" },
        testFramework: { type: "string" },
        coverageFocus: { type: "string", enum: ["basic", "comprehensive", "edge-cases"] }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        tests: { type: "string" },
        coverage: {
          type: "object",
          properties: {
            lines: { type: "number" },
            branches: { type: "number" },
            functions: { type: "number" }
          }
        },
        testCases: { type: "array", items: { type: "string" } }
      }
    },
    exampleInputs: [
      {
        code: "function isPalindrome(str) { return str === str.split('').reverse().join(''); }",
        language: "javascript",
        testFramework: "jest",
        coverageFocus: "comprehensive"
      }
    ],
    exampleOutputs: [
      {
        tests: "describe('isPalindrome', () => {\n  test('returns true for palindromes', () => {\n    expect(isPalindrome('racecar')).toBe(true);\n    expect(isPalindrome('level')).toBe(true);\n  });\n\n  test('returns false for non-palindromes', () => {\n    expect(isPalindrome('hello')).toBe(false);\n  });\n\n  test('handles empty string', () => {\n    expect(isPalindrome('')).toBe(true);\n  });\n\n  test('handles single character', () => {\n    expect(isPalindrome('a')).toBe(true);\n  });\n});",
        coverage: {
          lines: 100,
          branches: 100,
          functions: 100
        },
        testCases: [
          "Palindrome strings return true",
          "Non-palindrome strings return false",
          "Empty string handling",
          "Single character handling"
        ]
      }
    ],
    tags: ["testing", "unit-tests", "test-generation"],
    isPublic: true,
    isVerified: true,
    version: "1.0.0"
  }
};
