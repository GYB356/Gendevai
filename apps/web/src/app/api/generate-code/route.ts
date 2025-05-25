import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@gendevai/ai-core";
import { MODELS, SYSTEM_PROMPTS } from "@gendevai/ai-core";
import { generateCode } from "@gendevai/ai-core";

// Validation schema for request body
const requestSchema = z.object({
  prompt: z.string().min(10),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"]),
  framework: z.string().optional(),
  complexity: z.enum(["simple", "moderate", "complex"]).optional(),
  includeTests: z.boolean().optional(),
  includeDocs: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, language, framework, complexity, includeTests, includeDocs } = parsedBody.data;

    // Use the enhanced generateCode function with options
    const { result, status } = await generateCode(prompt, {
      language,
      framework,
      complexity,
      includeTests,
      includeDocs,
    });

    if (status === "FAILED" || !result) {
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      );
    }

    // Extract code blocks from the response
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
    const matches = [...result.matchAll(codeBlockRegex)];
    
    let code = "";
    let explanation = "";
    
    if (matches.length > 0) {
      // Extract code from the first code block
      code = matches[0][1].trim();
      
      // Extract explanation (text before the first code block)
      const explanationMatch = result.split("```")[0].trim();
      explanation = explanationMatch || "Generated code based on your requirements.";
    } else {
      // If no code block found, use the entire response
      code = result.trim();
    }

    return NextResponse.json({ 
      code, 
      explanation,
      status 
    });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}
