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
import { matchFlavours } from '../../../_common/utils/model.js';
import { isPageComponent } from '../../../page-block/utils/guard.js';
import { ActionItems } from './components/action-items.js';
import { InlineItems } from './components/inline-items.js';
import { ParagraphButton } from './components/paragraph-button.js';
import { formatBarStyle } from './styles.js';

type FormatBarCustomAction = {
  disable?: (formatBar: AffineFormatBarWidget) => boolean;
  icon(formatBar: AffineFormatBarWidget): string | undefined;
  onClick(formatBar: AffineFormatBarWidget): void;
};
type FormatBarCustomElement = {
  showWhen?(formatBar: AffineFormatBarWidget): boolean;
  init(formatBar: AffineFormatBarWidget): HTMLElement;
};
type FormatBarCustomRenderer = {
  render(formatBar: AffineFormatBarWidget): TemplateResult | undefined;
};
export const AFFINE_FORMAT_BAR_WIDGET = 'affine-format-bar-widget';

@customElement(AFFINE_FORMAT_BAR_WIDGET)
export class AffineFormatBarWidget extends WidgetElement {
  static override styles = formatBarStyle;
  private static readonly _customElements: Set<FormatBarCustomRenderer> =
    new Set<FormatBarCustomRenderer>();

  static registerCustomRenderer(render: FormatBarCustomRenderer) {
    this._customElements.add(render);
  }
  static registerCustomElement(element: FormatBarCustomElement) {
    let elementInstance: HTMLElement | undefined;
    this._customElements.add({
      ...element,
      render: formatBar => {
        if (!elementInstance) {
          elementInstance = element.init(formatBar);
        }
        const show = element.showWhen?.(formatBar) ?? true;
        return show ? html`${elementInstance}` : undefined;
      },
    });
  }

  static registerCustomAction(action: FormatBarCustomAction) {
    this._customElements.add({
      render: formatBar => {
        const url = action.icon(formatBar);
        if (url == null) {
          return;
        }
        const disable = action.disable ? action.disable(formatBar) : false;
        const click = () => {
          if (!disable) {
            action.onClick(formatBar);
          }
        };
        return html`<icon-button
          size="32px"
          ?disabled=${disable}
          @click=${click}
        >
          <img src="${url}" alt="" />
        </icon-button>`;
      },
    });
  }

  @query(`.${AFFINE_FORMAT_BAR_WIDGET}`)
  formatBarElement?: HTMLElement;

  private get _selectionManager() {
    return this.host.selection;
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

    if (
      this.displayType === 'block' &&
      this._selectedBlockElements.length === 1
    ) {
      const selectedBlock = this._selectedBlockElements[0];
      if (
        !matchFlavours(selectedBlock.model, ['affine:paragraph', 'affine:list'])
      ) {
        return false;
      }
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
      this.host.event.add('dragStart', () => {
        this._dragging = true;
        this.requestUpdate();
      })
    );

    this.disposables.add(
      this.host.event.add('dragEnd', () => {
        this._dragging = false;
        this.requestUpdate();
      })
    );

    // calculate placement
    this.disposables.add(
      this.host.event.add('pointerUp', ctx => {
        let targetRect: DOMRect | null = null;
        if (this.displayType === 'text' || this.displayType === 'native') {
          const range = this.nativeRange;
          assertExists(range);
          targetRect = range.getBoundingClientRect();
        } else if (this.displayType === 'block') {
          const blockElement = this._selectedBlockElements[0];
          if (!blockElement) return;
          targetRect = blockElement.getBoundingClientRect();
        } else {
          return;
        }

        const { top: editorHostTop, bottom: editorHostBottom } =
          this.host.getBoundingClientRect();
        const e = ctx.get('pointerState');
        if (editorHostBottom - targetRect.bottom < 50) {
          this._placement = 'top';
        } else if (targetRect.top - Math.max(editorHostTop, 0) < 50) {
          this._placement = 'bottom';
        } else if (e.raw.y < targetRect.top + targetRect.height / 2) {
          this._placement = 'top';
        } else {
          this._placement = 'bottom';
        }
      })
    );

    // listen to selection change
    this.disposables.add(
      this._selectionManager.slots.changed.on(async () => {
        await this.host.updateComplete;
        const textSelection = pageElement.selection.find('text');
        const blockSelections = pageElement.selection.filter('block');

        if (textSelection) {
          const block = this.host.view.viewFromPath(
            'block',
            textSelection.path
          );
          if (
            !textSelection.isCollapsed() &&
            block &&
            block.model.role === 'content'
          ) {
            this._displayType = 'text';
            assertExists(pageElement.host.rangeManager);

            this.host.std.command
              .pipe()
              .withHost()
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
              return this.blockElement.host.view.viewFromPath('block', path);
            })
            .filter((el): el is BlockElement => !!el);
        } else {
          this._reset();
        }

        this.requestUpdate();
      })
    );
    this.disposables.addFromEvent(document, 'selectionchange', () => {
      const databaseSelection = this.host.selection.find('database');
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

    this._floatDisposables = new DisposableGroup();

    const formatQuickBarElement = this.formatBarElement;
    assertExists(formatQuickBarElement, 'format quick bar should exist');
    if (this.displayType === 'text' || this.displayType === 'native') {
      const range = this.nativeRange;
      if (!range) {
        return;
      }
      const visualElement = {
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => range.getClientRects(),
      };

      this._floatDisposables.add(
        autoUpdate(
          visualElement,
          formatQuickBarElement,
          () => {
            // Why not use `range` and `visualElement` directly:
            // https://github.com/toeverything/blocksuite/issues/5144
            const latestRange = this.nativeRange;
            if (!latestRange) {
              return;
            }
            const latestVisualElement = {
              getBoundingClientRect: () => latestRange.getBoundingClientRect(),
              getClientRects: () => latestRange.getClientRects(),
            };
            computePosition(latestVisualElement, formatQuickBarElement, {
              placement: this._placement,
              middleware: [
                offset(10),
                inline(),
                shift({
                  padding: 6,
                }),
              ],
            })
              .then(({ x, y }) => {
                formatQuickBarElement.style.display = 'flex';
                formatQuickBarElement.style.top = `${y}px`;
                formatQuickBarElement.style.left = `${x}px`;
              })
              .catch(console.error);
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
            })
              .then(({ x, y }) => {
                formatQuickBarElement.style.display = 'flex';
                formatQuickBarElement.style.top = `${y}px`;
                formatQuickBarElement.style.left = `${x}px`;
              })
              .catch(console.error);
          },
          {
            // follow edgeless viewport update
            animationFrame: true,
          }
        )
      );
    }
  }

  private _customRender() {
    const result: TemplateResult[] = [];
    AffineFormatBarWidget._customElements.forEach(render => {
      const element = render.render(this);
      if (element) {
        result.push(element);
      }
    });
    return result.length > 0
      ? html` <div
          style="display: flex;align-items: center;justify-content: center"
        >
          ${result}
        </div>`
      : null;
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
      this._customRender(),
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
          : [...acc, el, html` <div class="divider"></div>`],
      []
    );

    return html` <div
      class="${AFFINE_FORMAT_BAR_WIDGET}"
      @pointerdown="${stopPropagation}"
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
