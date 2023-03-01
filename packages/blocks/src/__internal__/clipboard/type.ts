import type {
  DefaultPageBlockComponent,
  EdgelessPageBlockComponent,
} from '../../page-block/index.js';

type ClipboardTarget = DefaultPageBlockComponent | EdgelessPageBlockComponent;

export interface Clipboard {
  init(clipboardTarget: ClipboardTarget): void;
  dispose(): void;
}
