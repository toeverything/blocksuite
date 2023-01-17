/**
 * @author Ray Martone
 * @copyright Copyright (c) 2019-2022 Ray Martone
 * @license MIT
 * @description log adapter that provides level based filtering and tagging
 */

/**
 * Useful for implementing a log event hadnelr
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  OFF = 'OFF',
}

/**
 * union
 */
export type LogLevelStr = 'DEBUG' | 'TRACE' | 'INFO' | 'WARN' | 'ERROR' | 'OFF';

/**
 * Level where `ERROR > WARN > INFO`.
 */
enum Level {
  DEBUG = 1,
  TRACE,
  INFO,
  WARN,
  ERROR,
  OFF,
}

export type LogCallback<Tags extends string> = (
  level: LogLevelStr,
  tag: Tags,
  message: unknown,
  optionalParams: unknown[]
) => void;

export const tag: Record<string, string> = {};

export class Log<Tags extends string = string> {
  /**
   * init assigns tags a level or they default to INFO
   * _tagToLevel hash that maps tags to their level
   */
  protected readonly _tagToLevel: Record<string, Level> = {};

  /**
   * callback that supports logging whatever way works best for you!
   */
  protected _callback?: LogCallback<Tags>;

  /**
   * init
   * @param config? JSON that assigns tags levels. If uninitialized,
   *    a tag's level defaults to INFO where ERROR > WARN > INFO.
   * @param callback? supports logging whatever way works best for you
   *  - style terminal output with chalk
   *  - send JSON to a cloud logging service like Splunk
   *  - log strings and objects to the browser console
   *  - combine any of the above based on your app's env
   * @return {this} supports chaining
   */
  init(
    config?: Partial<Record<Tags, LogLevel>>,
    callback?: LogCallback<Tags>
  ): this {
    for (const k in config) {
      this._tagToLevel[k] = Level[config[k] as LogLevelStr] || 1;
    }

    if (callback !== undefined) {
      this._callback = callback;
    }

    for (const key in this._tagToLevel) {
      tag[key] = key;
    }
    return this;
  }

  /**
   * Writes an error to the log
   * @param tag string categorizes a message
   * @param message object to log
   * @param optionalParams optional list of objects to log
   */
  error<T extends Tags>(
    tag: T,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.log(Level.ERROR, tag, message, optionalParams);
  }

  /**
   * Writes a warning to the log
   * @param tag string categorizes a message
   * @param message object to log
   * @param optionalParams optional list of objects to log
   */
  warn<T extends Tags>(
    tag: T,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.log(Level.WARN, tag, message, optionalParams);
  }

  /**
   * Writes info to the log
   * @param tag string categorizes a message
   * @param message object to log
   * @param optionalParams optional list of objects to log
   */
  info<T extends Tags>(
    tag: T,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.log(Level.INFO, tag, message, optionalParams);
  }

  /**
   * Writes trace to the log
   * @param tag string categorizes a message
   * @param message object to log
   * @param optionalParams optional list of objects to log
   */
  trace<T extends Tags>(
    tag: T,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.log(Level.TRACE, tag, message, optionalParams);
  }

  /**
   * Writes debug to the log
   * @param tag string categorizes a message
   * @param message object to log
   * @param optionalParams optional list of objects to log
   */
  debug<T extends Tags>(
    tag: T,
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.log(Level.DEBUG, tag, message, optionalParams);
  }

  private log<T extends Tags>(
    level: Level,
    tag: T,
    message: unknown,
    optionalParams: unknown[]
  ): void {
    if (this._callback && level >= (this._tagToLevel[tag] ?? Level.DEBUG)) {
      this._callback(<LogLevelStr>Level[level], tag, message, optionalParams);
    }
  }
}
