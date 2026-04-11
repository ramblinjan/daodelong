// You provide structured logging to every part of the organism.
// I write to stdout as newline-delimited JSON so I am machine-readable and human-scannable.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  plane: string;
  msg: string;
  [key: string]: unknown;
}

function write(level: LogLevel, plane: string, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = { ts: Date.now(), level, plane, msg, ...meta };
  process.stdout.write(JSON.stringify(entry) + '\n');
}

export function createLogger(plane: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => write('debug', plane, msg, meta),
    info:  (msg: string, meta?: Record<string, unknown>) => write('info',  plane, msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => write('warn',  plane, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => write('error', plane, msg, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
