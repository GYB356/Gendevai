import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import { z } from "zod";
import { prisma } from "@gendevai/database";

// Validation schema for request body
const requestSchema = z.object({
  taskId: z.string().min(1),
});

// Redis connection configuration
const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

// Queue name for code generation tasks
const QUEUE_NAME = "code-generation";

// Initialize the queue
const codeGenerationQueue = new Queue(QUEUE_NAME, {
  connection: REDIS_CONNECTION,
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

    const { taskId } = parsedBody.data;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { codeGeneration: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (!task.codeGeneration) {
      return NextResponse.json(
        { error: "No code generation task associated with this task" },
        { status: 400 }
      );
    }

    // Add task to queue
    const job = await codeGenerationQueue.add("generate-code", {
      taskId,
    });

    return NextResponse.json({
      success: true,
      message: "Task added to queue",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error adding task to queue:", error);
    return NextResponse.json(
      { error: "Failed to add task to queue" },
      { status: 500 }
    );
  }
}
