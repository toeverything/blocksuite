export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]) {
    console.debug(message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    console.info(message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(message, ...args);
  }
}

export class NoopLogger implements Logger {
  debug() {}

  info() {}

  warn() {}

  error() {}
}
