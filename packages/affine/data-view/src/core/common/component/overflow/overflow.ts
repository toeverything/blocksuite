import { ShadowlessElement } from '@blocksuite/block-std';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { css, html, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

export class Overflow extends SignalWatcher(WithDisposable(ShadowlessElement)) {
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

  /**
   * cache the count state to avoid flickering
   *
   * the first element is the cache key, which is the width of the container and the number of items
   */
  protected _countCache: [string, number] = ['', -1];

  protected _frameId: number | undefined = undefined;

  adjustStyle(ignoreCache = false) {
    const rectWidth = this.getBoundingClientRect().width;
    const cacheKey = `${rectWidth}-${this.items.length}`;

    if (
      !!ignoreCache &&
      this._countCache[0] === cacheKey &&
      this._countCache[1] !== -1
    ) {
      this.renderCount = this._countCache[1];
      return;
    }

    this._countCache[0] = cacheKey;
    this._countCache[1] = -1;

    let maxWidth = rectWidth - this.more.getBoundingClientRect().width;
    for (let i = 0; i < this.items.length; i++) {
      const width = this.items[i].getBoundingClientRect().width;
      maxWidth -= width;
      if (maxWidth < 0) {
        this.renderCount = i;
        this._countCache[1] = this.renderCount;
        return;
      }
    }
    this.renderCount = this.items.length;
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

  protected override updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
    }

    this._frameId = requestAnimationFrame(() => {
      // when `updated` is invoked, it usually means user has changed the data
      // so any item may change its size, we need to re-calculate the size
      this.adjustStyle(true);
    });
  }

  @queryAll(':scope > .component-overflow-item')
  accessor items!: HTMLDivElement[] & NodeList;

  @query(':scope > .component-overflow-more')
  accessor more!: HTMLDivElement;

  @state()
  accessor renderCount = 0;

  @property({ attribute: false })
  accessor renderItem!: Array<() => TemplateResult>;

  @property({ attribute: false })
  accessor renderMore!: (count: number) => TemplateResult;
}
