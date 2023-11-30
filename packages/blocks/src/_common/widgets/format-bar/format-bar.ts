import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import {
  autoUpdate,
  computePosition,
  inline,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { stopPropagation } from '../../../_common/utils/event.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import { ActionItems } from './components/action-items.js';
import { InlineItems } from './components/inline-items.js';
import { ParagraphButton } from './components/paragraph-button.js';
import { formatBarStyle } from './styles.js';

type CustomElementCreator = (
  formatBar: AffineFormatBarWidget
) => HTMLDivElement;

export const AFFINE_FORMAT_BAR_WIDGET = 'affine-format-bar-widget';

@customElement(AFFINE_FORMAT_BAR_WIDGET)
export class AffineFormatBarWidget extends WidgetElement {
  static override styles = formatBarStyle;
  static readonly customElements: Set<CustomElementCreator> =
    new Set<CustomElementCreator>();

  @query('.custom-items')
  customItemsContainer!: HTMLElement;

  @query(`.${AFFINE_FORMAT_BAR_WIDGET}`)
  private _formatBarElement?: HTMLElement;

  private _customElements: HTMLDivElement[] = [];

  private get _selectionManager() {
    return this.root.selection;
  }

  private _dragging = false;

  private _displayType: 'text' | 'block' | 'native' | 'none' = 'none';
  get displayType() {
    return this._displayType;
  }

  private _selectedBlockElements: BlockElement[] = [];
  get selectedBlockElements() {
    return this._selectedBlockElements;
  }

  get nativeRange() {
    const sl = document.getSelection();
    if (!sl || sl.rangeCount === 0) return null;
    const range = sl.getRangeAt(0);
    return range;
  }

  private _abortController = new AbortController();

  private _placement: Placement = 'top';

  private _reset() {
    this._displayType = 'none';
    this._selectedBlockElements = [];
  }

  private _shouldDisplay() {
    //TODO: adapt detail panel
    const layout = document.querySelector('side-layout-modal');
    if (layout) return false;

    if (
      this.displayType === 'block' &&
      this._selectedBlockElements?.[0]?.flavour === 'affine:surface-ref'
    ) {
      return false;
    }

    const readonly = this.page.awarenessStore.isReadonly(this.page);
    return !readonly && this.displayType !== 'none' && !this._dragging;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._abortController = new AbortController();

    const pageElement = this.blockElement;
    assertExists(pageElement);
    const widgets = pageElement.widgets;

    // check if the host use the format bar widget
    if (!Object.hasOwn(widgets, AFFINE_FORMAT_BAR_WIDGET)) {
      return;
    }

    // check if format bar widget support the host
    if (!isPageComponent(pageElement)) {
      throw new Error(
        `format bar not support pageElement: ${pageElement.constructor.name} but its widgets has format bar`
      );
    }

    this.disposables.add(
      this.root.event.add('dragStart', () => {
        this._dragging = true;
        this.requestUpdate();
      })
    );

    this.disposables.add(
      this.root.event.add('dragEnd', () => {
        this._dragging = false;
        this.requestUpdate();
      })
    );

    // calculate placement
    this.disposables.add(
      this.root.event.add('pointerUp', ctx => {
        if (this.displayType === 'text' || this.displayType === 'native') {
          const range = this.nativeRange;
          assertExists(range);
          const e = ctx.get('pointerState');
          const rangeRect = range.getBoundingClientRect();
          if (e.y < rangeRect.top + rangeRect.height / 2) {
            this._placement = 'top';
          } else {
            this._placement = 'bottom';
          }
        } else if (this.displayType === 'block') {
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

    // listen to selection change
    this.disposables.add(
      this._selectionManager.slots.changed.on(async () => {
        await this.updateComplete;
        const textSelection = pageElement.selection.find('text');
        const blockSelections = pageElement.selection.filter('block');

        if (textSelection) {
          const block = this.root.view.viewFromPath(
            'block',
            textSelection.path
          );
          if (
            !textSelection.isCollapsed() &&
            block &&
            block.model.role === 'content'
          ) {
            this._displayType = 'text';
            assertExists(pageElement.root.rangeManager);

            this.root.std.command
              .pipe()
              .withRoot()
              .getTextSelection()
              .getSelectedBlocks({
                types: ['text'],
              })
              .inline(ctx => {
                const { selectedBlocks } = ctx;
                assertExists(selectedBlocks);
                this._selectedBlockElements = selectedBlocks;
              })
              .run();
          } else {
            this._reset();
          }
        } else if (blockSelections.length > 0) {
          this._displayType = 'block';
          this._selectedBlockElements = blockSelections
            .map(selection => {
              const path = selection.path;
              return this.blockElement.root.view.viewFromPath('block', path);
            })
            .filter((el): el is BlockElement => !!el);
        } else {
          this._reset();
        }

        this.requestUpdate();
      })
    );
    this.disposables.addFromEvent(document, 'selectionchange', () => {
      const databaseSelection = this.root.selection.find('database');
      const reset = () => {
        this._reset();
        this.requestUpdate();
      };
      if (databaseSelection) {
        const viewSelection = databaseSelection.viewSelection;
        // check table selection
        if (viewSelection.type === 'table' && !viewSelection.isEditing)
          return reset();
        // check kanban selection
        if (
          (viewSelection.type === 'kanban' &&
            viewSelection.selectionType !== 'cell') ||
          !viewSelection.isEditing
        )
          return reset();

        const range = this.nativeRange;

        if (!range || range.collapsed) return reset();
        this._displayType = 'native';
        this.requestUpdate();
      }
    });
  }

  private _floatDisposables: DisposableGroup | null = null;
  override updated() {
    if (!this._shouldDisplay()) {
      if (this._floatDisposables) {
        this._floatDisposables.dispose();
      }
      return;
    }
    if (
      this._customElements.length === 0 &&
      AffineFormatBarWidget.customElements.size !== 0
    ) {
      this._customElements = Array.from(
        AffineFormatBarWidget.customElements
      ).map(element => element(this));
      this.customItemsContainer.append(...this._customElements);
      this._disposables.add(() => {
        this._customElements.forEach(element => {
          element.remove();
        });
        this._customElements = [];
        this.customItemsContainer.replaceChildren();
      });
    }

    this._floatDisposables = new DisposableGroup();

    const formatQuickBarElement = this._formatBarElement;
    assertExists(formatQuickBarElement, 'format quick bar should exist');
    if (this.displayType === 'text' || this.displayType === 'native') {
      const range = this.nativeRange;
      if (!range) {
        return;
      }

      let rangeRect = range.getClientRects();

      const visualElement = {
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => rangeRect,
      };

      this._floatDisposables.add(
        autoUpdate(
          visualElement,
          formatQuickBarElement,
          () => {
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
              formatQuickBarElement.style.display = 'flex';
              formatQuickBarElement.style.top = `${y}px`;
              formatQuickBarElement.style.left = `${x}px`;
              this.root.event.add('wheel', () => {
                rangeRect = range.getClientRects();
              });
            });
          },
          {
            // follow edgeless viewport update
            animationFrame: true,
          }
        )
      );
    } else if (this.displayType === 'block') {
      const firstBlockElement = this._selectedBlockElements[0];
      let rect = firstBlockElement?.getBoundingClientRect();

      if (!rect) return;

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
        autoUpdate(
          visualElement,
          formatQuickBarElement,
          () => {
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
              formatQuickBarElement.style.display = 'flex';
              formatQuickBarElement.style.top = `${y}px`;
              formatQuickBarElement.style.left = `${x}px`;
            });
          },
          {
            // follow edgeless viewport update
            animationFrame: true,
          }
        )
      );
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

    const paragraphButton = ParagraphButton(this);
    const inlineItems = InlineItems(this);
    const actionItems = ActionItems(this);

    const renderList = [
      AffineFormatBarWidget.customElements.size > 0
        ? html`<div class="custom-items"></div>`
        : null,
      paragraphButton,
      inlineItems,
      actionItems,
    ].filter(el => !!el) as (TemplateResult<1> | TemplateResult<1>[])[];
    const renderListWithDivider = renderList.reduce<
      (TemplateResult<1> | TemplateResult<1>[])[]
    >(
      (acc, el, i) =>
        i === renderList.length - 1
          ? [...acc, el]
          : [...acc, el, html`<div class="divider"></div>`],
      []
    );

    return html`<div
      class=${AFFINE_FORMAT_BAR_WIDGET}
      @pointerdown=${stopPropagation}
    >
      ${renderListWithDivider}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_FORMAT_BAR_WIDGET]: AffineFormatBarWidget;
  }
}
