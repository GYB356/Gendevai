/**
 * Enhanced logging infrastructure with structured logging and multiple transports
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  trace?: string;
  service?: string;
  requestId?: string;
  userId?: string;
}

export interface LogTransport {
  log(entry: LogEntry): Promise<void> | void;
}

export class ConsoleTransport implements LogTransport {
  constructor(private readonly colorize: boolean = true) {}

  log(entry: LogEntry): void {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const levelColors = ['\x1b[31m', '\x1b[33m', '\x1b[36m', '\x1b[37m', '\x1b[90m'];
    const resetColor = '\x1b[0m';

    const levelName = levelNames[entry.level];
    const color = this.colorize ? levelColors[entry.level] : '';
    const reset = this.colorize ? resetColor : '';

    let logMessage = `${color}[${entry.timestamp}] ${levelName}${reset}: ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      logMessage += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      logMessage += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        logMessage += `\n  Stack: ${entry.error.stack}`;
      }
    }

    const logMethod = entry.level <= LogLevel.ERROR ? console.error :
                     entry.level <= LogLevel.WARN ? console.warn :
                     console.log;

    logMethod(logMessage);
  }
}

export class FileTransport implements LogTransport {
  constructor(
    private readonly filePath: string,
    private readonly maxFileSize: number = 10 * 1024 * 1024, // 10MB
    private readonly maxFiles: number = 5
  ) {}

  async log(entry: LogEntry): Promise<void> {
    // In a real implementation, this would write to file with rotation
    // For now, we'll use a simple console fallback
    const logLine = JSON.stringify(entry) + '\n';
    
    try {
      // Would use fs.appendFile in Node.js environment
      console.log(`[FILE LOG] ${logLine}`);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  private transports: LogTransport[] = [];
  private currentLevel: LogLevel = LogLevel.INFO;
  private defaultContext: Record<string, any> = {};

  private constructor() {
    // Add default console transport
    this.addTransport(new ConsoleTransport());
  }

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  public setDefaultContext(context: Record<string, any>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  public setService(serviceName: string): void {
    this.setDefaultContext({ service: serviceName });
  }

  private async writeLog(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (level > this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
      error,
      trace: error?.stack
    };

    // Write to all transports
    await Promise.all(
      this.transports.map(transport => 
        Promise.resolve(transport.log(entry)).catch(err => 
          console.error('Transport error:', err)
        )
      )
    );
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    this.writeLog(LogLevel.ERROR, message, context, error);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  public trace(message: string, context?: Record<string, any>): void {
    this.writeLog(LogLevel.TRACE, message, context);
  }

  // Convenience methods for common patterns
  public logApiCall(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    this.info(`API ${method} ${url}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'api_call'
    });
  }

  public logPerformance(operation: string, duration: number, context?: Record<string, any>): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.writeLog(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance'
    });
  }

  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.writeLog(level, `Security Event: ${event}`, {
      ...context,
      event,
      severity,
      type: 'security'
    });
  }
}

/**
 * Performance monitoring decorator
 */
export function logPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = StructuredLogger.getInstance();

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const operation = operationName || `${target.constructor.name}.${propertyName}`;
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        logger.logPerformance(operation, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.logPerformance(operation, duration, { error: true });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Request context middleware for tracking requests
 */
export class RequestContext {
  private static context = new Map<string, Record<string, any>>();

  public static setRequestId(requestId: string): void {
    const logger = StructuredLogger.getInstance();
    logger.setDefaultContext({ requestId });
  }

  public static setUserId(userId: string): void {
    const logger = StructuredLogger.getInstance();
    logger.setDefaultContext({ userId });
  }

  public static clearContext(): void {
    const logger = StructuredLogger.getInstance();
    logger.setDefaultContext({});
  }
}

// Export singleton instance
export const logger = StructuredLogger.getInstance();
