import type { ReferenceInfo } from '@blocksuite/affine-model';
import type { AffineTextAttributes } from '@blocksuite/affine-shared/types';
import type { DeltaInsert, InlineRange } from '@blocksuite/inline';

import {
  type LinkEventType,
  type TelemetryEvent,
  TelemetryProvider,
} from '@blocksuite/affine-shared/services';
import { FONT_XS, PANEL_BASE } from '@blocksuite/affine-shared/styles';
import { type BlockStdScope, ShadowlessElement } from '@blocksuite/block-std';
import {
  assertExists,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { DoneIcon, ResetIcon } from '@blocksuite/icons/lit';
import { computePosition, inline, offset, shift } from '@floating-ui/dom';
import { signal } from '@preact/signals-core';
import { css, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

import type { EditorIconButton } from '../../../../../toolbar/index.js';
import type { AffineInlineEditor } from '../../affine-inline-specs.js';

import { REFERENCE_NODE } from '../consts.js';

export class ReferenceAliasPopup extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    :host {
      box-sizing: border-box;
    }

    .overlay-mask {
      position: fixed;
      z-index: var(--affine-z-index-popover);
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
    }

    .alias-form-popup {
      ${PANEL_BASE};
      position: absolute;
      display: flex;
      width: 321px;
      height: 37px;
      gap: 8px;
      box-sizing: content-box;
      justify-content: space-between;
      align-items: center;
      animation: affine-popover-fade-in 0.2s ease;
      z-index: var(--affine-z-index-popover);
    }

    @keyframes affine-popover-fade-in {
      from {
        opacity: 0;
        transform: translateY(-3px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    input {
      display: flex;
      flex: 1;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--affine-text-primary-color);
      ${FONT_XS};
    }
    input::placeholder {
      color: var(--affine-placeholder-color);
    }
    input:focus {
      outline: none;
    }

    editor-icon-button.save .label {
      ${FONT_XS};
      color: inherit;
      text-transform: none;
    }
  `;

  private _onSave = () => {
    const title = this.title$.value.trim();
    if (!title) {
      this.remove();
      return;
    }

    this._setTitle(title);

    track(this.std, 'SavedAlias', { control: 'save' });

    this.remove();
  };

  private _updateTitle = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    this.title$.value = value;
  };

  private _onKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (!e.isComposing) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.remove();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this._onSave();
      }
    }
  }

  private _onReset() {
    this.title$.value = this.docTitle;

    this._setTitle();

    track(this.std, 'ResetedAlias', { control: 'reset' });

    this.remove();
  }

  private _setTitle(title?: string) {
    const reference: AffineTextAttributes['reference'] = {
      type: 'LinkedPage',
      ...this.referenceInfo,
    };

    if (title) {
      reference.title = title;
    } else {
      delete reference.title;
      delete reference.description;
    }

    this.inlineEditor.insertText(this.inlineRange, REFERENCE_NODE, {
      reference,
    });
    this.inlineEditor.setInlineRange({
      index: this.inlineRange.index + REFERENCE_NODE.length,
      length: 0,
    });
  }

  override connectedCallback() {
    super.connectedCallback();

    this.title$.value = this.referenceInfo.title ?? this.docTitle;
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this.overlayMask, 'click', e => {
      e.stopPropagation();
      this.remove();
    });
    this.disposables.addFromEvent(this, 'keydown', this._onKeydown);

    this.inputElement.focus();
    this.inputElement.select();
  }

  override render() {
    return html`
      <div class="overlay-root">
        <div class="overlay-mask"></div>
        <div class="alias-form-popup">
          <input
            id="alias-title"
            type="text"
            placeholder="Add a custom title"
            .value=${live(this.title$.value)}
            @input=${this._updateTitle}
          />
          <editor-icon-button
            aria-label="Reset"
            class="reset"
            .iconContainerPadding=${4}
            .tooltip=${'Reset'}
            @click=${this._onReset}
          >
            ${ResetIcon({ width: '16px', height: '16px' })}
          </editor-icon-button>
          <editor-toolbar-separator></editor-toolbar-separator>
          <editor-icon-button
            aria-label="Save"
            class="save"
            .active=${true}
            @click=${this._onSave}
          >
            ${DoneIcon({ width: '16px', height: '16px' })}
            <span class="label">Save</span>
          </editor-icon-button>
        </div>
      </div>
    `;
  }

  override updated() {
    const range = this.inlineEditor.toDomRange(this.inlineRange);
    assertExists(range);

    const visualElement = {
      getBoundingClientRect: () => range.getBoundingClientRect(),
      getClientRects: () => range.getClientRects(),
    };
    computePosition(visualElement, this.popupContainer, {
      middleware: [
        offset(10),
        inline(),
        shift({
          padding: 6,
        }),
      ],
    })
      .then(({ x, y }) => {
        const popupContainer = this.popupContainer;
        if (!popupContainer) return;
        popupContainer.style.left = `${x}px`;
        popupContainer.style.top = `${y}px`;
      })
      .catch(console.error);
  }

  @property({ type: Object })
  accessor delta!: DeltaInsert<AffineTextAttributes>;

  @property({ attribute: false })
  accessor docTitle!: string;

  @property({ attribute: false })
  accessor inlineEditor!: AffineInlineEditor;

  @property({ attribute: false })
  accessor inlineRange!: InlineRange;

  @query('input#alias-title')
  accessor inputElement!: HTMLInputElement;

  @query('.overlay-mask')
  accessor overlayMask!: HTMLDivElement;

  @query('.alias-form-popup')
  accessor popupContainer!: HTMLDivElement;

  @property({ type: Object })
  accessor referenceInfo!: ReferenceInfo;

  @query('editor-icon-button.save')
  accessor saveButton!: EditorIconButton;

  @property({ attribute: false })
  accessor std!: BlockStdScope;

  accessor title$ = signal<string>('');
}

function track(
  std: BlockStdScope,
  event: LinkEventType,
  props: Partial<TelemetryEvent>
) {
  std.getOptional(TelemetryProvider)?.track(event, {
    segment: 'toolbar',
    page: 'doc editor',
    module: 'reference edit popup',
    type: 'inline view',
    category: 'linked doc',
    ...props,
  });
}
