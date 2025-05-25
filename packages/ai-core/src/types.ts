import { z } from "zod";

// Schema for code generation requests
export const CodeGenerationSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters long"),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"]).optional(),
  framework: z.string().optional(),
});

export type CodeGenerationRequest = z.infer<typeof CodeGenerationSchema>;

// Schema for code review requests
export const CodeReviewSchema = z.object({
  code: z.string().min(1, "Code is required"),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"]).optional(),
});

export type CodeReviewRequest = z.infer<typeof CodeReviewSchema>;
