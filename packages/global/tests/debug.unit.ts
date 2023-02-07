import {
  debug,
  disableDebuglog,
  enableDebugLog,
} from '@blocksuite/global/debug';
import { describe, expect, test, vi } from 'vitest';

const LOG_TAG = 'tag';
class A {
  @debug(LOG_TAG)
  test() {
    return 1;
  }
}

describe('debug', () => {
  test('debug', () => {
    const a = new A();
    enableDebugLog('no');
    console.log = vi.fn();
    a.test();

    // enableDebugLog
    expect(console.log).not.toBeCalled();
    enableDebugLog(LOG_TAG);
    a.test();
    expect(console.log).toBeCalledTimes(1);

    // disableDebugLog
    disableDebuglog('no');
    a.test();
    expect(console.log).toBeCalledTimes(2);
    disableDebuglog(LOG_TAG);
    a.test();
    expect(console.log).toBeCalledTimes(2);
  });
});
