type LogLevel = "INFO" | "WARN" | "ERROR";

function stringifyMeta(meta?: Record<string, unknown>) {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " {\"meta\":\"unserializable\"}";
  }
}

function emit(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
  const line = `[${new Date().toISOString()}] [${level}] [${scope}] ${message}${stringifyMeta(meta)}`;
  if (level === "ERROR") {
    console.error(line);
    return;
  }
  console.log(line);
}

export function createJobLogger(scope: string) {
  return {
    info(message: string, meta?: Record<string, unknown>) {
      emit("INFO", scope, message, meta);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      emit("WARN", scope, message, meta);
    },
    error(message: string, meta?: Record<string, unknown>) {
      emit("ERROR", scope, message, meta);
    },
  };
}

