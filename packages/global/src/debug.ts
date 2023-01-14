import { Log, LogLevel } from './log.js';
import color from 'ansi-colors';

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
export function enableDebugLog() {
  color.enabled = true;
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
        [LogLevel.DEBUG]: color.blue,
        [LogLevel.WARN]: color.yellow,
        [LogLevel.INFO]: color.green,
        [LogLevel.TRACE]: color.magenta,
        [LogLevel.ERROR]: color.red,
      };
      console.log(`${colorMap[level](level)} [${tag}]:`, msg, ...params);
    }
  );
}
