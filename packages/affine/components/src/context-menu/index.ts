import { MenuComponent } from './menu.js';

export * from './menu.js';

export function effects() {
  customElements.define('affine-menu', MenuComponent);
}
