import type { IndentContext } from '@blocksuite/affine-shared/types';

import type { addParagraphCommand } from './commands/add-paragraph.js';
import type { appendParagraphCommand } from './commands/append-paragraph.js';
import type {
  canDedentParagraphCommand,
  dedentParagraphCommand,
} from './commands/dedent-paragraph.js';
import type {
  canIndentParagraphCommand,
  indentParagraphCommand,
} from './commands/indent-paragraph.js';
import type { splitParagraphCommand } from './commands/split-paragraph.js';
import type { ParagraphBlockService } from './paragraph-service.js';

import { effects as ParagraphHeadingIconEffects } from './heading-icon.js';
import { ParagraphBlockComponent } from './paragraph-block.js';

export function effects() {
  ParagraphHeadingIconEffects();
  customElements.define('affine-paragraph', ParagraphBlockComponent);
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:paragraph': ParagraphBlockService;
    }
    interface Commands {
      addParagraph: typeof addParagraphCommand;
      appendParagraph: typeof appendParagraphCommand;
      canIndentParagraph: typeof canIndentParagraphCommand;
      canDedentParagraph: typeof canDedentParagraphCommand;
      dedentParagraph: typeof dedentParagraphCommand;
      indentParagraph: typeof indentParagraphCommand;
      splitParagraph: typeof splitParagraphCommand;
    }
    interface CommandContext {
      paragraphConvertedId?: string;
      indentContext?: IndentContext;
    }
  }
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
