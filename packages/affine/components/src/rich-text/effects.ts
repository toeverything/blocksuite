import './format/delete-text.js';
import './format/format-block.js';
import './format/format-native.js';
import './format/format-text.js';
import './format/text-style.js';
import { AffineLink, AffineReference } from './inline/index.js';
import { AffineText } from './inline/presets/nodes/affine-text.js';
import './inline/presets/nodes/index.js';
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
