import { EdgelessEdgyMenu } from './toolbar/edgy-menu';
import { EdgelessEdgySeniorButton } from './toolbar/edgy-senior-button';

export function effects() {
  customElements.define('edgeless-edgy-menu', EdgelessEdgyMenu);
  customElements.define('edgeless-edgy-senior-button', EdgelessEdgySeniorButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-edgy-menu': EdgelessEdgyMenu;
    'edgeless-edgy-senior-button': EdgelessEdgySeniorButton;
  }
}
