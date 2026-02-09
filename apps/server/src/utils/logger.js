/**
 * VECTRYS — Logger JSON structuré
 *
 * Format JSON pour Railway / CloudWatch / LogTail.
 * En dev : log lisible. En prod : JSON parsable.
 *
 * @version 1.0.0
 */

export class Logger {
  static #format(level, service, message, data, error) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...(data && { data }),
      ...(error && { error: error.message }),
    });
  }

  static debug(service, message, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.#format('DEBUG', service, message, data));
    }
  }

  static info(service, message, data) {
    console.log(this.#format('INFO', service, message, data));
  }

  static warn(service, message, data) {
    console.warn(this.#format('WARN', service, message, data));
  }

  static error(service, message, error, data) {
    console.error(this.#format('ERROR', service, message, data, error));
  }
}
