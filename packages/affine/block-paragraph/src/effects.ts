import type { addParagraphCommand } from './commands/add-paragraph.js';
import type { appendParagraphCommand } from './commands/append-paragraph.js';
import type { dedentParagraphCommand } from './commands/dedent-paragraph.js';
import type { indentParagraphCommand } from './commands/indent-paragraph.js';
import type { splitParagraphCommand } from './commands/split-paragraph.js';
import type { ParagraphBlockService } from './paragraph-service.js';

import { ParagraphBlockComponent } from './paragraph-block.js';

export function effects() {
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
      dedentParagraph: typeof dedentParagraphCommand;
      indentParagraph: typeof indentParagraphCommand;
      splitParagraph: typeof splitParagraphCommand;
    }
    interface CommandContext {
      paragraphConvertedId?: string;
    }
  }
  interface HTMLElementTagNameMap {
    'affine-paragraph': ParagraphBlockComponent;
  }
}
