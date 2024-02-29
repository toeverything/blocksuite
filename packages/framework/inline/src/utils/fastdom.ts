/**
 * FastDom
 *
 * Eliminates layout thrashing
 * by batching DOM read/write
 * interactions.
 *
 * @author Wilson Page <wilsonpage@me.com>
 * @author Kornel Lesinski <kornel.lesinski@ft.com>
 * MIT Licensed.
 */

type FastDomFunction = () => FastDomFunctionCallback;
type FastDomFunctionCallback = (() => void) | null | undefined | void;

export class FastDom {
  private writes: Array<FastDomFunction>;
  private writesCallbacks: Array<FastDomFunctionCallback>;
  private scheduled: boolean;

  constructor() {
    this.writes = [];
    this.writesCallbacks = [];
    this.scheduled = false;
  }

  mutate(fn: FastDomFunction) {
    this.writes.push(fn);
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => this.flush());
  }

  private flush() {
    let task;
    while ((task = this.writes.shift())) {
      this.writesCallbacks.push(task());
    }
    let callback;
    while ((callback = this.writesCallbacks.shift())) {
      if (callback) {
        callback();
      }
    }
    this.scheduled = false;
    if (this.writes.length) {
      this.scheduleFlush();
    }
  }
}

export const fastdom = new FastDom();
