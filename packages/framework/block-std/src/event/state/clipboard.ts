import { UIEventState } from '../base.js';

type ClipboardEventStateOptions = {
  event: ClipboardEvent;
};

export class ClipboardEventState extends UIEventState {
  override type = 'clipboardState';

  raw: ClipboardEvent;

  constructor({ event }: ClipboardEventStateOptions) {
    super(event);

    this.raw = event;
  }
}

declare global {
  interface BlockSuiteUIEventState {
    clipboardState: ClipboardEventState;
  }
}
