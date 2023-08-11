import { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import { assertExists, DisposableGroup } from '@blocksuite/store';
import {
  autoUpdate,
  computePosition,
  inline,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import type { RangeManager } from '../../page-block/text-selection/range-manager.js';
import { isPageComponent } from '../../page-block/utils/guard.js';
import {
  getSelectedContentBlockElements,
  getTextSelection,
} from '../../page-block/utils/selection.js';
import { ActionItems } from './component.ts/action-items.js';
import { InlineItems } from './component.ts/inline-items.js';
import { ParagraphButton } from './component.ts/paragraph-button.js';
import { formatBarStyle } from './styles.js';

type CustomElementCreator = (
  formatBar: AffineFormatBarWidget
) => HTMLDivElement;

export const AFFINE_FORMAT_BAR_WIDGET_TAG = 'affine-format-bar-widget';

@customElement(AFFINE_FORMAT_BAR_WIDGET_TAG)
export class AffineFormatBarWidget extends WidgetElement {
  static override styles = formatBarStyle;
  static readonly customElements: Set<CustomElementCreator> =
    new Set<CustomElementCreator>();

  @query('.custom-items')
  customItemsContainer!: HTMLElement;

  private _customElements: HTMLDivElement[] = [];

  private get _selectionManager() {
    return this.root.selectionManager;
  }

  private get _formatBarElement() {
    const shadowRoot = this.shadowRoot;
    assertExists(shadowRoot);
    return shadowRoot.querySelector(
      `.${AFFINE_FORMAT_BAR_WIDGET_TAG}`
    ) as HTMLElement | null;
  }

  private _dragging = false;
  private _displayType: 'text' | 'block' | 'none' = 'none';

  private _selectedBlockElements: BlockElement[] = [];

  private _abortController = new AbortController();

  private _rangeManager: RangeManager | null = null;

  private _placement: Placement = 'top';

  private _reset() {
    this._displayType = 'none';
    this._selectedBlockElements = [];
    this._rangeManager = null;
  }

  private _shouldDisplay() {
    return (
      this._displayType !== 'none' &&
      this._selectedBlockElements.length > 0 &&
      !this._dragging
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this._abortController = new AbortController();

    const pageElement = this.pageElement;
    assertExists(pageElement);
    const widgets = pageElement.widgets;

    // check if the host use the format bar widget
    if (!Object.hasOwn(widgets, AFFINE_FORMAT_BAR_WIDGET_TAG)) {
      return;
    }

    // check if format bar widget support the host
    if (!isPageComponent(pageElement)) {
      throw new Error(
        `format bar not support pageElement: ${pageElement.constructor.name} but its widgets has format bar`
      );
    }

    this._disposables.add(
      this.root.uiEventDispatcher.add('dragStart', () => {
        this._dragging = true;
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.root.uiEventDispatcher.add('dragEnd', () => {
        this._dragging = false;
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.root.uiEventDispatcher.add('pointerUp', ctx => {
        if (this._displayType === 'text') {
          if (this._rangeManager) {
            const e = ctx.get('pointerState');
            const range = this._rangeManager.value;
            const rangeRect = range.getBoundingClientRect();
            if (e.y < rangeRect.top + rangeRect.height / 2) {
              this._placement = 'top';
            } else {
              this._placement = 'bottom';
            }
          }
        } else if (this._displayType === 'block') {
          const e = ctx.get('pointerState');
          const blockElement = this._selectedBlockElements[0];
          if (!blockElement) {
            return;
          }
          const blockRect = blockElement.getBoundingClientRect();
          if (e.y < blockRect.bottom) {
            this._placement = 'top';
          } else {
            this._placement = 'bottom';
          }
        }
      })
    );

    this._disposables.add(
      this._selectionManager.slots.changed.on(async selections => {
        await this.updateComplete;
        const textSelection = getTextSelection(pageElement);
        const blockSelections = selections.filter(
          selection => selection instanceof BlockSelection
        ) as BlockSelection[];

        if (textSelection) {
          if (!textSelection.isCollapsed()) {
            this._displayType = 'text';
            assertExists(pageElement.rangeManager);
            this._rangeManager = pageElement.rangeManager;
            this._selectedBlockElements =
              getSelectedContentBlockElements(pageElement);
          } else {
            this._reset();
          }
        } else if (blockSelections.length > 0) {
          this._displayType = 'block';
          this._selectedBlockElements = blockSelections
            .map(selection => {
              const path = selection.path;
              return this.pageElement.root.viewStore.viewFromPath(
                'block',
                path
              );
            })
            .filter((el): el is BlockElement => !!el);
        } else {
          this._reset();
        }

        this.requestUpdate();
      })
    );
  }

  override update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    if (
      this._customElements.length === 0 &&
      AffineFormatBarWidget.customElements.size !== 0
    ) {
      this._customElements = [...AffineFormatBarWidget.customElements].map(
        element => element(this)
      );
      this.customItemsContainer.append(...this._customElements);
      this._disposables.add(() => {
        this._customElements.forEach(element => {
          element.remove();
        });
        this._customElements = [];
        this.customItemsContainer.replaceChildren();
      });
    }
  }

  private _floatDisposables: DisposableGroup | null = null;
  override updated() {
    if (this._shouldDisplay()) {
      this._floatDisposables = new DisposableGroup();

      const formatQuickBarElement = this._formatBarElement;
      assertExists(formatQuickBarElement, 'format quick bar should exist');
      if (this._displayType === 'text') {
        assertExists(this._rangeManager, 'range controller should exist');
        const range = this._rangeManager.value;
        const visualElement = {
          getBoundingClientRect: () => range.getBoundingClientRect(),
          getClientRects: () => range.getClientRects(),
        };

        this._floatDisposables.add(
          autoUpdate(visualElement, formatQuickBarElement, () => {
            computePosition(visualElement, formatQuickBarElement, {
              placement: this._placement,
              middleware: [
                offset(10),
                inline(),
                shift({
                  padding: 6,
                }),
              ],
            }).then(({ x, y }) => {
              formatQuickBarElement.style.top = `${y}px`;
              formatQuickBarElement.style.left = `${x}px`;
            });
          })
        );
      } else if (this._displayType === 'block') {
        const firstBlockElement = this._selectedBlockElements[0];
        let rect = firstBlockElement.getBoundingClientRect();
        this._selectedBlockElements.forEach(el => {
          const elRect = el.getBoundingClientRect();
          if (elRect.top < rect.top) {
            rect = new DOMRect(rect.left, elRect.top, rect.width, rect.bottom);
          }
          if (elRect.bottom > rect.bottom) {
            rect = new DOMRect(rect.left, rect.top, rect.width, elRect.bottom);
          }
          if (elRect.left < rect.left) {
            rect = new DOMRect(elRect.left, rect.top, rect.right, rect.bottom);
          }
          if (elRect.right > rect.right) {
            rect = new DOMRect(rect.left, rect.top, elRect.right, rect.bottom);
          }
        });
        const visualElement = {
          getBoundingClientRect: () => rect,
          getClientRects: () =>
            this._selectedBlockElements.map(el => el.getBoundingClientRect()),
        };

        this._floatDisposables.add(
          autoUpdate(visualElement, formatQuickBarElement, () => {
            computePosition(visualElement, formatQuickBarElement, {
              placement: this._placement,
              middleware: [
                offset(10),
                inline(),
                shift({
                  padding: 6,
                }),
              ],
            }).then(({ x, y }) => {
              formatQuickBarElement.style.top = `${y}px`;
              formatQuickBarElement.style.left = `${x}px`;
            });
          })
        );
      }
    } else {
      if (this._floatDisposables) {
        this._floatDisposables.dispose();
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController.abort();
    this._reset();
  }

  override render() {
    if (!this._shouldDisplay()) {
      return nothing;
    }

    const pageElement = this.pageElement;
    assertExists(pageElement);

    if (!isPageComponent(pageElement)) {
      throw new Error('format bar should be hosted by page component');
    }

    const selectedBlockElements = this._selectedBlockElements;
    const page = this.page;

    //TODO: format bar in database

    const paragraphButton = ParagraphButton({
      pageElement,
      formatBar: this,
      selectedBlockElements,
      page,
    });
    const actionItems = ActionItems(pageElement);
    const inlineItems = InlineItems({ pageElement });

    return html`<div
      class=${AFFINE_FORMAT_BAR_WIDGET_TAG}
      @pointerdown=${stopPropagation}
    >
      <div class="custom-items"></div>
      ${this._customElements.length > 0
        ? html`<div class="divider"></div>`
        : nothing}
      ${paragraphButton}
      <div class="divider"></div>
      ${inlineItems}
      ${inlineItems.length ? html`<div class="divider"></div>` : nothing}
      ${actionItems}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_FORMAT_BAR_WIDGET_TAG]: AffineFormatBarWidget;
  }
}
