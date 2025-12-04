type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: number;
}

const LOG_HISTORY_LIMIT = 100;
const logHistory: LogEntry[] = [];

function shouldLog(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";
}

function addToHistory(entry: LogEntry): void {
  logHistory.push(entry);
  if (logHistory.length > LOG_HISTORY_LIMIT) {
    logHistory.shift();
  }
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString().substring(11, 23);
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, data?: unknown): void {
    const entry: LogEntry = { level: "debug", message, data, timestamp: Date.now() };
    addToHistory(entry);
    
    if (shouldLog()) {
      if (data !== undefined) {
        console.debug(formatMessage("debug", message), data);
      } else {
        console.debug(formatMessage("debug", message));
      }
    }
  },

  info(message: string, data?: unknown): void {
    const entry: LogEntry = { level: "info", message, data, timestamp: Date.now() };
    addToHistory(entry);
    
    if (shouldLog()) {
      if (data !== undefined) {
        console.info(formatMessage("info", message), data);
      } else {
        console.info(formatMessage("info", message));
      }
    }
  },

  warn(message: string, data?: unknown): void {
    const entry: LogEntry = { level: "warn", message, data, timestamp: Date.now() };
    addToHistory(entry);
    
    if (shouldLog()) {
      if (data !== undefined) {
        console.warn(formatMessage("warn", message), data);
      } else {
        console.warn(formatMessage("warn", message));
      }
    }
  },

  error(message: string, error?: unknown): void {
    const entry: LogEntry = { level: "error", message, data: error, timestamp: Date.now() };
    addToHistory(entry);
    
    if (shouldLog()) {
      if (error !== undefined) {
        console.error(formatMessage("error", message), error);
      } else {
        console.error(formatMessage("error", message));
      }
    }
  },

  getHistory(): ReadonlyArray<LogEntry> {
    return logHistory;
  },

  clearHistory(): void {
    logHistory.length = 0;
  },
};
