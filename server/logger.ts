type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.DEBUG === "true";
}

function formatMessage(level: LogLevel, message: string, source = "server"): string {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${formattedTime} [${source}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, source = "server"): void {
    if (shouldLog()) {
      console.debug(formatMessage("debug", message, source));
    }
  },

  info(message: string, source = "server"): void {
    console.info(formatMessage("info", message, source));
  },

  warn(message: string, source = "server"): void {
    console.warn(formatMessage("warn", message, source));
  },

  error(message: string, error?: unknown): void {
    console.error(formatMessage("error", message));
    if (error !== undefined) {
      console.error(error);
    }
  },

  log(message: string, source = "express"): void {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
  },
};
