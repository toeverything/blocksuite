import { CardIcon, HiddenCardIcon } from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import { matchFlavours, type Page } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValueMap } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { TopLevelBlockModel } from '../../../../__internal__/index.js';
import { type ChangeIndexEvent, NavigationCard } from './navigation-card.js';

NavigationCard;

@customElement('edgeless-navigation-panel')
export class NavigationPanel extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .navigation-panel-container {
      background-color: var(--affine-background-overlay-panel-color);
      padding: 17.5px 18.5px;
      box-sizing: border-box;

      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .panel-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;
    }

    .panel-info {
      font-size: 12px;
      font-family: var(--affine-font-family);
      color: var(--affine-text-secondary-color);

      display: flex;
      align-items: flex-start;
      gap: 14px;
      align-self: stretch;
    }

    .panel-info .content {
      flex: 1 0 0;
    }

    .panel-info .icon {
      color: var(--affine-icon-color);
    }

    .panel-info .count {
      font-family: var(--affine-number-font-family);
      font-weight: 600;
    }
  `;

  @state()
  private _showCount = 0;

  @state()
  private _hiddenCount = 0;

  @state()
  private _notes: {
    note: TopLevelBlockModel;
    idx: number;
    hidden: boolean;
  }[] = [];

  @property({ attribute: false })
  page!: Page;

  override connectedCallback(): void {
    super.connectedCallback();
    this._disposables.add(
      this.page.slots.rootAdded.on(() => {
        this.requestUpdate('page');
      })
    );

    this._disposables.add(
      this.page.slots.yUpdated.on(() => {
        this.requestUpdate('page');
      })
    );
  }

  protected override willUpdate(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (_changedProperties.has('page')) {
      this._updateNotes();
    }
  }

  private _updateNotes() {
    this._notes =
      this.page.root?.children.reduce(
        (pre, block, idx) => {
          matchFlavours(block, ['affine:note']) &&
            !block.hidden &&
            pre.push({
              note: block as TopLevelBlockModel,
              idx,
              hidden: block.hidden,
            });

          return pre;
        },
        [] as {
          note: TopLevelBlockModel;
          idx: number;
          hidden: boolean;
        }[]
      ) ?? [];
  }

  private _changeNoteIndex(e: ChangeIndexEvent) {
    if (e.detail.targetIndex > this._notes.length) {
      return;
    }

    const { currentIndex, targetIndex } = e.detail;

    const note = this._notes[currentIndex - 1];
    const siblingNote = this._notes[targetIndex - 1];

    this.page.moveBlocks(
      [note.note],
      this.page.root!,
      siblingNote.note,
      targetIndex < currentIndex
    );
  }

  override render() {
    return html`
      <div class="navigation-panel-container">
        <div class="panel-header">
          <div class="panel-info">
            <span class="icon">${CardIcon}</span>
            <span class="content">
              <span class="count">${this._showCount}</span> cards show on page
            </span>
          </div>
          <div class="panel-info">
            <span class="icon">${HiddenCardIcon}</span>
            <span class="content">
              <span class="count">${this._hiddenCount}</span> cards hidden
            </span>
            <span class="action"></span>
          </div>
        </div>
        <div class="panel-list">
          ${this.page
            ? repeat(
                this._notes,
                note => note.note.id,
                (note, idx) => html`<edgeless-navigation-card
                  .note=${note.note}
                  .idx=${idx + 1}
                  .realIdx=${note.idx}
                  @changeindex=${this._changeNoteIndex}
                ></edgeless-navigation-card>`
              )
            : html`${nothing}`}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-navigation-panel': NavigationPanel;
  }
}
