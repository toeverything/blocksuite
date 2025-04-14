import { CodeBlockComponent } from './code-block';
import {
  AFFINE_CODE_TOOLBAR_WIDGET,
  AffineCodeToolbarWidget,
} from './code-toolbar';
import { AffineCodeToolbar } from './code-toolbar/components/code-toolbar';
import { LanguageListButton } from './code-toolbar/components/lang-button';
import { AffineCodeUnit } from './highlight/affine-code-unit';

export function effects() {
  customElements.define('language-list-button', LanguageListButton);
  customElements.define('affine-code-toolbar', AffineCodeToolbar);
  customElements.define(AFFINE_CODE_TOOLBAR_WIDGET, AffineCodeToolbarWidget);
  customElements.define('affine-code-unit', AffineCodeUnit);
  customElements.define('affine-code', CodeBlockComponent);
}

declare global {
  interface HTMLElementTagNameMap {
    'language-list-button': LanguageListButton;
    'affine-code-toolbar': AffineCodeToolbar;
    [AFFINE_CODE_TOOLBAR_WIDGET]: AffineCodeToolbarWidget;
  }
}
