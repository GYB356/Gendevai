/**
 * Configuration management with validation and type safety
 */

import { z } from 'zod';

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API Configuration
  API_BASE_URL: z.string().url().optional(),
  API_TIMEOUT: z.coerce.number().positive().default(30000),
  API_RETRY_ATTEMPTS: z.coerce.number().min(1).max(10).default(3),
  
  // AI/LLM Configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.coerce.number().positive().default(4000),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  
  // Database Configuration
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_SIZE: z.coerce.number().positive().default(10),
  DATABASE_TIMEOUT: z.coerce.number().positive().default(10000),
  
  // Redis Configuration
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).default(0),
  
  // Queue Configuration
  QUEUE_CONCURRENCY: z.coerce.number().positive().default(5),
  QUEUE_MAX_RETRIES: z.coerce.number().min(0).default(3),
  
  // Security Configuration
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().optional(),
  
  // GitHub Integration
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FILE_PATH: z.string().optional(),
  LOG_MAX_FILE_SIZE: z.coerce.number().positive().default(10485760), // 10MB
  
  // Performance Configuration
  CACHE_TTL: z.coerce.number().positive().default(3600), // 1 hour
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
  ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
});

export type Config = z.infer<typeof envSchema>;

export class ConfigurationError extends Error {
  constructor(message: string, public readonly validationErrors?: z.ZodError) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  private isValidated = false;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): Config {
    try {
      // Load from environment variables
      const rawConfig = {
        NODE_ENV: process.env.NODE_ENV,
        API_BASE_URL: process.env.API_BASE_URL,
        API_TIMEOUT: process.env.API_TIMEOUT,
        API_RETRY_ATTEMPTS: process.env.API_RETRY_ATTEMPTS,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_MODEL: process.env.OPENAI_MODEL,
        OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS,
        OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE,
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_POOL_SIZE: process.env.DATABASE_POOL_SIZE,
        DATABASE_TIMEOUT: process.env.DATABASE_TIMEOUT,
        REDIS_URL: process.env.REDIS_URL,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_DB: process.env.REDIS_DB,
        QUEUE_CONCURRENCY: process.env.QUEUE_CONCURRENCY,
        QUEUE_MAX_RETRIES: process.env.QUEUE_MAX_RETRIES,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
        GITHUB_APP_ID: process.env.GITHUB_APP_ID,
        GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
        LOG_LEVEL: process.env.LOG_LEVEL,
        LOG_FILE_PATH: process.env.LOG_FILE_PATH,
        LOG_MAX_FILE_SIZE: process.env.LOG_MAX_FILE_SIZE,
        CACHE_TTL: process.env.CACHE_TTL,
        RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
        ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
        ENABLE_TELEMETRY: process.env.ENABLE_TELEMETRY,
        ENABLE_DEBUG_MODE: process.env.ENABLE_DEBUG_MODE,
      };

      const result = envSchema.safeParse(rawConfig);
      
      if (!result.success) {
        throw new ConfigurationError(
          'Invalid configuration',
          result.error
        );
      }

      this.isValidated = true;
      return result.data;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      throw new ConfigurationError(`Failed to load configuration: ${error}`);
    }
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    if (!this.isValidated) {
      throw new ConfigurationError('Configuration not validated');
    }
    return this.config[key];
  }

  public getAll(): Config {
    if (!this.isValidated) {
      throw new ConfigurationError('Configuration not validated');
    }
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  public isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  public isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  public validate(): void {
    if (!this.isValidated) {
      this.config = this.loadConfig();
    }
  }

  public validateRequired(keys: (keyof Config)[]): void {
    const missing: string[] = [];
    
    for (const key of keys) {
      const value = this.config[key];
      if (value === undefined || value === null || value === '') {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new ConfigurationError(
        `Missing required configuration keys: ${missing.join(', ')}`
      );
    }
  }

  // Convenience methods for common configurations
  public getApiConfig() {
    return {
      baseUrl: this.get('API_BASE_URL'),
      timeout: this.get('API_TIMEOUT'),
      retryAttempts: this.get('API_RETRY_ATTEMPTS'),
    };
  }

  public getOpenAIConfig() {
    this.validateRequired(['OPENAI_API_KEY']);
    return {
      apiKey: this.get('OPENAI_API_KEY')!,
      model: this.get('OPENAI_MODEL'),
      maxTokens: this.get('OPENAI_MAX_TOKENS'),
      temperature: this.get('OPENAI_TEMPERATURE'),
    };
  }

  public getDatabaseConfig() {
    this.validateRequired(['DATABASE_URL']);
    return {
      url: this.get('DATABASE_URL')!,
      poolSize: this.get('DATABASE_POOL_SIZE'),
      timeout: this.get('DATABASE_TIMEOUT'),
    };
  }

  public getRedisConfig() {
    return {
      url: this.get('REDIS_URL'),
      password: this.get('REDIS_PASSWORD'),
      db: this.get('REDIS_DB'),
    };
  }

  public getGitHubConfig() {
    this.validateRequired(['GITHUB_APP_ID', 'GITHUB_PRIVATE_KEY', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']);
    return {
      appId: this.get('GITHUB_APP_ID')!,
      privateKey: this.get('GITHUB_PRIVATE_KEY')!,
      clientId: this.get('GITHUB_CLIENT_ID')!,
      clientSecret: this.get('GITHUB_CLIENT_SECRET')!,
    };
  }

  public getLogConfig() {
    return {
      level: this.get('LOG_LEVEL'),
      filePath: this.get('LOG_FILE_PATH'),
      maxFileSize: this.get('LOG_MAX_FILE_SIZE'),
    };
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
