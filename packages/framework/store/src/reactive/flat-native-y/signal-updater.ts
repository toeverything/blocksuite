import { isPureObject } from '../is-pure-object';
import type { CreateProxyOptions } from './types';

type UpdateSignalOptions = Pick<
  CreateProxyOptions,
  'shouldByPassSignal' | 'root' | 'onChange' | 'byPassSignalUpdate' | 'basePath'
> & {
  firstKey: string;
  value: unknown;
  handleNestedUpdate: (signalKey: string) => void;
};

export function signalUpdater({
  root,
  firstKey,
  shouldByPassSignal,
  byPassSignalUpdate,
  onChange,
  basePath,
  value,
  handleNestedUpdate,
}: UpdateSignalOptions): void {
  const isRoot = !basePath;
  if (shouldByPassSignal()) {
    return;
  }

  const signalKey = `${firstKey}$`;
  if (!(signalKey in root)) {
    if (!isRoot) {
      return;
    }
    handleNestedUpdate(signalKey);
    return;
  }
  byPassSignalUpdate(() => {
    const prev = root[firstKey];
    const next = isRoot
      ? value
      : isPureObject(prev)
        ? { ...prev }
        : Array.isArray(prev)
          ? [...prev]
          : prev;
    // @ts-expect-error allow magic props
    root[signalKey].value = next;
    onChange?.(firstKey, true);
  });
}
