import { AffineCodeToolbar } from './components/code-toolbar.js';
import { LanguageListButton } from './components/lang-button.js';
import {
  AFFINE_CODE_TOOLBAR_WIDGET,
  AffineCodeToolbarWidget,
} from './index.js';

export function effects() {
  customElements.define('language-list-button', LanguageListButton);
  customElements.define('affine-code-toolbar', AffineCodeToolbar);
  customElements.define(AFFINE_CODE_TOOLBAR_WIDGET, AffineCodeToolbarWidget);
}

declare global {
  interface HTMLElementTagNameMap {
    'language-list-button': LanguageListButton;
    'affine-code-toolbar': AffineCodeToolbar;
    [AFFINE_CODE_TOOLBAR_WIDGET]: AffineCodeToolbarWidget;
  }
}
