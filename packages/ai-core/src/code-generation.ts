import { GenerationStatus } from "@gendevai/database";
import { MODELS, SYSTEM_PROMPTS } from "./models";
import { openai } from "./client";

/**
 * Generates code based on a prompt
 * @param prompt The user's description of the code to generate
 * @param options Additional options for code generation
 * @returns The generated code and status
 */
export async function generateCode(
  prompt: string,
  options?: {
    language?: string;
    framework?: string;
    complexity?: "simple" | "moderate" | "complex";
    includeTests?: boolean;
    includeDocs?: boolean;
  }
) {
  try {
    // Build enhanced prompt with options
    let enhancedPrompt = prompt;
    
    if (options) {
      if (options.language) {
        enhancedPrompt += `\n\nPlease write the code in ${options.language}.`;
      }
      
      if (options.framework) {
        enhancedPrompt += `\n\nUse the ${options.framework} framework.`;
      }
      
      if (options.complexity) {
        enhancedPrompt += `\n\nThe solution should be ${options.complexity} in complexity.`;
      }
      
      if (options.includeTests) {
        enhancedPrompt += `\n\nPlease include unit tests for the code.`;
      }
      
      if (options.includeDocs) {
        enhancedPrompt += `\n\nPlease include detailed documentation/comments.`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: MODELS.CODE,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.CODE_GENERATION },
        { role: "user", content: enhancedPrompt }
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message.content || "";
    
    return {
      result,
      status: GenerationStatus.COMPLETED,
    };
  } catch (error) {
    console.error("Code generation error:", error);
    return {
      result: null,
      status: GenerationStatus.FAILED,
    };
  }
}

/**
 * Reviews code and provides feedback
 * @param code The code to review
 * @returns Feedback on the code
 */
export async function reviewCode(code: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.ANALYSIS,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.CODE_REVIEW },
        { role: "user", content: `Please review this code:\n\n${code}` }
      ],
      temperature: 0.3,
    });

    return completion.choices[0]?.message.content || "";
  } catch (error) {
    console.error("Code review error:", error);
    return "Failed to review code due to an error.";
  }
}

/**
 * Generates code explanations
 * @param code The code to explain
 * @param level The detail level of the explanation
 * @returns Explanation of the code
 */
export async function explainCode(code: string, level: "basic" | "detailed" = "basic") {
  try {
    const prompt = level === "basic" 
      ? "Provide a brief explanation of what this code does:"
      : "Provide a detailed line-by-line explanation of this code:";
    
    const completion = await openai.chat.completions.create({
      model: MODELS.ANALYSIS,
      messages: [
        { 
          role: "system", 
          content: "You are an expert at explaining code to developers of all levels." 
        },
        { role: "user", content: `${prompt}\n\n${code}` }
      ],
      temperature: 0.3,
    });

    return completion.choices[0]?.message.content || "";
  } catch (error) {
    console.error("Code explanation error:", error);
    return "Failed to explain code due to an error.";
  }
}

/**
 * Enhances existing code with improvements
 * @param code The code to enhance
 * @param instructions Specific enhancement instructions
 * @returns Enhanced version of the code
 */
export async function enhanceCode(code: string, instructions: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.CODE,
      messages: [
        { 
          role: "system", 
          content: "You are an expert at refactoring and improving code. Provide the complete enhanced code." 
        },
        { 
          role: "user", 
          content: `Please improve this code according to these instructions: ${instructions}\n\nHere's the code:\n\n${code}` 
        }
      ],
      temperature: 0.5,
    });

    return completion.choices[0]?.message.content || "";
  } catch (error) {
    console.error("Code enhancement error:", error);
    return "Failed to enhance code due to an error.";
  }
}
