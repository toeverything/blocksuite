import { Slice } from '@blocksuite/store';
import { autoPlacement, offset } from '@floating-ui/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { type Menu, popMenu } from '../../_common/components/index.js';
import { toast } from '../../_common/components/toast.js';
import {
  AIStarIcon,
  CancelWrapIcon,
  CaptionIcon,
  CommentIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  MoreVerticalIcon,
  WrapIcon,
} from '../../_common/icons/index.js';
import type { CodeBlockComponent } from '../code-block.js';

@customElement('affine-code-block-actions')
export class CodeBlockActions extends LitElement {
  static override styles = css`
    .code-actions {
      display: flex;
      gap: 5px;
      font-size: var(--affine-font-sm);
      line-height: var(--affine-line-height);
    }

    .code-action-button {
      background-color: var(--affine-background-primary-color);
      box-shadow: var(--affine-shadow-1);
      display: flex;
      justify-content: flex-start;
      gap: 3px;
      padding: 8px;
    }

    .code-action-button.ai {
      color: var(--affine-primary-color);
    }

    .code-action-button:hover {
      background-color: var(--affine-hover-color);
    }
  `;
  @property({ attribute: false })
  anchor!: CodeBlockComponent;

  // this is a override
  get model() {
    return this.anchor.model;
  }

  private _copyCode = () => {
    const anchor = this.anchor;
    const slice = Slice.fromModels(this.model.doc, [this.model]);
    anchor.std.clipboard
      .copySlice(slice)
      .then(() => {
        toast(anchor.host, 'Copied to clipboard');
      })
      .catch(e => {
        toast(anchor.host, 'Copied failed, something went wrong');
        console.error(e);
      });
  };

  private _duplicateCode = () => {
    const { text, language, wrap, flavour } = this.model;
    // FIXME
    const newProps = { text: text.clone(), language, wrap, flavour };
    const [codeId] = this.model.doc.addSiblingBlocks(this.model, [newProps]);
    const editorHost = this.anchor.host;

    editorHost.selection.setGroup('note', [
      editorHost.selection.create('block', {
        blockId: codeId,
      }),
    ]);
  };

  private _popMoreActions = (e: MouseEvent) => {
    this.style.visibility = 'visible';
    const el = e.currentTarget as HTMLElement;
    const readonly = this.anchor.readonly;

    const items: Menu[] = [
      ...((!readonly
        ? [
            {
              type: 'action',
              name: this.model.wrap ? 'Cancel Wrap' : 'Wrap',
              icon: this.model.wrap ? CancelWrapIcon : WrapIcon,
              select: () => {
                this.anchor.setWrap(!this.model.wrap);
              },
            },
          ]
        : []) as Menu[]),
      {
        type: 'action',
        name: 'Duplicate',
        select: () => {
          this._duplicateCode();
        },
        icon: DuplicateIcon,
      },
      ...((!readonly
        ? [
            {
              type: 'group',
              name: '',
              children: () => [
                {
                  type: 'action',
                  class: 'delete-item',
                  name: 'Delete',
                  select: () => {
                    this.model.doc.deleteBlock(this.model);
                  },
                  icon: DeleteIcon,
                },
              ],
            },
          ]
        : []) as Menu[]),
    ];

    popMenu(el, {
      placement: 'bottom-end',
      middleware: [
        offset(5),
        autoPlacement({
          allowedPlacements: ['bottom-start', 'bottom-end'],
        }),
      ],
      options: {
        items,
        onClose: () => {
          this.style.visibility = '';
        },
      },
    });
  };

  override render() {
    const readonly = this.anchor.readonly;
    return html` <div contenteditable="false" class="code-actions">
      <icon-button
        class="code-action-button ai"
        data-testid="ask-ai-button"
        width="auto"
        height="24px"
        ?disabled=${readonly}
      >
        ${AIStarIcon} Ask AI
      </icon-button>

      <icon-button
        class="code-action-button"
        data-testid="copy-button"
        width="auto"
        height="24px"
        @click=${this._copyCode}
      >
        ${CopyIcon}

        <affine-tooltip tip-position="top" .offset=${5}
          >Copy Code</affine-tooltip
        >
      </icon-button>

      <icon-button
        class="code-action-button"
        data-testid="comment-button"
        width="auto"
        height="24px"
      >
        ${CommentIcon}

        <affine-tooltip tip-position="top" .offset=${5}>Comment</affine-tooltip>
      </icon-button>

      <icon-button
        class="code-action-button"
        data-testid="caption-button"
        width="auto"
        height="24px"
      >
        ${CaptionIcon}

        <affine-tooltip tip-position="top" .offset=${5}>Caption</affine-tooltip>
      </icon-button>

      <icon-button
        class="code-action-button"
        data-testid="more-button"
        width="auto"
        height="24px"
        @click=${this._popMoreActions}
      >
        ${MoreVerticalIcon}

        <affine-tooltip tip-position="top" .offset=${5}>More</affine-tooltip>
      </icon-button>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-code-block-actions': CodeBlockActions;
  }
}
