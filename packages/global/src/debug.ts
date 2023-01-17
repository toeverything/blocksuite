import { Log, LogLevel } from './log.js';
import chalk from 'chalk';

export enum Subsystem {
  Global = 'global',
  Editor = 'editor',
  Blocks = 'blocks',
  Phasor = 'phasor',
  Playground = 'playground',
  React = 'react',
  Store = 'store',
}

export const logger = new Log<Subsystem>();
// @ts-expect-error
if (import.meta.hot || import.meta.webpackHot) {
  logger.init(
    {
      [Subsystem.Global]: LogLevel.DEBUG,
      [Subsystem.Editor]: LogLevel.DEBUG,
      [Subsystem.Blocks]: LogLevel.DEBUG,
      [Subsystem.Phasor]: LogLevel.DEBUG,
      [Subsystem.Playground]: LogLevel.DEBUG,
      [Subsystem.React]: LogLevel.DEBUG,
      [Subsystem.Store]: LogLevel.DEBUG,
    },
    (level, tag, msg, params) => {
      if (level === LogLevel.OFF) {
        return;
      }
      const colorMap = {
        [LogLevel.DEBUG]: chalk.blue,
        [LogLevel.WARN]: chalk.yellow,
        [LogLevel.INFO]: chalk.green,
        [LogLevel.TRACE]: chalk.magenta,
        [LogLevel.ERROR]: chalk.red,
      };
      console.log(`${colorMap[level](level)} [${tag}]:`, msg, ...params);
    }
  );
}
