"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"], {
    required_error: "Please select a language.",
  }),
  framework: z.string().optional(),
  complexity: z.enum(["simple", "moderate", "complex"]).default("moderate"),
  includeTests: z.boolean().default(false),
  includeDocs: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function CodeGenerator() {
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      language: "typescript",
      framework: "",
      complexity: "moderate",
      includeTests: false,
      includeDocs: true,
    },
  });

  const selectedLanguage = watch("language");

  const getFrameworkOptions = (language: string) => {
    switch (language) {
      case "javascript":
      case "typescript":
        return ["React", "Vue", "Angular", "Next.js", "Express", "Node.js"];
      case "python":
        return ["Django", "Flask", "FastAPI", "Pandas", "TensorFlow"];
      case "java":
        return ["Spring Boot", "Hibernate", "Jakarta EE"];
      case "csharp":
        return [".NET Core", "ASP.NET", "Entity Framework"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setCode(null);
    setExplanation(null);

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const result = await response.json();
      setCode(result.code);
      if (result.explanation) {
        setExplanation(result.explanation);
      }
      
      toast({
        title: "Code generated successfully",
        description: "Your code has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Error generating code",
        description: "There was an error generating your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Code Generator</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-md border p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe what code you want to generate
                </label>
                <textarea
                  id="prompt"
                  {...register("prompt")}
                  className="h-32 w-full rounded-md border p-2"
                  placeholder="E.g., Create a React component that displays a list of items with pagination..."
                />
                {errors.prompt && (
                  <p className="text-sm text-red-500">{errors.prompt.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Language
                  </label>
                  <select
                    id="language"
                    {...register("language")}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.language && (
                    <p className="text-sm text-red-500">{errors.language.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="framework" className="text-sm font-medium">
                    Framework (Optional)
                  </label>
                  <select
                    id="framework"
                    {...register("framework")}
                    className="w-full rounded-md border p-2"
                  >
                    <option value="">None</option>
                    {getFrameworkOptions(selectedLanguage).map((framework) => (
                      <option key={framework} value={framework}>
                        {framework}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="complexity" className="text-sm font-medium">
                  Complexity
                </label>
                <select
                  id="complexity"
                  {...register("complexity")}
                  className="w-full rounded-md border p-2"
                >
                  <option value="simple">Simple</option>
                  <option value="moderate">Moderate</option>
                  <option value="complex">Complex</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeTests"
                    {...register("includeTests")}
                    className="h-4 w-4 rounded border"
                  />
                  <label htmlFor="includeTests" className="text-sm font-medium">
                    Include unit tests
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeDocs"
                    {...register("includeDocs")}
                    className="h-4 w-4 rounded border"
                  />
                  <label htmlFor="includeDocs" className="text-sm font-medium">
                    Include documentation
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Code"
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {explanation && (
            <div className="rounded-md border p-6">
              <h2 className="text-xl font-semibold mb-4">Explanation</h2>
              <div className="text-sm text-muted-foreground">
                {explanation}
              </div>
            </div>
          )}
          
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Code</h2>
            {code ? (
              <pre className="code-block">{code}</pre>
            ) : (
              <p className="text-muted-foreground">
                Your generated code will appear here.
              </p>
            )}
          </div>
          
          {code && (
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast({
                    title: "Code copied",
                    description: "Code has been copied to clipboard.",
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Copy Code
              </Button>
              
              <Button
                onClick={() => {
                  // In a real app, this would save to a database
                  toast({
                    title: "Code saved",
                    description: "Code has been saved to your library.",
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Save to Library
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
