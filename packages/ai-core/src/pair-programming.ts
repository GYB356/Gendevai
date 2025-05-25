// Human-AI Pair Programming Integration
import { openai } from "./client";
import { MODELS } from "./models";
import { PersonalizedAgent, AGENT_PERSONAS } from "./personalization";

/**
 * Types of inline code suggestions
 */
export enum SuggestionType {
  COMPLETION = "COMPLETION",
  REFACTORING = "REFACTORING",
  OPTIMIZATION = "OPTIMIZATION",
  DOCUMENTATION = "DOCUMENTATION",
  TEST = "TEST",
  BUG_FIX = "BUG_FIX"
}

/**
 * Interface for inline code suggestions
 */
export interface CodeSuggestion {
  id?: string;
  type: SuggestionType;
  originalCode: string;
  suggestedCode: string;
  explanation: string;
  confidence: number; // 0-1
  startLine: number;
  endLine: number;
  createdAt: Date;
}

/**
 * Service for inline code suggestions and pair programming
 */
export class PairProgrammingService {
  private personalizedAgent: PersonalizedAgent;
  
  constructor(options?: {
    userPreferences?: any;
    persona?: any;
  }) {
    this.personalizedAgent = new PersonalizedAgent({
      userPreferences: options?.userPreferences,
      persona: options?.persona || AGENT_PERSONAS.CREATIVE_REFACTORER,
    });
  }

