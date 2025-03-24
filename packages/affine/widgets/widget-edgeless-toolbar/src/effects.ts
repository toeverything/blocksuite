import { EdgelessToolIconButton } from './button/tool-icon-button';
import { EdgelessToolbarButton } from './button/toolbar-button';
import {
  EDGELESS_TOOLBAR_WIDGET,
  EdgelessToolbarWidget,
} from './edgeless-toolbar';

export function effects() {
  customElements.define(EDGELESS_TOOLBAR_WIDGET, EdgelessToolbarWidget);
  customElements.define('edgeless-toolbar-button', EdgelessToolbarButton);
  customElements.define('edgeless-tool-icon-button', EdgelessToolIconButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-tool-icon-button': EdgelessToolIconButton;
    'edgeless-toolbar-button': EdgelessToolbarButton;
    'edgeless-toolbar-widget': EdgelessToolbarWidget;
  }
}
