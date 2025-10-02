import { Platform } from 'react-native';

// Configuração do Google Cloud Logging (via backend)
const LOGGING_ENDPOINT = 'https://alugae.mobi/api/logs';
const LOG_BUFFER_SIZE = 10;
const LOG_BUFFER_TIMEOUT = 5000; // 5 segundos
const APP_VERSION = '1.0.7';
const APP_BUILD = '1';

interface LogEntry {
  '@timestamp': string;
  level: string;
  message: string;
  app: string;
  version: string;
  build: string;
  platform: string;
  os_version: string;
  device_model: string;
  device_id: string;
  user_id?: string;
  session_id?: string;
  error?: {
    message: string;
    stack?: string;
    componentStack?: string;
  };
  context?: Record<string, any>;
  tags: string[];
}

class LoggerService {
  private logBuffer: LogEntry[] = [];
  private bufferTimer: NodeJS.Timeout | null = null;
  private deviceInfo: any = {};
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDeviceInfo();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async initializeDeviceInfo() {
    this.deviceInfo = {
      app: 'alugae-mobile',
      version: APP_VERSION,
      build: APP_BUILD,
      platform: Platform.OS,
      os_version: Platform.Version.toString(),
      device_model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      device_id: this.sessionId,
    };
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = undefined;
  }

  private createLogEntry(level: string, message: string, context?: any): LogEntry {
    return {
      '@timestamp': new Date().toISOString(),
      level,
      message,
      ...this.deviceInfo,
      user_id: this.userId,
      session_id: this.sessionId,
      context: context?.extension || context,
      tags: ['mobile', Platform.OS],
      ...(context?.error && {
        error: {
          message: context.error.message || context.error.toString(),
          stack: context.error.stack,
          componentStack: context.error.componentStack,
        },
      }),
    };
  }

  private async sendLogsToGoogleCloud(logs: LogEntry[]) {
    if (logs.length === 0) return;

    try {
      const response = await fetch(LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          batch_size: logs.length,
          batch_timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to send logs to Google Cloud:', response.status);
      } else {
        console.debug(`Sent ${logs.length} logs to Google Cloud Logging`);
      }
    } catch (error) {
      console.warn('Error sending logs to Google Cloud:', error);
      // Em produção, você pode querer salvar localmente para tentar enviar depois
    }
  }

  private bufferLog(logEntry: LogEntry) {
    this.logBuffer.push(logEntry);

    // Enviar imediatamente se for erro crítico
    if (logEntry.level === 'error' || logEntry.level === 'fatal') {
      this.flushBuffer();
      return;
    }

    // Enviar se atingir o tamanho do buffer
    if (this.logBuffer.length >= LOG_BUFFER_SIZE) {
      this.flushBuffer();
      return;
    }

    // Agendar envio por timeout
    if (!this.bufferTimer) {
      this.bufferTimer = setTimeout(() => {
        this.flushBuffer();
      }, LOG_BUFFER_TIMEOUT);
    }
  }

  private flushBuffer() {
    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
      this.bufferTimer = null;
    }

    if (this.logBuffer.length > 0) {
      const logsToSend = [...this.logBuffer];
      this.logBuffer = [];
      this.sendLogsToGoogleCloud(logsToSend);
    }
  }

  // Métodos públicos de logging
  debug(message: string, context?: any) {
    const logEntry = this.createLogEntry('debug', message, context);
    console.debug(`[DEBUG] ${message}`, context);
    
    if (!__DEV__) {
      this.bufferLog(logEntry);
    }
  }

  info(message: string, context?: any) {
    const logEntry = this.createLogEntry('info', message, context);
    console.info(`[INFO] ${message}`, context);
    this.bufferLog(logEntry);
  }

  warn(message: string, context?: any) {
    const logEntry = this.createLogEntry('warn', message, context);
    console.warn(`[WARN] ${message}`, context);
    this.bufferLog(logEntry);
  }

  error(message: string, error?: Error | any, context?: any) {
    const logEntry = this.createLogEntry('error', message, {
      ...context,
      error,
    });
    console.error(`[ERROR] ${message}`, error, context);
    this.bufferLog(logEntry);
  }

  fatal(message: string, error?: Error | any, context?: any) {
    const logEntry = this.createLogEntry('fatal', message, {
      ...context,
      error,
    });
    console.error(`[FATAL] ${message}`, error, context);
    this.bufferLog(logEntry);
  }

  // Log de eventos de usuário
  logUserEvent(eventName: string, properties?: Record<string, any>) {
    this.info(`User Event: ${eventName}`, {
      event_type: 'user_event',
      event_name: eventName,
      properties,
    });
  }

  // Log de navegação
  logNavigation(from: string, to: string) {
    this.info(`Navigation: ${from} -> ${to}`, {
      event_type: 'navigation',
      from_screen: from,
      to_screen: to,
    });
  }

  // Log de API calls
  logApiCall(method: string, endpoint: string, status?: number, duration?: number, error?: any) {
    const message = `API ${method} ${endpoint} ${status || 'failed'}`;
    const context = {
      event_type: 'api_call',
      method,
      endpoint,
      status,
      duration_ms: duration,
      ...(error && { error }),
    };

    if (error || (status && status >= 400)) {
      this.error(message, error, context);
    } else {
      this.debug(message, context);
    }
  }

  // Força envio imediato de todos os logs
  async flush() {
    this.flushBuffer();
    // Aguarda um pouco para garantir envio
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Singleton
const loggerService = new LoggerService();

// Global error handler
if (!__DEV__) {
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    loggerService.fatal('Unhandled Error', error, {
      is_fatal: isFatal,
      error_type: 'unhandled_exception',
    });

    // Chama o handler original
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}

// Log de console override (apenas em produção)
if (!__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    loggerService.error('Console Error', new Error(args[0]), {
      args: args.slice(1),
    });
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    loggerService.warn('Console Warning', { args });
    originalConsoleWarn.apply(console, args);
  };
}

export default loggerService;
