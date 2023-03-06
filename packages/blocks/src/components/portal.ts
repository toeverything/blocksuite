import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Renders a template into a portal. Defaults to `document.body`.
 *
 * @example
 * ```ts
 * render() {
 *   return html`${showPortal
 *     ? html`<affine-portal .template=${portalTemplate}></affine-portal>`
 *     : ""}`;
 * };
 * ```
 */
@customElement('affine-portal')
export class Portal extends LitElement {
  @property()
  public container = document.body;

  @property()
  public template = html``;

  private _portalRoot: HTMLElement | null = null;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._portalRoot?.remove();
  }

  override createRenderRoot() {
    const portalRoot = document.createElement('div');
    portalRoot.classList.add('affine-portal');
    this.container.append(portalRoot);
    this._portalRoot = portalRoot;
    return portalRoot;
  }

  override render() {
    return this.template;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-portal': Portal;
  }
}
