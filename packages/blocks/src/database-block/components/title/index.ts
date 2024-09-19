import type { RichText } from '@blocksuite/affine-components/rich-text';
import type { InlineRange } from '@blocksuite/inline';
import type { Text } from '@blocksuite/store';

import { getViewportElement } from '@blocksuite/affine-shared/utils';
import { ShadowlessElement } from '@blocksuite/block-std';
import { assertExists, WithDisposable } from '@blocksuite/global/utils';
import { effect } from '@preact/signals-core';
import { css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { DatabaseBlockComponent } from '../../database-block.js';

export class DatabaseTitle extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .affine-database-title {
      position: relative;
      flex: 1;
    }

    .database-title {
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
      color: var(--affine-text-primary-color);
      font-family: inherit;
      /* overflow-x: scroll; */
      overflow: hidden;
      cursor: text;
    }

    .database-title [data-v-text='true'] {
      display: block;
      word-break: break-all !important;
    }

    .database-title.ellipsis [data-v-text='true'] {
      white-space: nowrap !important;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .affine-database-title [data-title-empty='true']::before {
      content: 'Untitled';
      position: absolute;
      pointer-events: none;
      color: var(--affine-text-primary-color);
    }

    .affine-database-title [data-title-focus='true']::before {
      color: var(--affine-placeholder-color);
    }
  `;

  private _onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.isComposing) {
      // prevent insert v-line
      event.preventDefault();
      // insert new row
      this.onPressEnterKey?.();
      return;
    }
  };

  get database() {
    return this.closest<DatabaseBlockComponent>('affine-database');
  }

  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }

  get topContenteditableElement() {
    return this.database?.topContenteditableElement;
  }

  override firstUpdated() {
    // for title placeholder
    this.titleText.yText.observe(() => {
      this.requestUpdate();
    });

    this.updateComplete
      .then(() => {
        this.disposables.add(
          this.inlineEditor.slots.keydown.on(this._onKeyDown)
        );

        this.disposables.add(
          this.inlineEditor.slots.inputting.on(() => {
            this.isComposing = this.inlineEditor.isComposing;
          })
        );

        let beforeInlineRange: InlineRange | null = null;
        this.disposables.add(
          effect(() => {
            const inlineRange = this.inlineEditor.inlineRange$.value;
            if (inlineRange) {
              if (!beforeInlineRange) {
                this.isActive = true;
              }
            } else {
              if (beforeInlineRange) {
                this.isActive = false;
              }
            }
            beforeInlineRange = inlineRange;
          })
        );
      })
      .catch(console.error);
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  override render() {
    const isEmpty =
      (!this.titleText || !this.titleText.length) && !this.isComposing;

    const classList = classMap({
      'database-title': true,
      ellipsis: !this.isActive,
    });

    return html`<div class="affine-database-title">
      <rich-text
        .yText=${this.titleText.yText}
        .inlineEventSource=${this.topContenteditableElement}
        .undoManager=${this.database?.doc.history}
        .enableFormat=${false}
        .readonly=${this.readonly}
        .verticalScrollContainerGetter=${() =>
          this.topContenteditableElement?.host
            ? getViewportElement(this.topContenteditableElement.host)
            : null}
        class="${classList}"
        data-title-empty="${isEmpty}"
        data-title-focus="${this.isActive}"
        data-block-is-database-title="true"
        title="${this.titleText.toString()}"
      ></rich-text>
      <div class="database-title" style="float:left;height: 0;">Untitled</div>
    </div>`;
  }

  @state()
  private accessor isActive = false;

  @state()
  accessor isComposing = false;

  @property({ attribute: false })
  accessor onPressEnterKey: (() => void) | undefined = undefined;

  @property({ attribute: false })
  accessor readonly!: boolean;

  @query('rich-text')
  private accessor richText!: RichText;

  @property({ attribute: false })
  accessor titleText!: Text;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
