import { assertExists } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { RichText } from '../../../_common/components/rich-text/rich-text.js';
import type { DatabaseBlockComponent } from '../../database-block.js';

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

    .database-title [data-v-text='true'] {
      display: block;
      word-break: break-all !important;
    }

    .database-title.ellipsis [data-v-text='true'] {
      white-space: nowrap !important;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .database-title-empty [data-v-root='true']::before {
      content: 'Untitled';
      position: absolute;
      pointer-events: none;
      color: var(--affine-text-primary-color);
    }

    .database-title-empty [data-v-root='true']:focus::before {
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
  get inlineEditor() {
    assertExists(this.richText.inlineEditor);
    return this.richText.inlineEditor;
  }
  get inlineEditorContainer() {
    return this.inlineEditor.rootElement;
  }
  get topContenteditableElement() {
    const databaseBlock =
      this.closest<DatabaseBlockComponent>('affine-database');
    return databaseBlock?.topContenteditableElement;
  }

  override firstUpdated() {
    // for title placeholder
    this.titleText.yText.observe(() => {
      this.requestUpdate();
    });

    this.updateComplete
      .then(() => {
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'focus',
          this._onTitleFocus
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'blur',
          this._onTitleBlur
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionstart',
          () => {
            this.isComposing = true;
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'compositionend',
          () => {
            this.isComposing = false;
          }
        );
        this.disposables.addFromEvent(
          this.inlineEditorContainer,
          'keydown',
          this._onKeyDown
        );
      })
      .catch(console.error);
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
        .inlineEventSource=${this.topContenteditableElement}
        .enableFormat=${false}
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
