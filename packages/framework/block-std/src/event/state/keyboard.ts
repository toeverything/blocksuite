import { UIEventState } from '../base.js';

type KeyboardEventStateOptions = {
  composing: boolean;
  event: KeyboardEvent;
};

export class KeyboardEventState extends UIEventState {
  composing: boolean;

  raw: KeyboardEvent;

  override type = 'keyboardState';

  constructor({ composing, event }: KeyboardEventStateOptions) {
    super(event);

    this.raw = event;
    this.composing = composing;
  }
}

declare global {
  interface BlockSuiteUIEventState {
    keyboardState: KeyboardEventState;
  }
}
