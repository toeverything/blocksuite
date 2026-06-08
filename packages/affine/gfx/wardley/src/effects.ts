import { EdgelessWardleyMenu } from './toolbar/wardley-menu';
import { EdgelessWardleySeniorButton } from './toolbar/wardley-senior-button';

export function effects() {
  customElements.define('edgeless-wardley-menu', EdgelessWardleyMenu);
  customElements.define(
    'edgeless-wardley-senior-button',
    EdgelessWardleySeniorButton
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-wardley-menu': EdgelessWardleyMenu;
    'edgeless-wardley-senior-button': EdgelessWardleySeniorButton;
  }
}
