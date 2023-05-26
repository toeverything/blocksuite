import '../../components/button.js';

import { WithDisposable } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import * as Y from 'yjs';

import { toast } from '../..//components/toast.js';
import { copyBlocks } from '../../__internal__/clipboard/index.js';
import { tooltipStyle } from '../../components/tooltip/tooltip.js';
import type { BookmarkBlockModel } from '../bookmark-model.js';
import { type BookmarkProps, defaultBookmarkProps } from '../bookmark-model.js';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  LinkIcon,
  RefreshIcon,
} from '../images/icons.js';
import { refreshBookmarkBlock } from '../utils.js';

export type ConfigItem = {
  type:
    | 'link'
    | 'edit'
    | 'refresh'
    | 'copy'
    | 'delete'
    | 'duplicate'
    | 'caption';
  icon: TemplateResult;
  tooltip: string;
  action: (
    model: BaseBlockModel<BookmarkBlockModel>,
    callback?: ToolbarActionCallback
  ) => void;
  divider?: boolean;
};

export type ToolbarActionCallback = (type: ConfigItem['type']) => void;
const config: ConfigItem[] = [
  {
    type: 'link',
    icon: LinkIcon,
    tooltip: 'Turn into Link view',
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const yText = new Y.Text();
      yText.insert(0, model.title || model.caption || model.url);
      yText.format(0, model.url.length, { link: model.url });
      const text = new page.Text(yText);
      page.addBlock(
        'affine:paragraph',
        {
          text,
        },
        parent,
        index
      );

      model.page.deleteBlock(model);
      callback?.('link');
    },
    divider: true,
  },
  {
    type: 'caption',
    icon: CaptionIcon,
    tooltip: 'Add Caption',
    action: (model, callback) => {
      callback?.('caption');
    },
  },
  {
    type: 'edit',
    icon: EditIcon,
    tooltip: 'Edit',
    action: (model, callback) => {
      callback?.('edit');
    },
    divider: true,
  },

  {
    type: 'copy',
    icon: CopyIcon,
    tooltip: 'Copy',
    action: (model, callback) => {
      copyBlocks({
        type: 'Block',
        models: [model],
        startOffset: 0,
        endOffset: 0,
      });
      toast('Copied Database to clipboard');
      callback?.('copy');
    },
  },
  {
    type: 'duplicate',
    icon: DuplicateIcon,
    tooltip: 'Duplicate',
    action: (model, callback) => {
      const { page } = model;

      const parent = page.getParent(model);
      const index = parent?.children.indexOf(model);

      const clonedProps = Object.keys(
        defaultBookmarkProps
      ).reduce<BookmarkProps>((props, key) => {
        props[key] = model[key];
        return props;
      }, {} as BookmarkProps);

      page.addBlock('affine:bookmark', clonedProps, parent, index);

      callback?.('duplicate');
    },
  },
  {
    type: 'refresh',
    icon: RefreshIcon,
    tooltip: 'Refresh',
    action: (model, callback) => {
      refreshBookmarkBlock(model, true).then(() => {
        callback?.('refresh');
      });
    },
  },
  {
    type: 'delete',
    icon: DeleteIcon,
    tooltip: 'Delete',
    action: (model, callback) => {
      model.page.deleteBlock(model);
      callback?.('delete');
    },
  },
];

@customElement('bookmark-toolbar')
export class BookmarkToolbar extends WithDisposable(LitElement) {
  static override styles = css`
    ${tooltipStyle}
    .bookmark-bar {
      box-sizing: border-box;
      position: absolute;
      right: 0;
      top: -40px;
      display: flex;
      align-items: center;
      padding: 4px 8px;
      gap: 4px;
      height: 40px;

      border-radius: 8px;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
      z-index: var(--affine-z-index-popover);
      user-select: none;
    }
    .divider {
      width: 1px;
      height: 24px;
      background-color: var(--affine-border-color);
    }
  `;

  @property()
  model!: BaseBlockModel;

  @property()
  onSelected?: ToolbarActionCallback;

  @query('.bookmark-bar')
  formatQuickBarElement!: HTMLElement;

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    return html`
      <div class="bookmark-bar">
        ${config.map(({ icon, tooltip, action, divider }) => {
          return html`<icon-button
              width="32px"
              height="32px"
              class="has-tool-tip"
              @click=${() => {
                action(this.model, this.onSelected);
              }}
            >
              ${icon}
              <tool-tip inert role="tooltip">${tooltip}</tool-tip>
            </icon-button>
            ${divider ? html`<div class="divider"></div>` : nothing} `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-toolbar': BookmarkToolbar;
  }
}
