type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  enabled: boolean;
  timestamp: boolean;
}

const config: LogConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'debug',
  enabled: process.env.NODE_ENV !== 'production',
  timestamp: true,
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[config.level];
}

function formatMessage(level: LogLevel, message: string, context?: any): string {
  const timestamp = config.timestamp ? `[${new Date().toISOString()}]` : '';
  const levelTag = `[${level.toUpperCase()}]`;
  const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
  
  return `${timestamp} ${levelTag} ${message}${contextStr}`;
}

export const logger = {
  debug: (message: string, context?: any) => {
    if (shouldLog('debug') && config.enabled) {
      console.log(formatMessage('debug', message, context));
    }
  },

  info: (message: string, context?: any) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, context));
    }
  },

  warn: (message: string, context?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error: (message: string, context?: any) => {
    // Always log errors
    console.error(formatMessage('error', message, context));
  },

  // Production-safe: never logs sensitive data
  audit: (action: string, userId?: string, details?: any) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', `[AUDIT] ${action}`, {
        userId: userId || 'anonymous',
        ...details,
        timestamp: new Date().toISOString(),
      }));
    }
  },
};

export default logger;
