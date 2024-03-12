import '../../../_common/components/button.js';

import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { WidgetElement } from '@blocksuite/lit';
import {
  autoUpdate,
  computePosition,
  inline,
  offset,
  type Placement,
  type ReferenceElement,
  shift,
} from '@floating-ui/dom';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { HoverController } from '../../../_common/components/index.js';
import type { AffineTextAttributes } from '../../../_common/inline/presets/affine-inline-specs.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { isFormatSupported } from '../../../note-block/commands/utils.js';
import { isRootElement } from '../../../root-block/utils/guard.js';
import { ConfigRenderer } from './components/config-renderer.js';
import {
  type FormatBarConfigItem,
  type InlineActionConfigItem,
  type ParagraphActionConfigItem,
  toolbarDefaultConfig,
} from './config.js';
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

  @state()
  configItems: FormatBarConfigItem[] = [];

  @state()
  private _dragging = false;

  private get _selectionManager() {
    return this.host.selection;
  }

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
    return sl.getRangeAt(0);
  }

  private _abortController = new AbortController();

  private _placement: Placement = 'top';

  private _floatDisposables: DisposableGroup | null = null;

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

    const readonly = this.doc.awarenessStore.isReadonly(this.doc);
    return !readonly && this.displayType !== 'none' && !this._dragging;
  }

  private _calculatePlacement() {
    const rootElement = this.blockElement;

    this.handleEvent('pointerMove', ctx => {
      this._dragging = ctx.get('pointerState').dragging;
    });

    this.handleEvent('pointerUp', () => {
      this._dragging = false;
    });

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

        const update = () => {
          const textSelection = rootElement.selection.find('text');
          const blockSelections = rootElement.selection.filter('block');

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
              assertExists(rootElement.host.rangeManager);

              this.host.std.command
                .chain()
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

              return;
            }

            this._reset();
            return;
          }

          if (blockSelections.length > 0) {
            this._displayType = 'block';
            this._selectedBlockElements = blockSelections
              .map(selection => {
                const path = selection.path;
                return this.blockElement.host.view.viewFromPath('block', path);
              })
              .filter((el): el is BlockElement => !!el);

            return;
          }

          this._reset();
        };

        update();
        this.requestUpdate();
      })
    );
    this.disposables.addFromEvent(document, 'selectionchange', () => {
      const databaseSelection = this.host.selection.find('database');
      if (!databaseSelection) {
        return;
      }

      const reset = () => {
        this._reset();
        this.requestUpdate();
      };
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
    });
  }

  private _listenFloatingElement() {
    const formatQuickBarElement = this.formatBarElement;
    assertExists(formatQuickBarElement, 'format quick bar should exist');

    const listenFloatingElement = (
      getElement: () => ReferenceElement | void
    ) => {
      const initialElement = getElement();
      if (!initialElement) {
        return;
      }

      assertExists(this._floatDisposables);
      HoverController.globalAbortController?.abort();
      this._floatDisposables.add(
        autoUpdate(
          initialElement,
          formatQuickBarElement,
          () => {
            const element = getElement();
            if (!element) return;

            computePosition(element, formatQuickBarElement, {
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
    };

    const getReferenceElementFromBlock = () => {
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
      return {
        getBoundingClientRect: () => rect,
        getClientRects: () =>
          this._selectedBlockElements.map(el => el.getBoundingClientRect()),
      };
    };

    const getReferenceElementFromText = () => {
      const range = this.nativeRange;
      if (!range) {
        return;
      }
      return {
        getBoundingClientRect: () => range.getBoundingClientRect(),
        getClientRects: () => range.getClientRects(),
      };
    };

    switch (this.displayType) {
      case 'text':
      case 'native':
        return listenFloatingElement(getReferenceElementFromText);
      case 'block':
        return listenFloatingElement(getReferenceElementFromBlock);
      default:
        return;
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._abortController = new AbortController();

    const rootElement = this.blockElement;
    assertExists(rootElement);
    const widgets = rootElement.widgets;

    // check if the host use the format bar widget
    if (!Object.hasOwn(widgets, AFFINE_FORMAT_BAR_WIDGET)) {
      return;
    }

    // check if format bar widget support the host
    if (!isRootElement(rootElement)) {
      throw new Error(
        `format bar not support rootElement: ${rootElement.constructor.name} but its widgets has format bar`
      );
    }

    this._calculatePlacement();

    if (this.configItems.length === 0) {
      toolbarDefaultConfig(this);
    }
  }

  override updated() {
    if (!this._shouldDisplay()) {
      if (this._floatDisposables) {
        this._floatDisposables.dispose();
      }
      return;
    }

    this._floatDisposables = new DisposableGroup();
    this._listenFloatingElement();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController.abort();
    this._reset();
  }

  addDivider() {
    this.configItems.push({ type: 'divider' });
    return this;
  }

  addHighlighterDropdown() {
    this.configItems.push({ type: 'highlighter-dropdown' });
    return this;
  }

  addParagraphDropdown() {
    this.configItems.push({ type: 'paragraph-dropdown' });
    return this;
  }

  addInlineAction(config: Omit<InlineActionConfigItem, 'type'>) {
    this.configItems.push({ ...config, type: 'inline-action' });
    return this;
  }

  addParagraphAction(config: Omit<ParagraphActionConfigItem, 'type'>) {
    this.configItems.push({ ...config, type: 'paragraph-action' });
    return this;
  }

  addTextStyleToggle(config: {
    icon: InlineActionConfigItem['icon'];
    key: Exclude<
      keyof AffineTextAttributes,
      'color' | 'background' | 'reference'
    >;
    action: InlineActionConfigItem['action'];
  }) {
    const { key } = config;
    return this.addInlineAction({
      id: key,
      name: camelCaseToWords(key),
      icon: config.icon,
      isActive: chain => {
        const [result] = chain.isTextStyleActive({ key }).run();
        return result;
      },
      action: config.action,
      showWhen: chain => {
        const [result] = isFormatSupported(chain).run();
        return result;
      },
    });
  }

  addBlockTypeSwitch(config: {
    flavour: BlockSuite.Flavour;
    icon: ParagraphActionConfigItem['icon'];
    type?: string;
    name?: string;
  }) {
    const { flavour, type, icon } = config;
    return this.addParagraphAction({
      id: `${flavour}/${type ?? ''}`,
      icon,
      flavour,
      name: config.name ?? camelCaseToWords(type ?? flavour),
      action: chain => {
        chain
          .updateBlockType({
            flavour,
            props: type != null ? { type } : undefined,
          })
          .run();
      },
    });
  }

  addRawConfigItems(configItems: FormatBarConfigItem[], index?: number) {
    if (index === undefined) {
      this.configItems.push(...configItems);
    } else {
      this.configItems.splice(index, 0, ...configItems);
    }
    return this;
  }

  clearConfig() {
    this.configItems = [];
    return this;
  }

  override render() {
    if (!this._shouldDisplay()) {
      return nothing;
    }

    const items = ConfigRenderer(this);

    return html` <div
      class="${AFFINE_FORMAT_BAR_WIDGET}"
      @pointerdown="${stopPropagation}"
    >
      ${items}
    </div>`;
  }
}

function camelCaseToWords(s: string) {
  const result = s.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_FORMAT_BAR_WIDGET]: AffineFormatBarWidget;
  }
}
