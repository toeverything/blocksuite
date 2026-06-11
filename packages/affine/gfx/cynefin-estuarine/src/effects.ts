import { EdgelessCynefinEstuarineMenu } from './toolbar/menu';
import { EdgelessCynefinEstuarineSeniorButton } from './toolbar/senior-button';

export function effects() {
  customElements.define(
    'edgeless-cynefin-estuarine-menu',
    EdgelessCynefinEstuarineMenu
  );
  customElements.define(
    'edgeless-cynefin-estuarine-senior-button',
    EdgelessCynefinEstuarineSeniorButton
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-cynefin-estuarine-menu': EdgelessCynefinEstuarineMenu;
    'edgeless-cynefin-estuarine-senior-button': EdgelessCynefinEstuarineSeniorButton;
  }
}
