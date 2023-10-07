import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { z } from 'zod';

import type { RichText } from '../../../components/rich-text/rich-text.js';

@customElement('affine-database-title')
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

    .database-title [data-virgo-text='true'] {
      display: block;
      word-break: break-all !important;
    }

    .database-title.ellipsis [data-virgo-text='true'] {
      white-space: nowrap !important;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .database-title-empty [data-virgo-root='true']::before {
      content: 'Untitled';
      position: absolute;
      pointer-events: none;
      color: var(--affine-text-primary-color);
    }

    .database-title-empty [data-virgo-root='true']:focus::before {
      color: var(--affine-placeholder-color);
    }
  `;

  @property({ attribute: false })
  titleText!: Text;

  @property({ attribute: false })
  readonly!: boolean;

  @property({ attribute: false })
  onPressEnterKey?: () => void;

  @state()
  isComposing = false;

  @query('rich-text')
  private richText!: RichText;
  get vEditor() {
    assertExists(this.richText.vEditor);
    return this.richText.vEditor;
  }
  get vEditorContainer() {
    return this.vEditor.rootElement;
  }

  override firstUpdated() {
    // for title placeholder
    this.titleText.yText.observe(() => {
      this.requestUpdate();
    });

    this.updateComplete.then(() => {
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'focus',
        this._onTitleFocus
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'blur',
        this._onTitleBlur
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'compositionstart',
        () => {
          this.isComposing = true;
        }
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'compositionend',
        () => {
          this.isComposing = false;
        }
      );
      this.disposables.addFromEvent(
        this.vEditorContainer,
        'keydown',
        this._onKeyDown
      );
    });
  }

  override async getUpdateComplete(): Promise<boolean> {
    const result = await super.getUpdateComplete();
    await this.richText?.updateComplete;
    return result;
  }

  private _onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.isComposing) {
      // prevent insert v-line
      event.preventDefault();
      // insert new row
      this.onPressEnterKey?.();
      return;
    }
  };

  @state()
  private isActive = false;
  private _onTitleFocus = () => {
    this.isActive = true;
  };
  private _onTitleBlur = () => {
    this.isActive = false;
  };

  override render() {
    const isEmpty =
      (!this.titleText || !this.titleText.length) && !this.isComposing;

    const classList = classMap({
      'database-title': true,
      'database-title-empty': isEmpty,
      ellipsis: !this.isActive,
    });
    return html`<div class="affine-database-title">
      <rich-text
        .yText=${this.titleText.yText}
        .attributesSchema=${z.object({})}
        .readonly=${this.readonly}
        class="${classList}"
        data-block-is-database-title="true"
        title="${this.titleText.toString()}"
      ></rich-text>
      <div class="database-title" style="float:left;height: 0;">Untitled</div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-database-title': DatabaseTitle;
  }
}
