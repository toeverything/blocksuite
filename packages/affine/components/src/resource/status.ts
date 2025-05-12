import {
  fontBaseStyle,
  panelBaseColorsStyle,
} from '@blocksuite/affine-shared/styles';
import { unsafeCSSVarV2 } from '@blocksuite/affine-shared/theme';
import {
  createButtonPopper,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
import { WithDisposable } from '@blocksuite/global/lit';
import { InformationIcon } from '@blocksuite/icons/lit';
import { PropTypes, requiredProperties } from '@blocksuite/std';
import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';

@requiredProperties({
  message: PropTypes.string,
  reload: PropTypes.instanceOf(Function),
})
export class ResourceStatus extends WithDisposable(LitElement) {
  static override styles = css`
    button.status {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 18px;
      outline: none;
      border: none;
      cursor: pointer;
      color: ${unsafeCSSVarV2('button/pureWhiteText')};
      background: ${unsafeCSSVarV2('status/error')};
      box-shadow: var(--affine-overlay-shadow);
    }

    ${panelBaseColorsStyle('.popper')}
    ${fontBaseStyle('.popper')}
    .popper {
      display: none;
      outline: none;
      padding: 8px;
      border-radius: 8px;
      width: 260px;
      font-size: var(--affine-font-sm);
      font-style: normal;
      font-weight: 400;
      line-height: 22px;

      &[data-show] {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
    }

    .content {
      color: ${unsafeCSSVarV2('text/primary')};
    }

    .footer {
      display: flex;
      justify-content: flex-end;
    }

    button.reload {
      display: flex;
      align-items: center;
      padding: 2px 12px;
      border-radius: 8px;
      border: none;
      background: none;
      cursor: pointer;
      outline: none;
      color: ${unsafeCSSVarV2('button/primary')};
    }
  `;

  private _popper: ReturnType<typeof createButtonPopper> | null = null;

  private _updatePopper() {
    this._popper?.dispose();
    this._popper = createButtonPopper({
      reference: this._trigger,
      popperElement: this._content,
      mainAxis: 8,
      allowedPlacements: ['top-start', 'bottom-start'],
    });
  }

  override firstUpdated() {
    this._updatePopper();
    this.disposables.addFromEvent(this, 'click', stopPropagation);
    this.disposables.addFromEvent(this, 'keydown', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        this._popper?.hide();
      }
    });
    this.disposables.addFromEvent(this._trigger, 'click', (_: MouseEvent) => {
      this._popper?.toggle();
    });
    this.disposables.addFromEvent(
      this._reloadButton,
      'click',
      (_: MouseEvent) => {
        this._popper?.hide();
        this.reload();
      }
    );
    this.disposables.add(() => this._popper?.dispose());
  }

  override render() {
    return html`
      <button class="status">${InformationIcon()}</button>
      <div class="popper">
        <div class="content">${this.message}</div>
        <div class="footer">
          <button class="reload">Reload</button>
        </div>
      </div>
    `;
  }

  @query('div.popper')
  private accessor _content!: HTMLDivElement;

  @query('button.status')
  private accessor _trigger!: HTMLButtonElement;

  @query('button.reload')
  private accessor _reloadButton!: HTMLButtonElement;

  @property({ attribute: false })
  accessor message!: string;

  @property({ attribute: false })
  accessor reload!: () => void;
}
