import { Logger } from './logger';

export class LoggerFactory {
  createLogger(componentName: string, buffer: string): Logger {
    return new Logger(componentName, buffer);
  }
}
