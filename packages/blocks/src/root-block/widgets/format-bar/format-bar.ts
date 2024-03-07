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
  shift,
} from '@floating-ui/dom';
import { html, nothing, type TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';

import { HoverController, toast } from '../../../_common/components/index.js';
import { createSimplePortal } from '../../../_common/components/portal.js';
import {
  BoldIcon,
  BulletedListIcon,
  CheckBoxIcon,
  CodeIcon,
  CopyIcon,
  DatabaseTableViewIcon20,
  FontLinkedDocIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ItalicIcon,
  LinkIcon,
  NumberedListIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '../../../_common/icons/index.js';
import { stopPropagation } from '../../../_common/utils/event.js';
import { matchFlavours } from '../../../_common/utils/model.js';
import { isFormatSupported } from '../../../note-block/commands/utils.js';
import { isRootElement } from '../../../root-block/utils/guard.js';
import { HighlightButton } from './components/highlight/highlight-button.js';
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

export type DividerConfigItem = {
  type: 'divider';
};
export type HighlighterDropdownConfigItem = {
  type: 'highlighter-dropdown';
};
export type ParagraphDropdownConfigItem = {
  type: 'paragraph-dropdown';
};
export type InlineActionConfigItem = {
  id: string;
  name: string;
  type: 'inline-action';
  action: (formatBar: AffineFormatBarWidget) => void;
  icon: TemplateResult | (() => HTMLElement);
  isActive: (formatBar: AffineFormatBarWidget) => boolean;
  showWhen: (formatBar: AffineFormatBarWidget) => boolean;
};
export type ParagraphActionConfigItem = {
  id: string;
  type: 'paragraph-action';
  name: string;
  action: (formatBar: AffineFormatBarWidget) => void;
  icon: TemplateResult | (() => HTMLElement);
  flavour: string;
};
export type FormatBarConfigItem =
  | DividerConfigItem
  | HighlighterDropdownConfigItem
  | ParagraphDropdownConfigItem
  | ParagraphActionConfigItem
  | InlineActionConfigItem;

@customElement(AFFINE_FORMAT_BAR_WIDGET)
export class AffineFormatBarWidget extends WidgetElement {
  @state()
  configItems: FormatBarConfigItem[] = [
    {
      type: 'paragraph-dropdown',
    },
    {
      type: 'divider',
    },
    {
      id: 'bold',
      type: 'inline-action',
      name: 'Bold',
      icon: BoldIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'bold' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleBold().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      id: 'italic',
      type: 'inline-action',
      name: 'Italic',
      icon: ItalicIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'italic' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleItalic().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      id: 'underline',
      type: 'inline-action',
      name: 'Underline',
      icon: UnderlineIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'underline' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleUnderline().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      id: 'strike',
      type: 'inline-action',
      name: 'Strike',
      icon: StrikethroughIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'strike' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleStrike().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      id: 'code',
      type: 'inline-action',
      name: 'Code',
      icon: CodeIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'code' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleCode().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      id: 'link',
      type: 'inline-action',
      name: 'Link',
      icon: LinkIcon,
      isActive: formatBar => {
        const [result] = formatBar.std.command
          .chain()
          .isTextStyleActive({ key: 'link' })
          .run();
        return result;
      },
      action: formatBar => {
        formatBar.std.command.chain().toggleLink().run();
      },
      showWhen: formatBar => {
        const [result] = isFormatSupported(formatBar.std).run();
        return result;
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'highlighter-dropdown',
    },
    {
      type: 'divider',
    },
    {
      id: 'copy',
      type: 'inline-action',
      name: 'Copy',
      icon: CopyIcon,
      isActive: () => false,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .getSelectedModels()
          .with({
            onCopy: () => {
              toast(formatBar.host, 'Copied to clipboard');
            },
          })
          .copySelectedModels()
          .run();
      },
      showWhen: () => true,
    },
    {
      id: 'convert-to-database',
      type: 'inline-action',
      name: 'Group as Database',
      icon: DatabaseTableViewIcon20,
      isActive: () => false,
      action: formatBar => {
        createSimplePortal({
          template: html`<database-convert-view
            .host=${formatBar.host}
          ></database-convert-view>`,
        });
      },
      showWhen: formatBar => {
        const [_, ctx] = formatBar.std.command
          .chain()
          .getSelectedModels({
            types: ['block', 'text'],
          })
          .run();
        const { selectedModels } = ctx;
        if (!selectedModels || selectedModels.length === 0) return false;

        const firstBlock = selectedModels[0];
        assertExists(firstBlock);
        if (matchFlavours(firstBlock, ['affine:database'])) {
          return false;
        }

        return true;
      },
    },
    {
      id: 'convert-to-linked-doc',
      type: 'inline-action',
      name: 'Create Linked Doc',
      icon: FontLinkedDocIcon,
      isActive: () => false,
      action: formatBar => {
        const [_, ctx] = formatBar.std.command
          .chain()
          .getSelectedModels({
            types: ['block'],
          })
          .run();
        const { selectedModels } = ctx;
        assertExists(selectedModels);

        const host = formatBar.host;
        host.selection.clear();

        const doc = host.doc;
        const linkedDoc = doc.workspace.createDoc({});
        linkedDoc.load(() => {
          const rootId = linkedDoc.addBlock('affine:page', {
            title: new doc.Text(''),
          });
          linkedDoc.addBlock('affine:surface', {}, rootId);
          const noteId = linkedDoc.addBlock('affine:note', {}, rootId);

          const firstBlock = selectedModels[0];
          assertExists(firstBlock);

          doc.addSiblingBlocks(
            firstBlock,
            [
              {
                flavour: 'affine:embed-linked-doc',
                pageId: linkedDoc.id,
              },
            ],
            'before'
          );

          if (
            matchFlavours(firstBlock, ['affine:paragraph']) &&
            firstBlock.type.match(/^h[1-6]$/)
          ) {
            const title = firstBlock.text.toString();
            linkedDoc.workspace.setDocMeta(linkedDoc.id, {
              title,
            });

            const linkedDocRootModel = linkedDoc.getBlockById(rootId);
            assertExists(linkedDocRootModel);
            linkedDoc.updateBlock(linkedDocRootModel, {
              title: new doc.Text(title),
            });

            doc.deleteBlock(firstBlock);
            selectedModels.shift();
          }

          selectedModels.forEach(model => {
            const keys = model.keys as (keyof typeof model)[];
            const values = keys.map(key => model[key]);
            const blockProps = Object.fromEntries(
              keys.map((key, i) => [key, values[i]])
            );
            linkedDoc.addBlock(model.flavour as never, blockProps, noteId);
            doc.deleteBlock(model);
          });
        });

        const linkedDocService = host.spec.getService(
          'affine:embed-linked-doc'
        );
        linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
      },
      showWhen: formatBar => {
        const [_, ctx] = formatBar.std.command
          .chain()
          .getSelectedModels({
            types: ['block'],
          })
          .run();
        const { selectedModels } = ctx;
        return !!selectedModels && selectedModels.length > 0;
      },
    },
    {
      id: 'affine:paragraph/text',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Text',
      icon: TextIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'text' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h1',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 1',
      icon: Heading1Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h1' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h2',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 2',
      icon: Heading2Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h2' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h3',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 3',
      icon: Heading3Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h3' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h4',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 4',
      icon: Heading4Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h4' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h5',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 5',
      icon: Heading5Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h5' },
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/h6',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Heading 6',
      icon: Heading6Icon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'h6' },
          })
          .run();
      },
    },
    {
      id: 'affine:list/bulleted',
      type: 'paragraph-action',
      flavour: 'affine:list',
      name: 'Bulleted List',
      icon: BulletedListIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:list',
            props: { type: 'bulleted' },
          })
          .run();
      },
    },
    {
      id: 'affine:list/numbered',
      type: 'paragraph-action',
      flavour: 'affine:list',
      name: 'Numbered List',
      icon: NumberedListIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:list',
            props: { type: 'numbered' },
          })
          .run();
      },
    },
    {
      id: 'affine:list/todo',
      type: 'paragraph-action',
      flavour: 'affine:list',
      name: 'To-do List',
      icon: CheckBoxIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:list',
            props: { type: 'todo' },
          })
          .run();
      },
    },
    {
      id: 'affine:code/',
      type: 'paragraph-action',
      flavour: 'affine:code',
      name: 'Code Block',
      icon: CodeIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:code',
          })
          .run();
      },
    },
    {
      id: 'affine:paragraph/quote',
      type: 'paragraph-action',
      flavour: 'affine:paragraph',
      name: 'Quote',
      icon: QuoteIcon,
      action: formatBar => {
        formatBar.std.command
          .chain()
          .updateBlockType({
            flavour: 'affine:paragraph',
            props: { type: 'quote' },
          })
          .run();
      },
    },
  ];

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

  @state()
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

    const readonly = this.doc.awarenessStore.isReadonly(this.doc);
    return !readonly && this.displayType !== 'none' && !this._dragging;
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

      HoverController.globalAbortController?.abort();
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

      HoverController.globalAbortController?.abort();
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

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._abortController.abort();
    this._reset();
  }

  override render() {
    if (!this._shouldDisplay()) {
      return nothing;
    }

    const items = this.configItems
      .filter(item => {
        if (item.type === 'paragraph-action') {
          return false;
        }
        if (item.type === 'highlighter-dropdown') {
          const [supported] = isFormatSupported(this.std).run();
          return supported;
        }
        if (item.type === 'inline-action') {
          return item.showWhen(this);
        }
        return true;
      })
      .map(item => {
        let template: TemplateResult | null = null;
        switch (item.type) {
          case 'divider':
            template = html`<div class="divider"></div>`;
            break;
          case 'highlighter-dropdown': {
            template = HighlightButton(this);
            break;
          }
          case 'paragraph-dropdown':
            template = ParagraphButton(this);
            break;
          case 'inline-action': {
            template = html`<icon-button
              size="32px"
              data-testid=${item.id}
              ?active=${item.isActive(this)}
              @click=${() => {
                item.action(this);
                this.requestUpdate();
              }}
            >
              ${typeof item.icon === 'function' ? item.icon() : item.icon}
              <affine-tooltip>${item.name}</affine-tooltip>
            </icon-button>`;
            break;
          }
          default:
            template = null;
        }

        return [template, item] as const;
      })
      .filter(([template]) => template !== null && template !== undefined)
      .filter(([_, item], index, list) => {
        if (item.type === 'divider') {
          if (index === 0) {
            return false;
          }
          if (index === list.length - 1) {
            return false;
          }
          if (list[index - 1][1].type === 'divider') {
            return false;
          }
        }
        return true;
      })
      .map(([template]) => template);

    return html` <div
      class="${AFFINE_FORMAT_BAR_WIDGET}"
      @pointerdown="${stopPropagation}"
    >
      ${items}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [AFFINE_FORMAT_BAR_WIDGET]: AffineFormatBarWidget;
  }
}
