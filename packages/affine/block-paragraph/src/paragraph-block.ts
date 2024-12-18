import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { InlineRangeProvider } from '@blocksuite/inline';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  DefaultInlineManagerExtension,
  type RichText,
} from '@blocksuite/affine-components/rich-text';
import { TOGGLE_BUTTON_PARENT_CLASS } from '@blocksuite/affine-components/toggle-button';
import {
  BLOCK_CHILDREN_CONTAINER_PADDING_LEFT,
  NOTE_SELECTOR,
} from '@blocksuite/affine-shared/consts';
import { DocModeProvider } from '@blocksuite/affine-shared/services';
import {
  calculateCollapsedSiblings,
  getNearestHeadingBefore,
  getViewportElement,
} from '@blocksuite/affine-shared/utils';
import { getInlineRangeProvider } from '@blocksuite/block-std';
import { effect, signal } from '@preact/signals-core';
import { html, nothing, type TemplateResult } from 'lit';
import { query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import type { ParagraphBlockService } from './paragraph-service.js';

import { paragraphBlockStyles } from './styles.js';

export class ParagraphBlockComponent extends CaptionedBlockComponent<
  ParagraphBlockModel,
  ParagraphBlockService
> {
  static override styles = paragraphBlockStyles;

  private _composing = signal(false);

  private _displayPlaceholder = signal(false);

  private _inlineRangeProvider: InlineRangeProvider | null = null;

  private _isInDatabase = () => {
    let parent = this.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName.toLowerCase() === 'affine-database') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  };

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get collapsedSiblings() {
    return calculateCollapsedSiblings(this.model);
  }

  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  get inEdgelessText() {
    return (
      this.topContenteditableElement?.tagName.toLowerCase() ===
      'affine-edgeless-text'
    );
  }

  get inlineEditor() {
    return this._richTextElement?.inlineEditor;
  }

  get inlineManager() {
    return this.std.get(DefaultInlineManagerExtension.identifier);
  }

  get markdownShortcutHandler() {
    return this.inlineManager.markdownShortcutHandler;
  }

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(NOTE_SELECTOR);
    }
    return this.rootComponent;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent(
      'compositionStart',
      () => {
        this._composing.value = true;
      },
      { flavour: true }
    );
    this.handleEvent(
      'compositionEnd',
      () => {
        this._composing.value = false;
      },
      { flavour: true }
    );

    this._inlineRangeProvider = getInlineRangeProvider(this);

    this.disposables.add(
      effect(() => {
        const composing = this._composing.value;
        if (composing || this.doc.readonly) {
          this._displayPlaceholder.value = false;
          return;
        }
        const textSelection = this.host.selection.find('text');
        const isCollapsed = textSelection?.isCollapsed() ?? false;
        if (!this.selected || !isCollapsed) {
          this._displayPlaceholder.value = false;
          return;
        }

        this.updateComplete
          .then(() => {
            if (
              (this.inlineEditor?.yTextLength ?? 0) > 0 ||
              this._isInDatabase()
            ) {
              this._displayPlaceholder.value = false;
              return;
            }
            this._displayPlaceholder.value = true;
            return;
          })
          .catch(console.error);
      })
    );

    // collapsed change effect
    this.disposables.add(
      effect(() => {
        const collapsed = this.model.collapsed$.value;
        this._readonlyCollapsed = collapsed;

        if (!collapsed) return;

        const collapsedSiblings = this.collapsedSiblings;
        const textSelection = this.host.selection.find('text');
        const blockSelection = this.host.selection.find('block');

        if (
          textSelection &&
          collapsedSiblings.some(
            sibling => sibling.id === textSelection.blockId
          )
        ) {
          this.host.selection.clear(['text']);
        }

        if (
          blockSelection &&
          collapsedSiblings.some(
            sibling => sibling.id === blockSelection.blockId
          )
        ) {
          this.host.selection.clear(['block']);
        }
      })
    );

    // type change effect
    let beforeType = this.model.type;
    this.disposables.add(
      effect(() => {
        const type = this.model.type$.value;
        if (beforeType !== type && !type.startsWith('h')) {
          const nearestHeading = getNearestHeadingBefore(this.model);
          if (
            nearestHeading &&
            nearestHeading.type.startsWith('h') &&
            nearestHeading.collapsed &&
            !this.doc.readonly
          ) {
            this.model.collapsed = false;
          }
        }
        beforeType = type;
      })
    );
  }

  override async getUpdateComplete() {
    const result = await super.getUpdateComplete();
    await this._richTextElement?.updateComplete;
    return result;
  }

  override renderBlock(): TemplateResult<1> {
    const { type$ } = this.model;
    const collapsed = this.doc.readonly
      ? this._readonlyCollapsed
      : this.model.collapsed;
    const collapsedSiblings = this.collapsedSiblings;

    let style = html``;
    if (this.model.type.startsWith('h') && collapsed) {
      style = html`
        <style>
          ${collapsedSiblings.map(sibling =>
            unsafeHTML(`
              [data-block-id="${sibling.id}"] {
                display: none;
              }
            `)
          )}
        </style>
      `;
    }

    const children = html`<div
      class="affine-block-children-container"
      style=${styleMap({
        paddingLeft: `${BLOCK_CHILDREN_CONTAINER_PADDING_LEFT}px`,
        display: collapsed ? 'none' : undefined,
      })}
    >
      ${this.renderChildren(this.model)}
    </div>`;

    return html`
      ${style}
      <div class="affine-paragraph-block-container">
        <div
          class=${classMap({
            'affine-paragraph-rich-text-wrapper': true,
            [type$.value]: true,
            [TOGGLE_BUTTON_PARENT_CLASS]: true,
          })}
        >
          ${this.model.type.startsWith('h') && collapsedSiblings.length > 0
            ? html`
                <affine-paragraph-heading-icon
                  .model=${this.model}
                ></affine-paragraph-heading-icon>
                <blocksuite-toggle-button
                  .collapsed=${collapsed}
                  .updateCollapsed=${(value: boolean) => {
                    if (this.doc.readonly) {
                      this._readonlyCollapsed = value;
                    } else {
                      this.doc.captureSync();
                      this.doc.updateBlock(this.model, {
                        collapsed: value,
                      });
                    }
                  }}
                ></blocksuite-toggle-button>
              `
            : nothing}
          <rich-text
            .yText=${this.model.text.yText}
            .inlineEventSource=${this.topContenteditableElement ?? nothing}
            .undoManager=${this.doc.history}
            .attributesSchema=${this.attributesSchema}
            .attributeRenderer=${this.attributeRenderer}
            .markdownShortcutHandler=${this.markdownShortcutHandler}
            .embedChecker=${this.embedChecker}
            .readonly=${this.doc.readonly}
            .inlineRangeProvider=${this._inlineRangeProvider}
            .enableClipboard=${false}
            .enableUndoRedo=${false}
            .verticalScrollContainerGetter=${() =>
              getViewportElement(this.host)}
          ></rich-text>
          ${this.inEdgelessText
            ? nothing
            : html`
                <div
                  contenteditable="false"
                  class=${classMap({
                    'affine-paragraph-placeholder': true,
                    visible: this._displayPlaceholder.value,
                  })}
                >
                  ${this.service.placeholderGenerator(this.model)}
                </div>
              `}
        </div>

        ${children}
      </div>
    `;
  }

  @state()
  private accessor _readonlyCollapsed = false;

  @query('rich-text')
  private accessor _richTextElement: RichText | null = null;

  override accessor blockContainerStyles = {
    margin: 'var(--affine-paragraph-margin, 10px 0)',
  };
}
