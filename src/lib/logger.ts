/**
 * Structured Logging Utility
 *
 * Provides granular, contextual logging for debugging and monitoring.
 * Logs include timestamps, context, and structured metadata.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private context: LogContext = {};
  private isServer = typeof window === 'undefined';

  /**
   * Set persistent context for all logs from this logger instance
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear persistent context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      entry.context?.component ? `[${entry.context.component}]` : '',
      entry.context?.action ? `[${entry.context.action}]` : '',
      entry.message,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Create log entry with metadata
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    additionalContext?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (data !== undefined) {
      entry.data = data;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  /**
   * Output log to console with appropriate styling
   */
  private output(entry: LogEntry) {
    const formatted = this.formatLog(entry);

    // Color coding for different log levels
    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: this.isServer ? '\x1b[90m' : 'color: gray',
      [LogLevel.INFO]: this.isServer ? '\x1b[36m' : 'color: blue',
      [LogLevel.WARN]: this.isServer ? '\x1b[33m' : 'color: orange',
      [LogLevel.ERROR]: this.isServer ? '\x1b[31m' : 'color: red',
    };

    const reset = this.isServer ? '\x1b[0m' : '';

    if (this.isServer) {
      // Server-side: colorized console output
      console.log(`${styles[entry.level]}${formatted}${reset}`);

      if (entry.data !== undefined) {
        console.log(`${styles[entry.level]}  Data:${reset}`, entry.data);
      }

      if (entry.error) {
        console.error(`${styles[LogLevel.ERROR]}  Error:${reset}`, entry.error);
      }
    } else {
      // Client-side: styled console output
      console.log(`%c${formatted}`, styles[entry.level]);

      if (entry.data !== undefined) {
        console.log('  Data:', entry.data);
      }

      if (entry.error) {
        console.error('  Error:', entry.error);
      }
    }

    // In production, you would also send logs to monitoring service
    // Example: Sentry, DataDog, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && entry.level === LogLevel.ERROR) {
      this.sendToMonitoring(entry);
    }
  }

  /**
   * Send error logs to monitoring service (placeholder)
   */
  private sendToMonitoring(entry: LogEntry) {
    // TODO: Implement monitoring service integration
    // Example with Sentry:
    // Sentry.captureException(entry.error, {
    //   contexts: { logger: entry.context },
    //   extra: entry.data,
    // });
  }

  /**
   * DEBUG level logging - detailed debugging information
   */
  debug(message: string, data?: any, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createEntry(LogLevel.DEBUG, message, data, undefined, context);
      this.output(entry);
    }
  }

  /**
   * INFO level logging - general informational messages
   */
  info(message: string, data?: any, context?: LogContext) {
    const entry = this.createEntry(LogLevel.INFO, message, data, undefined, context);
    this.output(entry);
  }

  /**
   * WARN level logging - warning messages
   */
  warn(message: string, data?: any, context?: LogContext) {
    const entry = this.createEntry(LogLevel.WARN, message, data, undefined, context);
    this.output(entry);
  }

  /**
   * ERROR level logging - error messages with optional Error object
   */
  error(message: string, error?: Error, data?: any, context?: LogContext) {
    const entry = this.createEntry(LogLevel.ERROR, message, data, error, context);
    this.output(entry);
  }

  /**
   * Time a function execution
   */
  async time<T>(
    label: string,
    fn: () => Promise<T> | T,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting: ${label}`, undefined, context);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Completed: ${label}`, { duration: `${duration}ms` }, context);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(
        `Failed: ${label}`,
        error as Error,
        { duration: `${duration}ms` },
        context
      );
      throw error;
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export factory for creating contextual loggers
export function createLogger(context: LogContext): Logger {
  return logger.child(context);
}

// Convenience exports for common use cases
export const serverLogger = createLogger({ component: 'SERVER' });
export const clientLogger = createLogger({ component: 'CLIENT' });
export const apiLogger = createLogger({ component: 'API' });
export const dbLogger = createLogger({ component: 'DATABASE' });
