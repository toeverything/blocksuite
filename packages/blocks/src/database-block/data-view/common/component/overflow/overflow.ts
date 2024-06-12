import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { css, html, type PropertyValues, type TemplateResult } from 'lit';
import {
  customElement,
  property,
  query,
  queryAll,
  state,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

@customElement('component-overflow')
export class Overflow extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    component-overflow {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      position: relative;
    }

    .component-overflow-item {
    }
    .component-overflow-item.hidden {
      opacity: 0;
      pointer-events: none;
      position: absolute;
    }
  `;

  @property({ attribute: false })
  accessor renderItem!: Array<() => TemplateResult>;

  @property({ attribute: false })
  accessor renderMore!: (count: number) => TemplateResult;

  @state()
  accessor renderCount = 0;

  @queryAll(':scope > .component-overflow-item')
  accessor items!: HTMLDivElement[] & NodeList;

  @query(':scope > .component-overflow-more')
  accessor more!: HTMLDivElement;

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    requestAnimationFrame(() => {
      this.adjustStyle();
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    const resize = new ResizeObserver(() => {
      this.adjustStyle();
    });
    resize.observe(this);
    this.disposables.add(() => {
      resize.unobserve(this);
    });
  }

  adjustStyle() {
    let maxWidth =
      this.getBoundingClientRect().width -
      this.more.getBoundingClientRect().width;
    for (let i = 0; i < this.items.length; i++) {
      const width = this.items[i].getBoundingClientRect().width;
      maxWidth -= width;
      if (maxWidth < 0) {
        this.renderCount = i;
        return;
      }
    }
    this.renderCount = this.items.length;
  }

  override render() {
    return html`
      ${repeat(this.renderItem, (render, index) => {
        const className = classMap({
          'component-overflow-item': true,
          hidden: index >= this.renderCount,
        });
        return html`<div class="${className}">${render()}</div>`;
      })}
      <div class="component-overflow-more">
        ${this.renderMore(this.renderCount)}
      </div>
    `;
  }
}