  /**
   * Generates a real-time code completion based on the current context
   */
  async generateCompletion(
    options: {
      prefix: string;      // Code before the cursor
      suffix?: string;     // Code after the cursor (if any)
      language: string;    // Programming language
      filePath: string;    // Path to the file for context
      maxTokens?: number;  // Maximum length of completion
    }
  ): Promise<string> {
    try {
      const prompt = `
Please complete the following code in ${options.language}:

\`\`\`${options.language}
${options.prefix}
[CURSOR_POSITION]
${options.suffix || ''}
\`\`\`

Provide only the completion code that should go where [CURSOR_POSITION] is. Don't repeat any of the existing code.
Keep the style consistent with the existing code. Ensure your completion is syntactically valid.
`;

      const completion = await openai.chat.completions.create({
        model: MODELS.CODE,
        messages: [
          { 
            role: "system", 
            content: "You are an expert coding assistant that provides real-time code completions. You excel at understanding context and providing helpful, relevant completions that match the style and intent of the existing code."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: options.maxTokens || 150,
      });

      const result = completion.choices[0]?.message.content?.trim() || "";
      
      // Clean up the result to ensure it doesn't include markdown code blocks
      return result.replace(/```[\w]*\n|```$/g, '');
    } catch (error) {
      console.error("Code completion error:", error);
      return "";
    }
  }

  /**
   * Processes an inline comment command and generates a suggestion
   */
  async processInlineCommand(
    options: {
      code: string;        // The full code containing the comment
      commentLine: number; // Line number where the comment appears
      commentText: string; // The text of the comment
      language: string;    // Programming language
      filePath: string;    // File path for context
    }
  ): Promise<CodeSuggestion | null> {
    try {
      // Parse the command from the comment
      const commandMatch = options.commentText.match(/\/\/\s*GenDevAI:\s*(.*)/i);
      if (!commandMatch) return null;
      
      const command = commandMatch[1].trim();
      
      // Split the code into lines
      const codeLines = options.code.split('\n');
      
      // Determine the relevant code block to modify
      // This is a simplified approach - in a real implementation, you would use AST parsing
      // to accurately identify the code block that should be modified
      let startLine = options.commentLine;
      let endLine = options.commentLine;
      
      // Look for the start of the block before the comment
      while (startLine > 0) {
        startLine--;
        const line = codeLines[startLine].trim();
        
        // If we find an empty line or another comment, this might be the boundary
        if (line === '' || line.startsWith('//')) {
          startLine++;
          break;
        }
        
        // If we find a line that suggests the start of a block (e.g., function declaration, class, etc.)
        if (line.includes('{') || line.includes('function') || line.includes('class') || line.includes('if') || line.includes('for')) {
          break;
        }
      }
      
      // Look for the end of the block after the comment
      while (endLine < codeLines.length - 1) {
        endLine++;
        const line = codeLines[endLine].trim();
        
        // If we find a closing brace or an empty line after some code, this might be the boundary
        if (line === '}' || (line === '' && endLine > options.commentLine + 1)) {
          if (line === '}') endLine++;
          break;
        }
      }
      
      // Extract the code block to modify
      const codeToModify = codeLines.slice(startLine, endLine).join('\n');
      
      // Determine the suggestion type based on the command
      let suggestionType = SuggestionType.REFACTORING;
      if (command.includes('optimize') || command.includes('performance')) {
        suggestionType = SuggestionType.OPTIMIZATION;
      } else if (command.includes('document') || command.includes('explain')) {
        suggestionType = SuggestionType.DOCUMENTATION;
      } else if (command.includes('test')) {
        suggestionType = SuggestionType.TEST;
      } else if (command.includes('fix') || command.includes('bug')) {
        suggestionType = SuggestionType.BUG_FIX;
      }
      
      // Generate the suggested code
      const prompt = `
I have the following ${options.language} code with an inline command:

\`\`\`${options.language}
${codeToModify}
\`\`\`

The command is: "${command}"

Please ${command} and provide:
1. The improved version of this code
2. A brief explanation of what changes you made and why

Format your response as follows:
SUGGESTED_CODE:
[Your suggested code here]

EXPLANATION:
[Your explanation here]
`;

      const result = await this.personalizedAgent.executeTask(
        `Process inline code command: ${command}`,
        prompt,
        { temperature: 0.5 }
      );
      
      if (!result.result) return null;
      
      // Parse the result to extract the suggested code and explanation
      const suggestedCodeMatch = result.result.match(/SUGGESTED_CODE:\s*([\s\S]*?)(?=EXPLANATION:|$)/);
      const explanationMatch = result.result.match(/EXPLANATION:\s*([\s\S]*)/);
      
      const suggestedCode = suggestedCodeMatch?.[1].trim() || "";
      const explanation = explanationMatch?.[1].trim() || "";
      
      if (!suggestedCode) return null;
      
      return {
        type: suggestionType,
        originalCode: codeToModify,
        suggestedCode,
        explanation,
        confidence: 0.8, // Placeholder - could be calculated based on model output
        startLine,
        endLine,
        createdAt: new Date()
      };
    } catch (error) {
      console.error("Inline command processing error:", error);
      return null;
    }
  }

  /**
   * Provides alternative variations of a code suggestion
   */
  async generateAlternatives(
    options: {
      originalSuggestion: CodeSuggestion;
      count: number;       // Number of alternatives to generate
      language: string;    // Programming language
    }
  ): Promise<CodeSuggestion[]> {
    try {
      const prompt = `
I have a code suggestion that ${options.originalSuggestion.explanation}

Original code:
\`\`\`${options.language}
${options.originalSuggestion.originalCode}
\`\`\`

Current suggestion:
\`\`\`${options.language}
${options.originalSuggestion.suggestedCode}
\`\`\`

Please provide ${options.count} alternative ways to achieve the same goal. Each alternative should be different in approach or style, while still addressing the original intent.

Format your response as follows:

ALTERNATIVE 1:
[Alternative code 1]

EXPLANATION 1:
[Explanation 1]

ALTERNATIVE 2:
[Alternative code 2]

EXPLANATION 2:
[Explanation 2]

...and so on.
`;

      const result = await this.personalizedAgent.executeTask(
        "Generate alternative code suggestions",
        prompt,
        { temperature: 0.8 } // Higher temperature for more variety
      );
      
      if (!result.result) return [];
      
      const alternatives: CodeSuggestion[] = [];
      
      // Parse alternatives from the result
      const alternativePattern = /ALTERNATIVE (\d+):\s*([\s\S]*?)(?=EXPLANATION \d+:|ALTERNATIVE \d+:|$)/g;
      const explanationPattern = /EXPLANATION (\d+):\s*([\s\S]*?)(?=ALTERNATIVE \d+:|$)/g;
      
      let alternativeMatch;
      const alternativeCodes: Record<string, string> = {};
      
      while ((alternativeMatch = alternativePattern.exec(result.result)) !== null) {
        const index = alternativeMatch[1];
        const code = alternativeMatch[2].trim();
        alternativeCodes[index] = code;
      }
      
      let explanationMatch;
      const explanations: Record<string, string> = {};
      
      while ((explanationMatch = explanationPattern.exec(result.result)) !== null) {
        const index = explanationMatch[1];
        const explanation = explanationMatch[2].trim();
        explanations[index] = explanation;
      }
      
      // Create CodeSuggestion objects for each alternative
      for (const index in alternativeCodes) {
        if (alternativeCodes[index] && explanations[index]) {
          alternatives.push({
            ...options.originalSuggestion,
            suggestedCode: alternativeCodes[index],
            explanation: explanations[index],
            confidence: 0.7, // Slightly lower confidence for alternatives
            createdAt: new Date()
          });
        }
      }
      
      return alternatives;
    } catch (error) {
      console.error("Alternative generation error:", error);
      return [];
    }
  }

  /**
   * Explains a piece of code in detail
   */
  async explainCodeInline(
    options: {
      code: string;        // Code to explain
      language: string;    // Programming language
      detailLevel: "basic" | "detailed"; // Level of explanation detail
    }
  ): Promise<string> {
    try {
      const prompt = options.detailLevel === "basic" 
        ? `Please provide a brief explanation of what this ${options.language} code does:`
        : `Please provide a detailed line-by-line explanation of this ${options.language} code:`;
      
      const fullPrompt = `
${prompt}

\`\`\`${options.language}
${options.code}
\`\`\`

${options.detailLevel === "detailed" ? "Include explanations of logic, potential edge cases, and any performance considerations." : ""}
Keep your explanation clear and concise, focusing on the main purpose and functionality.
`;

      const result = await this.personalizedAgent.executeTask(
        `Explain code (${options.detailLevel})`,
        fullPrompt,
        { 
          temperature: 0.3,
          persona: AGENT_PERSONAS.BEGINNER_HELPER
        }
      );
      
      return result.result || "Could not generate an explanation.";
    } catch (error) {
      console.error("Code explanation error:", error);
      return "Error generating explanation.";
    }
  }
}
