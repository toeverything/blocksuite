import { BlockSelection, TextSelection } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/lit';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';
import {
  computePosition,
  inline,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import { html, nothing, type PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { stopPropagation } from '../../__internal__/utils/event.js';
import { getBlockElementByModel } from '../../__internal__/utils/query.js';
import { DefaultPageService } from '../../page-block/default/default-page-service.js';
import type { RangeController } from '../../page-block/default/selection-manager/range-controller.js';
import { getCurrentCombinedFormat } from '../../page-block/utils/container-operations.js';
import { ActionItems } from './components/action-items.js';
import { InlineItems } from './components/inline-items.js';
import { ParagraphButton } from './components/paragraph-button.js';
import { formatBarStyle } from './styles.js';

type CustomElementCreator = (
  formatBar: AffineFormatBarWidget
) => HTMLDivElement;

export const AFFINE_FORMAT_BAR_WIDGET_TAG = 'affine-format-bar-widget';

@customElement(AFFINE_FORMAT_BAR_WIDGET_TAG)
export class AffineFormatBarWidget extends WidgetElement {
  static override styles = formatBarStyle;
  static customElements: CustomElementCreator[] = [];

  paragraphPanelMaxHeight: string | null = null;

  @query('.custom-items')
  customItemsContainer!: HTMLElement;

  private _customElements: HTMLDivElement[] = [];

  private get _selectionManager() {
    return this.root.selectionManager;
  }

  private get _formatBarElement() {
    return this.querySelector(
      `.${AFFINE_FORMAT_BAR_WIDGET_TAG}`
    ) as HTMLElement | null;
  }

  private _display = false;
  private _displayType: 'text' | 'block' | 'none' = 'none';

  private _selectedModels: BaseBlockModel[] = [];

  private _abortController = new AbortController();

  private _rangeController: RangeController | null = null;

  private _placement: Placement = 'top';

  private _reset() {
    this._displayType = 'none';
    this._selectedModels = [];
    this._rangeController = null;
  }

  private _shouldDisplay() {
    return (
      this._displayType !== 'none' &&
      this._selectedModels.length > 0 &&
      this._display
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this._abortController = new AbortController();

    const host = this.hostElement;
    assertExists(host);
    const widgets = host.widgets;

    // check if the host use the format bar widget
    if (!Object.hasOwn(widgets, 'formatBar')) {
      return;
    }

    // check if format bar widget support the host (page and edgeless)
    //TODO: adapt to edgeless
    const service = this.root.blockStore.specStore.getService(host.flavour);
    if (!(service instanceof DefaultPageService)) {
      return;
    }

    this._disposables.add(
      this.root.uiEventDispatcher.add('dragStart', () => {
        this._display = false;
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.root.uiEventDispatcher.add('dragEnd', () => {
        this._display = true;
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.root.uiEventDispatcher.add('pointerUp', ctx => {
        if (this._displayType === 'text') {
          if (this._rangeController) {
            const e = ctx.get('pointerState');
            const range = this._rangeController.value;
            const rangeRect = range.getBoundingClientRect();
            if (e.y < rangeRect.top + rangeRect.height / 2) {
              this._placement = 'top';
            } else {
              this._placement = 'bottom';
            }
          }
        } else if (this._displayType === 'block') {
          const e = ctx.get('pointerState');
          const blockModel = this._selectedModels[0];
          const blockElement = getBlockElementByModel(blockModel);
          assertExists(blockElement);
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
      this._selectionManager.slots.changed.on(selections => {
        if (selections.length === 0) {
          this._reset();
          this.requestUpdate();
          return;
        }

        const textSelection = selections.find(
          selection => selection instanceof TextSelection
        ) as TextSelection;
        const blockSelections = selections.filter(
          selection => selection instanceof BlockSelection
        );

        if (textSelection) {
          if (!textSelection.isCollapsed()) {
            this._displayType = 'text';

            this._rangeController = service.rangeController;
            this._selectedModels = this._rangeController.getSelectedBlocks(
              this._rangeController.value
            );
          } else {
            this._reset();
          }
        } else if (blockSelections.length > 0) {
          this._displayType = 'block';

          this._selectedModels = blockSelections.map(selection => {
            const block = this.page.getBlockById(selection.blockId);
            assertExists(block);
            return block;
          });
        }

        this.requestUpdate();
      })
    );
  }

  override update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    if (
      this._customElements.length === 0 &&
      AffineFormatBarWidget.customElements.length !== 0
    ) {
      this._customElements = AffineFormatBarWidget.customElements.map(element =>
        element(this)
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

  override updated() {
    const formatQuickBarElement = this._formatBarElement;
    assertExists(formatQuickBarElement, 'format quick bar should exist');
    if (this._shouldDisplay()) {
      formatQuickBarElement.style.display = 'flex';
      if (this._displayType === 'text') {
        assertExists(this._rangeController, 'range controller should exist');
        const range = this._rangeController.value;
        const visualElement = {
          getBoundingClientRect: () => range.getBoundingClientRect(),
          getClientRects: () => range.getClientRects(),
        };
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
      } else if (this._displayType === 'block') {
        const selectedBlockElements = this._selectedModels.map(blockModel => {
          const blockElement = getBlockElementByModel(blockModel);
          assertExists(blockElement);
          return blockElement;
        });
        const firstBlockElement = selectedBlockElements[0];
        let rect = firstBlockElement.getBoundingClientRect();
        selectedBlockElements.forEach(el => {
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
            selectedBlockElements.map(el => el.getBoundingClientRect()),
        };
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
      }
    } else {
      formatQuickBarElement.style.display = 'none';
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController.abort();
    this._reset();
  }

  override render() {
    const selectedModels = this._selectedModels;
    const page = this.page;
    const abortController = this._abortController;
    const format = getCurrentCombinedFormat(this.page);

    //TODO: format bar in database

    const paragraphButton = ParagraphButton({
      formatBar: this,
      selectedModels,
      page,
    });
    const actionItems = ActionItems({
      page,
    });
    const inlineItems = InlineItems({
      page,
      format,
      abortController,
    });

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
    'affine-format-bar-widget': AffineFormatBarWidget;
  }
}
