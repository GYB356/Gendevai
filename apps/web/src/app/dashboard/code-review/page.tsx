"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  code: z.string().min(1, {
    message: "Code is required.",
  }),
  language: z.enum(["javascript", "typescript", "python", "java", "csharp", "go", "rust", "other"], {
    required_error: "Please select a language.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CodeReview() {
  const { toast } = useToast();
  const [review, setReview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      language: "typescript",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setReview(null);

    try {
      const response = await fetch("/api/review-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to review code");
      }

      const result = await response.json();
      setReview(result.review);
      toast({
        title: "Code review completed",
        description: "Your code has been reviewed successfully.",
      });
    } catch (error) {
      console.error("Error reviewing code:", error);
      toast({
        title: "Error reviewing code",
        description: "There was an error reviewing your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Code Review</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-md border p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <label htmlFor="code" className="text-sm font-medium">
                  Paste your code for review
                </label>
                <textarea
                  id="code"
                  {...register("code")}
                  className="h-64 w-full rounded-md border p-2 font-mono text-sm"
                  placeholder="Paste your code here..."
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  "Review Code"
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-semibold mb-4">Review Results</h2>
            {review ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{review}</div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Your code review results will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
