import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Renders a template into a portal. Defaults to `document.body`.
 *
 * Note that every time the parent component re-renders, the portal will be re-called.
 *
 * See https://lit.dev/docs/components/rendering/#writing-a-good-render()-method
 *
 * @example
 * ```ts
 * render() {
 *   return html`${showPortal
 *     ? html`<blocksuite-portal .template=${portalTemplate}></blocksuite-portal>`
 *     : null}`;
 * };
 * ```
 */
@customElement('blocksuite-portal')
export class Portal extends LitElement {
  private _portalRoot: HTMLElement | null = null;

  override createRenderRoot() {
    const portalRoot = document.createElement('div');
    const renderRoot = this.shadowDom
      ? portalRoot.attachShadow({
          mode: 'open',
          ...(typeof this.shadowDom !== 'boolean' ? this.shadowDom : {}),
        })
      : portalRoot;
    portalRoot.classList.add('blocksuite-portal');
    this.container.append(portalRoot);
    this._portalRoot = portalRoot;
    return renderRoot;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._portalRoot?.remove();
  }

  override render() {
    return this.template;
  }

  @property({ attribute: false })
  accessor container = document.body;

  @property({ attribute: false })
  accessor shadowDom: boolean | ShadowRootInit = true;

  @property({ attribute: false })
  accessor template = html``;
}

declare global {
  interface HTMLElementTagNameMap {
    'blocksuite-portal': Portal;
  }
}
