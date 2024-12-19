import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  menu,
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import {
  CopyIcon,
  DeleteIcon,
  MoreHorizontalIcon,
} from '@blocksuite/affine-components/icons';
import { RANGE_SYNC_EXCLUDE_ATTR } from '@blocksuite/block-std';
import {
  type DataSource,
  DataView,
  dataViewCommonStyle,
  type DataViewProps,
  defineUniComponent,
  type MicrosheetDataViewSelection,
  type MicrosheetDataViewWidget,
  type MicrosheetDataViewWidgetProps,
  MicrosheetSelection,
  renderUniLit,
} from '@blocksuite/microsheet-data-view';
import { widgetPresets } from '@blocksuite/microsheet-data-view/widget-presets';
import { Slice } from '@blocksuite/store';
import { computed, type ReadonlySignal, signal } from '@preact/signals-core';
import { css, nothing, unsafeCSS } from 'lit';
import { html } from 'lit/static-html.js';

import type { NoteBlockComponent } from '../note-block/index.js';
import type { MicrosheetDataViewBlockModel } from './data-view-model.js';

import {
  EdgelessRootBlockComponent,
  type RootService,
} from '../root-block/index.js';

export class MicrosheetDataViewBlockComponent extends CaptionedBlockComponent<MicrosheetDataViewBlockModel> {
  static override styles = css`
    ${unsafeCSS(dataViewCommonStyle('affine-database'))}
    affine-database {
      display: block;
      border-radius: 8px;
      background-color: var(--affine-background-primary-color);
      padding: 8px;
      margin: 8px -8px -8px;
    }

    .database-block-selected {
      background-color: var(--affine-hover-color);
      border-radius: 4px;
    }

    .database-ops {
      margin-top: 4px;
      padding: 2px;
      border-radius: 4px;
      display: flex;
      cursor: pointer;
    }

    .database-ops svg {
      width: 16px;
      height: 16px;
      color: var(--affine-icon-color);
    }

    .database-ops:hover {
      background-color: var(--affine-hover-color);
    }

    @media print {
      .database-ops {
        display: none;
      }

      .database-header-bar {
        display: none !important;
      }
    }
  `;

  private _clickDatabaseOps = (e: MouseEvent) => {
    popMenu(popupTargetFromElement(e.currentTarget as HTMLElement), {
      options: {
        items: [
          menu.input({
            initialValue: this.model.title,
            placeholder: 'Untitled',
            onComplete: text => {
              this.model.title = text;
            },
          }),
          menu.action({
            prefix: CopyIcon,
            name: 'Copy',
            select: () => {
              const slice = Slice.fromModels(this.doc, [this.model]);
              this.std.clipboard.copySlice(slice).catch(console.error);
            },
          }),
          menu.group({
            name: '',
            items: [
              menu.action({
                prefix: DeleteIcon,
                class: { 'delete-item': true },
                name: 'Delete Database',
                select: () => {
                  this.model.children.slice().forEach(block => {
                    this.doc.deleteBlock(block);
                  });
                  this.doc.deleteBlock(this.model);
                },
              }),
            ],
          }),
        ],
      },
    });
  };

  private _dataSource?: DataSource;

  private dataView = new DataView();

  _bindHotkey: DataViewProps['bindHotkey'] = hotkeys => {
    return {
      dispose: this.host.event.bindHotkey(hotkeys, {
        blockId: this.topContenteditableElement?.blockId ?? this.blockId,
      }),
    };
  };

  _handleEvent: DataViewProps['handleEvent'] = (name, handler) => {
    return {
      dispose: this.host.event.add(name, handler, {
        blockId: this.blockId,
      }),
    };
  };

  getRootService = () => {
    return this.std.getService<RootService>('affine:page');
  };

  headerWidget: MicrosheetDataViewWidget = defineUniComponent(
    (props: MicrosheetDataViewWidgetProps) => {
      return html`
        <div style="margin-bottom: 16px;display:flex;flex-direction: column">
          <div style="display:flex;gap:8px;padding: 0 6px;margin-bottom: 8px;">
            <div>${this.model.title}</div>
            ${this.renderDatabaseOps()}
          </div>
          <div
            style="display:flex;align-items:center;justify-content: space-between;gap: 12px"
            class="database-header-bar"
          >
            ${renderUniLit(this.toolsWidget, props)}
          </div>
        </div>
      `;
    }
  );

  selection$: ReadonlySignal<MicrosheetDataViewSelection> = computed(() => {
    const microsheetSelection = this.selection.value.find(
      (selection): selection is MicrosheetSelection => {
        if (selection.blockId !== this.blockId) {
          return false;
        }
        return selection instanceof MicrosheetSelection;
      }
    );
    return microsheetSelection?.viewSelection as MicrosheetDataViewSelection;
  });

  setSelection = (selection: MicrosheetDataViewSelection | undefined) => {
    this.selection.setGroup(
      'note',
      selection
        ? [
            new MicrosheetSelection({
              blockId: this.blockId,
              viewSelection: selection,
            }),
          ]
        : []
    );
  };

  toolsWidget = widgetPresets.createTools({
    table: [],
  });

  get dataSource(): DataSource {
    return this._dataSource as DataSource;
  }

  override get topContenteditableElement() {
    if (this.rootComponent instanceof EdgelessRootBlockComponent) {
      const note = this.closest<NoteBlockComponent>('affine-note');
      return note;
    }
    return this.rootComponent;
  }

  get view() {
    return this.dataView.expose;
  }

  private renderDatabaseOps() {
    if (this.doc.readonly) {
      return nothing;
    }
    return html` <div class="database-ops" @click="${this._clickDatabaseOps}">
      ${MoreHorizontalIcon}
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override renderBlock() {
    return html`
      <div contenteditable="false" style="position: relative">
        ${this.dataView.render({
          virtualPadding$: signal(0),
          bindHotkey: this._bindHotkey,
          handleEvent: this._handleEvent,
          selection$: this.selection$,
          setSelection: this.setSelection,
          dataSource: this.dataSource,
          headerWidget: this.headerWidget,
          std: this.std,
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-microsheet-data-view': MicrosheetDataViewBlockComponent;
  }
}
