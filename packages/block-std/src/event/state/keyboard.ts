import { UIEventState } from '../base.js';

type KeyboardEventStateOptions = {
  event: KeyboardEvent;
};

export class KeyboardEventState extends UIEventState {
  override type = 'keyboardState';

  raw: KeyboardEvent;

  constructor({ event }: KeyboardEventStateOptions) {
    super(event);

    this.raw = event;
  }
}

declare global {
  interface BlockSuiteUIEventState {
    keyboardState: KeyboardEventState;
  }
}
