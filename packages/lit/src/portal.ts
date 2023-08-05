import {
  html,
  LitElement,
  render,
  type RenderOptions,
  type TemplateResult,
} from 'lit';
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
 *     ? html`<affine-portal .template=${portalTemplate}></affine-portal>`
 *     : null}`;
 * };
 * ```
 */
@customElement('affine-portal')
export class Portal extends LitElement {
  @property({ attribute: false })
  public container = document.body;

  @property({ attribute: false })
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

/**
 * Similar to `<affine-portal>`, but only renders once when called.
 *
 * The template should be a **static** template since it will not be re-rendered.
 *
 * See {@link Portal} for more details.
 */
export function createLitPortal({
  template,
  container = document.body,
  abortController = new AbortController(),
  renderOptions,
  identifyWrapper = true,
}: {
  template: TemplateResult<1>;
  container?: HTMLElement;
  abortController?: AbortController;
  renderOptions?: RenderOptions;
  /**
   * Defaults to `true`.
   * If true, the portalRoot will be added a class `affine-portal`. It's useful for finding the portalRoot.
   */
  identifyWrapper?: boolean;
}) {
  const portalRoot = document.createElement('div');
  if (identifyWrapper) {
    portalRoot.classList.add('affine-portal');
  }

  abortController.signal.addEventListener('abort', () => {
    portalRoot.remove();
  });

  render(template, portalRoot, renderOptions);
  container.append(portalRoot);
  return portalRoot;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-portal': Portal;
  }
}
