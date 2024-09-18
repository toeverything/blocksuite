import type { AffineTextAttributes } from './extension/index.js';
import type { deleteTextCommand } from './format/delete-text.js';
import type { formatBlockCommand } from './format/format-block.js';
import type { formatNativeCommand } from './format/format-native.js';
import type { formatTextCommand } from './format/format-text.js';
import type {
  getTextStyle,
  isTextStyleActive,
  toggleBold,
  toggleCode,
  toggleItalic,
  toggleLink,
  toggleStrike,
  toggleUnderline,
} from './format/text-style.js';

import { AffineLink, AffineReference } from './inline/index.js';
import { AffineText } from './inline/presets/nodes/affine-text.js';
import { LatexEditorMenu } from './inline/presets/nodes/latex-node/latex-editor-menu.js';
import { LatexEditorUnit } from './inline/presets/nodes/latex-node/latex-editor-unit.js';
import { AffineLatexNode } from './inline/presets/nodes/latex-node/latex-node.js';
import { LinkPopup } from './inline/presets/nodes/link-node/link-popup/link-popup.js';
import { ReferencePopup } from './inline/presets/nodes/reference-node/reference-popup.js';
import { RichText } from './rich-text.js';

export function effects() {
  customElements.define('affine-text', AffineText);
  customElements.define('latex-editor-menu', LatexEditorMenu);
  customElements.define('latex-editor-unit', LatexEditorUnit);
  customElements.define('rich-text', RichText);
  customElements.define('affine-latex-node', AffineLatexNode);
  customElements.define('link-popup', LinkPopup);
  customElements.define('affine-link', AffineLink);
  customElements.define('reference-popup', ReferencePopup);
  customElements.define('affine-reference', AffineReference);
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-latex-node': AffineLatexNode;
    'affine-reference': AffineReference;
    'affine-link': AffineLink;
    'affine-text': AffineText;
    'rich-text': RichText;
    'reference-popup': ReferencePopup;
    'latex-editor-unit': LatexEditorUnit;
    'latex-editor-menu': LatexEditorMenu;
    'link-popup': LinkPopup;
  }
  namespace BlockSuite {
    interface CommandContext {
      textStyle?: AffineTextAttributes;
    }
    interface Commands {
      deleteText: typeof deleteTextCommand;
      formatBlock: typeof formatBlockCommand;
      formatNative: typeof formatNativeCommand;
      formatText: typeof formatTextCommand;
      toggleBold: typeof toggleBold;
      toggleItalic: typeof toggleItalic;
      toggleUnderline: typeof toggleUnderline;
      toggleStrike: typeof toggleStrike;
      toggleCode: typeof toggleCode;
      toggleLink: typeof toggleLink;
      getTextStyle: typeof getTextStyle;
      isTextStyleActive: typeof isTextStyleActive;
    }
  }
}
