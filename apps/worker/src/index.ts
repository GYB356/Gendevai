import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env file
config({ path: join(__dirname, "../.env") });

import { Worker } from "bullmq";
import { prisma } from "@gendevai/database";
import { generateCode } from "@gendevai/ai-core";
import { logger } from "./logger";
import { QUEUE_NAME, REDIS_CONNECTION } from "./config";

// Initialize worker for processing code generation tasks
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    logger.info(`Processing job ${job.id}: ${job.name}`);

    try {
      // Get job data
      const { taskId } = job.data;

      // Fetch the code generation task
      const codeGeneration = await prisma.codeGeneration.findUnique({
        where: { taskId },
        include: { task: true },
      });

      if (!codeGeneration) {
        throw new Error(`Code generation task not found: ${taskId}`);
      }

      // Update status to PROCESSING
      await prisma.codeGeneration.update({
        where: { id: codeGeneration.id },
        data: { status: "PROCESSING" },
      });

      // Generate code
      logger.info(`Generating code for task: ${taskId}`);
      const { result, status } = await generateCode(codeGeneration.prompt);

      // Update the code generation with result
      await prisma.codeGeneration.update({
        where: { id: codeGeneration.id },
        data: {
          result,
          status,
        },
      });

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: status === "COMPLETED" ? "COMPLETED" : "FAILED",
        },
      });

      logger.info(`Job ${job.id} completed successfully`);
      return { success: true, taskId };
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      
      // Update task status to FAILED on error
      try {
        const { taskId } = job.data;
        await prisma.codeGeneration.update({
          where: { taskId },
          data: { status: "FAILED" },
        });
        
        await prisma.task.update({
          where: { id: taskId },
          data: { status: "FAILED" },
        });
      } catch (updateError) {
        logger.error("Error updating task status:", updateError);
      }
      
      throw error;
    }
  },
  { connection: REDIS_CONNECTION }
);

// Handle worker events
worker.on("completed", (job) => {
  logger.info(`Job ${job.id} has completed successfully`);
});

worker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});

logger.info("Worker started successfully");

// Handle process termination
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing worker...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, closing worker...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
