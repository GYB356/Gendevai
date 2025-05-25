// Worker configuration

// Queue name for code generation tasks
export const QUEUE_NAME = "code-generation";

// Redis connection configuration
export const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};
