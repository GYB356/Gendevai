import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewCode } from "@gendevai/ai-core";

// Validation schema for request body
const requestSchema = z.object({
  code: z.string().min(1, {
    message: "Code is required.",
  }),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"], {
    required_error: "Please select a language.",
  }),
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

    const { code, language } = parsedBody.data;

    // Add language context to the code for better review
    const codeWithContext = `Language: ${language}\n\n${code}`;
    
    // Use the reviewCode function to analyze the code
    const review = await reviewCode(codeWithContext);

    if (!review) {
      return NextResponse.json(
        { error: "Failed to review code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error reviewing code:", error);
    return NextResponse.json(
      { error: "Failed to review code" },
      { status: 500 }
    );
  }
}
